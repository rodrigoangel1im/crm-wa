import LoadingBars from '../../components/LoadingBars/LoadingBars'
import '../EsteiraSimulacoes/EsteiraSimulacoes.css'
import { supabase } from '../../lib/supabase'
import { useState, useEffect } from 'react'

export default function AguardandoSimulacao({ setPaginaAtual }) {
  const [simulacoes, setSimulacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroValor, setFiltroValor] = useState('')
  const ITENS_POR_PAGINA = 20

  const perfil = localStorage.getItem('usuario_perfil_crmwa') || ''
  const isAdmin = localStorage.getItem('usuario_admin_crmwa') === 'true'
  const podeClicarStatus = isAdmin || perfil === 'Operacional' || perfil === 'Administrador'

  useEffect(() => {
    carregarSimulacoes(pagina)
  }, [pagina])

  function handleStatusClick(sim) {
    if (!podeClicarStatus) return
    localStorage.setItem('selectedSimulacao_crmwa', JSON.stringify(sim))
    setPaginaAtual('detalhe-simulacao')
  }

  async function queryFallback(start, end) {
    let q = supabase
      .from('solicitacao_simulacao')
      .select(`
        id, cpf, status, status_id, criado_em, usuario_id,
        usuario:usuario_id (nome),
        convenio:convenio_id (nome)
      `, { count: 'exact' })

    if (filtroValor.trim()) {
      if (filtroTipo === 'CPF') {
        const cpfLimpo = filtroValor.replace(/\D/g, '')
        q = q.ilike('cpf', `%${cpfLimpo}%`)
      } else if (filtroTipo === 'Status') {
        q = q.ilike('status', `%${filtroValor.trim()}%`)
      }
    }

    const { data, error, count } = await q
      .order('atualizado_em', { ascending: true, nullsFirst: false })
      .range(start, end)
    if (error || !data) return null
    return {
      data: data.map(item => ({ ...item, status_simulacao: null })),
      totalPaginas: count ? Math.ceil(count / ITENS_POR_PAGINA) : 1,
    }
  }

  async function carregarSimulacoes(page = 1) {
    try {
      setLoading(true)

      const start = (page - 1) * ITENS_POR_PAGINA
      const end = start + ITENS_POR_PAGINA - 1

      let query = supabase
        .from('solicitacao_simulacao')
        .select(`
          id,
          cpf,
          status,
          status_id,
          status_simulacao:status_id (nome, cor),
          criado_em,
          usuario_id,
          usuario:usuario_id (nome),
          convenio:convenio_id (nome)
        `, { count: 'exact' })

      if (filtroValor.trim()) {
        if (filtroTipo === 'CPF') {
          const cpfLimpo = filtroValor.replace(/\D/g, '')
          query = query.ilike('cpf', `%${cpfLimpo}%`)
        } else if (filtroTipo === 'Status') {
          query = query.ilike('status', `%${filtroValor.trim()}%`)
        }
      }

      const { data, error, count } = await query
        .order('atualizado_em', { ascending: true, nullsFirst: false })
        .range(start, end)

      const dados = error?.code === '42703'
        ? await queryFallback(start, end)
        : { data, totalPaginas: count ? Math.ceil(count / ITENS_POR_PAGINA) : 1 }

      if (!dados || !dados.data || dados.data.length === 0) {
        setSimulacoes([])
        setTotalPaginas(1)
        return
      }

      const ids = dados.data.map(s => s.id)

      const { data: pessoaisData } = await supabase
        .from('informacoes_pessoais_simulacao')
        .select('solicitacao_id, nome')
        .in('solicitacao_id', ids)

      const nomePorSolicitacao = {}
      if (pessoaisData) {
        pessoaisData.forEach(p => {
          nomePorSolicitacao[p.solicitacao_id] = p.nome
        })
      }

      let formatadas = dados.data.map(item => {
        const raw = item.criado_em
        const criado = new Date(raw ? (raw.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(raw) ? raw : raw + 'Z') : undefined)
        const ano = criado.getFullYear()
        const mes = String(criado.getMonth() + 1).padStart(2, '0')
        const dia = String(criado.getDate()).padStart(2, '0')
        const hora = String(criado.getHours()).padStart(2, '0')
        const minuto = String(criado.getMinutes()).padStart(2, '0')
        return {
          id: item.id,
          nome: nomePorSolicitacao[item.id] || 'N/A',
          cpf: item.cpf,
          status: item.status_simulacao?.nome || item.status || 'pendente',
          status_cor: item.status_simulacao?.cor || '',
          convenio: item.convenio?.nome || 'N/A',
          usuario: item.usuario?.nome || 'N/A',
          data: `${dia}/${mes}/${ano}`,
          hora: `${hora}:${minuto}`,
          criado_em: item.criado_em,
        }
      })

      if (filtroTipo === 'Nome' && filtroValor.trim()) {
        const termo = filtroValor.trim().toLowerCase()
        formatadas = formatadas.filter(s => s.nome.toLowerCase().includes(termo))
      }

      formatadas = formatadas.filter(s => {
        const nome = (s.status || '').toLowerCase()
        return nome !== 'simulado' && nome !== 'cancelado'
      })

      setSimulacoes(formatadas)
      setTotalPaginas(dados.totalPaginas)
    } catch (error) {
      console.error('Erro ao carregar simulações:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'aprovado') return 'status-aprovado'
    if (s === 'reprovado') return 'status-reprovado'
    if (s === 'cancelado') return 'status-cancelado'
    if (s === 'pendente') return 'status-pendente'
    if (s === 'analise' || s === 'em análise') return 'status-analise'
    return ''
  }

  if (loading) {
    return <LoadingBars />
  }

  return (
    <div className="form-container">
      <header className="form-header">
        <h1>Aguardando Simulação</h1>
        <p className="header-subtitle">Simulações pendentes, em análise, aprovadas e reprovadas</p>
      </header>

      <div className="form-content" style={{ width: '95%', maxWidth: '1500px' }}>
        <div className="status-badge">Aguardando Simulação</div>

        <div className="filtros-wrapper" style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'flex-end' }}>
          <div className="campo-grupo">
            <label>Pesquisar por:</label>
            <select className="input-estilizado" style={{ width: '200px' }} value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPagina(1); carregarSimulacoes(1) }}>
              <option>Todos</option>
              <option>Nome</option>
              <option>CPF</option>
              <option>Status</option>
            </select>
          </div>
          <div className="campo-grupo" style={{ flex: '0 0 300px' }}>
            <label>Buscar:</label>
            <input type="text" className="input-estilizado" placeholder="Digite para pesquisar..." value={filtroValor} onChange={e => { setFiltroValor(e.target.value); setPagina(1); carregarSimulacoes(1) }} />
          </div>
          <button className="btn-refresh" onClick={() => { setPagina(1); carregarSimulacoes(1) }} title="Atualizar lista">
            ↻
          </button>
        </div>

        <div className="tabela-container">
          <table className="tabela-propostas">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>CPF</th>
                <th>Convênio</th>
                <th>Status</th>
                <th>Data</th>
                <th>Hora</th>
                <th>Usuário</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {simulacoes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    Nenhuma simulação encontrada
                  </td>
                </tr>
              ) : (
                simulacoes.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 'bold' }}>{s.id}</td>
                    <td>{s.nome.toUpperCase()}</td>
                    <td>
                      {s.cpf
                        ? `${s.cpf.slice(0, 3)}.${s.cpf.slice(3, 6)}.${s.cpf.slice(6, 9)}-${s.cpf.slice(9, 11)}`
                        : 'N/A'}
                    </td>
                    <td>{s.convenio}</td>
                    <td>
                      <span
                        className={`status-tag status-clickable ${getStatusClass(s.status)}`}
                        style={{ fontWeight: 'bold', cursor: podeClicarStatus ? 'pointer' : 'default', color: s.status_cor || undefined }}
                        onClick={() => handleStatusClick(s)}
                        title={podeClicarStatus ? 'Clique para ver documentos e adicionar proposta' : ''}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td>{s.data}</td>
                    <td>{s.hora}</td>
                    <td>{s.usuario}</td>
                    <td>
                      <button
                        className="btn-puxar"
                        onClick={() => {
                          localStorage.setItem('selectedSimulacao_crmwa', JSON.stringify({ ...s, readOnly: true }))
                          setPaginaAtual('detalhe-simulacao')
                        }}
                        style={{ fontSize: 11, padding: '4px 12px', margin: 0, cursor: 'pointer' }}
                        title="Visualizar simulação"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="paginacao" style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
          <button
            className="btn-paginacao"
            disabled={pagina <= 1}
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            style={{ padding: '6px 14px', cursor: pagina <= 1 ? 'default' : 'pointer', opacity: pagina <= 1 ? 0.5 : 1 }}
          >
            Anterior
          </button>
          <span style={{ fontSize: '14px' }}>Página {pagina} de {totalPaginas}</span>
          <button
            className="btn-paginacao"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            style={{ padding: '6px 14px', cursor: pagina >= totalPaginas ? 'default' : 'pointer', opacity: pagina >= totalPaginas ? 0.5 : 1 }}
          >
            Próximo
          </button>
        </div>
      </div>

    </div>
  )
}
