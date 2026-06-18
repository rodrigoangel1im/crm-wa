import LoadingBars from '../../components/LoadingBars/LoadingBars'
import '../EsteiraProposta/EsteiraProposta.css'
import { supabase } from '../../lib/supabase'
import { useState, useEffect, useRef } from 'react'
import ModalDetalheProposta from '../../components/ModalDetalheProposta/ModalDetalheProposta'

export default function PagasCanceladas({ setPaginaAtual }) {
  const [propostas, setPropostas] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const propostasRef = useRef([])
  const statusFiltroIncluirRef = useRef(null)
  const ITENS_POR_PAGINA = 10
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroValor, setFiltroValor] = useState('')
  const [listaStatus, setListaStatus] = useState([])
  const [abaAtiva, setAbaAtiva] = useState(null)

  useEffect(() => {
    propostasRef.current = propostas
  }, [propostas])
  const [modalDetalheOpen, setModalDetalheOpen] = useState(false)
  const [modalDetalheId, setModalDetalheId] = useState(null)

  useEffect(() => {
    async function init() {
      const { data: allStatuses } = await supabase
        .from('proposta_status')
        .select('id, nome')
      if (allStatuses) {
        const targetNames = ['integrado', 'reprovado']
        const filtered = allStatuses.filter(s =>
          targetNames.includes(s.nome.toLowerCase())
        )
        setListaStatus(filtered)
        if (filtered.length > 0 && !abaAtiva) {
          setAbaAtiva(String(filtered[0].id))
        }
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (abaAtiva) carregarPropostas(pagina)
  }, [pagina, abaAtiva])

  useEffect(() => {
    const interval = setInterval(async () => {
      const ids = propostasRef.current.map(p => p.id)
      if (ids.length === 0) return

      const LOCK_TIMEOUT = 5 * 60 * 1000
      const { data: locksAtivos } = await supabase
        .from('proposta_lock')
        .select('*')
        .in('proposta_id', ids)

      const usuarioIdLogado = parseInt(localStorage.getItem('usuario_id_crmwa') || '0')
      const lockedById = {}
      if (locksAtivos) {
        locksAtivos.forEach(l => {
          if (new Date() - new Date(l.locked_at) < LOCK_TIMEOUT) {
            lockedById[l.proposta_id] = l.usuario_id
          }
        })
      }

      setPropostas(prev => prev.map(p => ({
        ...p,
        locked: !!lockedById[p.id],
        lockedByMe: lockedById[p.id] === usuarioIdLogado
      })))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  async function carregarPropostas(page = 1) {
    try {
      setLoading(true)

      statusFiltroIncluirRef.current = abaAtiva ? [parseInt(abaAtiva)] : []

      const perfil = localStorage.getItem('usuario_perfil_crmwa') || ''
      const usuarioId = parseInt(localStorage.getItem('usuario_id_crmwa') || '0')

      const temFiltro = filtroValor.trim() && filtroTipo !== 'Todos'

      const umMesAtras = new Date()
      umMesAtras.setMonth(umMesAtras.getMonth() - 1)

      let query = supabase
        .from('proposta')
        .select(`
          id,
          numero_proposta_banco,
          proposta_status_id,
          proposta_status:proposta_status_id (nome, cor, historico),
          usuario_digitador_id,
          usuario_digitador:usuario_digitador_id (nome),
          valor_liberado,
          valor_parcela,
          atualizado_em,
          matricula (
            cliente (nome_completo, cpf),
            convenio (nome)
          ),
          banco_credor:banco_credor_id (nome),
          tipo_operacao:tipo_operacao_id (nome)
        `, { count: 'exact' })
        .gte('atualizado_em', umMesAtras.toISOString())
        .order('atualizado_em', { ascending: false })

      if (!temFiltro) {
        const start = (page - 1) * ITENS_POR_PAGINA
        const end = start + ITENS_POR_PAGINA - 1
        query = query.range(start, end)
      }

      if (statusFiltroIncluirRef.current.length > 0) {
        query = query.in('proposta_status_id', statusFiltroIncluirRef.current)
      }

      if (perfil === 'Vendedor' && usuarioId) {
        query = query.eq('usuario_digitador_id', usuarioId)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Erro ao carregar propostas:', error)
        return
      }

      if (!data || data.length === 0) {
        setPropostas([])
        setTotalPaginas(1)
        setLoading(false)
        return
      }

      const ids = data.map(p => p.id)
      const { data: parcelasData, error: parcelasError } = await supabase
        .from('proposta_parcela')
        .select('proposta_id, indice, valor, troco')
        .in('proposta_id', ids)

      if (parcelasError) {
        console.error('Erro ao carregar parcelas:', parcelasError)
      }

      const parcelasPorProposta = {}
      if (parcelasData) {
        parcelasData.forEach(p => {
          if (!parcelasPorProposta[p.proposta_id]) parcelasPorProposta[p.proposta_id] = []
          parcelasPorProposta[p.proposta_id].push(p)
        })
      }

      const { data: historicoData, error: historicoError } = await supabase
        .from('proposta_historico')
        .select('proposta_id, criado_em')
        .in('proposta_id', ids)
        .order('criado_em', { ascending: false })

      if (historicoError) {
        console.error('Erro ao carregar histórico:', historicoError)
      }

      const latestHistorico = {}
      if (historicoData) {
        historicoData.forEach(h => {
          if (!latestHistorico[h.proposta_id]) {
            latestHistorico[h.proposta_id] = h.criado_em
          }
        })
      }

      const LOCK_TIMEOUT = 5 * 60 * 1000
      const { data: locksAtivos } = await supabase
        .from('proposta_lock')
        .select('*')
        .in('proposta_id', ids)

      const usuarioIdLogado = parseInt(localStorage.getItem('usuario_id_crmwa') || '0')
      const lockedById = {}
      if (locksAtivos) {
        locksAtivos.forEach(l => {
          if (new Date() - new Date(l.locked_at) < LOCK_TIMEOUT) {
            lockedById[l.proposta_id] = l.usuario_id
          }
        })
      }

      function formatarBrasilia(iso) {
        if (!iso) return { data: '', hora: '' }
        const d = new Date(iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z')
        const ano = d.getFullYear()
        const mes = String(d.getMonth() + 1).padStart(2, '0')
        const dia = String(d.getDate()).padStart(2, '0')
        const hora = String(d.getHours()).padStart(2, '0')
        const minuto = String(d.getMinutes()).padStart(2, '0')
        return { data: `${dia}/${mes}/${ano}`, hora: `${hora}:${minuto}` }
      }

      let propostasFormatadas = data.map(item => {
        const ultimaAtualizacao = latestHistorico[item.id] || item.atualizado_em
        const { data: dataAtualizacao, hora: horaAtualizacao } = formatarBrasilia(ultimaAtualizacao)
        return {
          id: item.id,
          proposta_status_id: item.proposta_status_id,
          adeWa: item.id,
          propostaBanco: item.numero_proposta_banco,
          nomeCliente: item.matricula?.cliente?.nome_completo || 'N/A',
          cpf: item.matricula?.cliente?.cpf || 'N/A',
          status: item.proposta_status?.nome || 'N/A',
          statusCor: item.proposta_status?.cor || '#333',
          statusHistorico: item.proposta_status?.historico || '',
          valorLiberado: item.valor_liberado,
          valorParcela: item.valor_parcela,
          banco: item.banco_credor?.nome || 'N/A',
          operacao: item.tipo_operacao?.nome || 'N/A',
          convenio: item.matricula?.convenio?.nome || 'N/A',
          dataAtualizacao,
          horaAtualizacao,
          usuarioDigitador: item.usuario_digitador?.nome || 'N/A',
          tempoDecorrido: ultimaAtualizacao && !['integrado', 'reprovado'].includes(item.proposta_status?.nome?.toLowerCase()) ? calcularTempoDecorrido(ultimaAtualizacao) : '',
          parcelas: parcelasPorProposta[item.id] || [],
          _sort: ultimaAtualizacao,
          locked: !!lockedById[item.id],
          lockedByMe: lockedById[item.id] === usuarioIdLogado
        }
      })

      propostasFormatadas.sort((a, b) => {
        if (!a._sort && !b._sort) return 0
        if (!a._sort) return 1
        if (!b._sort) return -1
        return new Date(a._sort) - new Date(b._sort)
      })

      if (filtroValor.trim() && filtroTipo !== 'Todos') {
        const termo = filtroValor.trim().toLowerCase()
        propostasFormatadas = propostasFormatadas.filter(p => {
          if (filtroTipo === 'Nome') return p.nomeCliente.toLowerCase().includes(termo)
          if (filtroTipo === 'CPF') return p.cpf.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))
          if (filtroTipo === 'Status') return p.status.toLowerCase().includes(termo)
          if (filtroTipo === 'Proposta Banco') return (p.propostaBanco || '').toLowerCase().includes(termo)
          if (filtroTipo === 'Convênio') return p.convenio.toLowerCase().includes(termo)
          return true
        })
      }

      if (temFiltro) {
        const totalFiltered = propostasFormatadas.length
        const startSlice = (page - 1) * ITENS_POR_PAGINA
        const endSlice = startSlice + ITENS_POR_PAGINA
        setPropostas(propostasFormatadas.slice(startSlice, endSlice))
        setTotalPaginas(Math.ceil(totalFiltered / ITENS_POR_PAGINA) || 1)
      } else {
        setPropostas(propostasFormatadas)
        setTotalPaginas(count ? Math.ceil(count / ITENS_POR_PAGINA) : 1)
      }
    } catch (error) {
      console.error('Erro ao carregar propostas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = (status) => {
    if (status === 'Aprovado') return 'status-aprovado'
    if (status === 'Em Análise') return 'status-analise'
    if (status === 'Reprovado') return 'status-reprovado'
    if (status === 'Cancelado') return 'status-cancelado'
    if (status === 'Pendente') return 'status-pendente'
    return ''
  }

  const handleAdeWaClick = (item) => {
    localStorage.setItem('propostaSelecionada_crmwa', JSON.stringify(item))
    setPaginaAtual('detalhe-proposta')
  }

  function calcularTempoDecorrido(timestamp) {
    if (!timestamp) return ''
    const agora = new Date()
    const atualizacao = new Date(timestamp)
    const diffMs = agora - atualizacao
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return 'Agora mesmo'
    if (diffMin < 60) return `${diffMin} min atrás`

    const diffHoras = Math.floor(diffMin / 60)
    if (diffHoras < 24) return `${diffHoras} h atrás`

    const diffDias = Math.floor(diffHoras / 24)
    if (diffDias < 30) return `${diffDias} dia${diffDias > 1 ? 's' : ''} atrás`

    const diffMeses = Math.floor(diffDias / 30)
    return `${diffMeses} mês${diffMeses > 1 ? 'es' : ''} atrás`
  }

  if (loading && !listaStatus.length) {
    return <LoadingBars />
  }

  return (
    <div className="form-container">
      <header className="form-header">
          <h1>Pagas / Canceladas</h1>
          <p className="header-subtitle">Descrição da página</p>
      </header>

      <div className="form-content" style={{ width: '95%', maxWidth: '1500px' }}>
        <div className="status-tabs">
          {listaStatus.map(s => (
            <button
              key={s.id}
              className={`status-tab ${String(abaAtiva) === String(s.id) ? 'active' : ''}`}
              onClick={() => { setAbaAtiva(String(s.id)); setPagina(1) }}
            >
              {s.nome}
            </button>
          ))}
        </div>
        <div className="filtros-wrapper" style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'flex-end' }}>
          <div className="campo-grupo">
            <label>Pesquisar por:</label>
            <select className="input-estilizado" style={{ width: '200px' }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option>Todos</option>
              <option>Nome</option>
              <option>CPF</option>
              <option>Status</option>
              <option>Proposta Banco</option>
              <option>Convênio</option>
            </select>
          </div>
          <div className="campo-grupo" style={{ flex: '0 0 300px' }}>
            <label>Buscar:</label>
            <input type="text" className="input-estilizado" placeholder="Digite para pesquisar..." value={filtroValor} onChange={e => setFiltroValor(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setPagina(1); carregarPropostas(1) } }} />
          </div>
          <button className="btn-pesquisar" onClick={() => { setPagina(1); carregarPropostas(1) }} title="Pesquisar">
            Pesquisar
          </button>
        </div>

        <div className="tabela-container">
          <table className="tabela-propostas">
            <thead>
              <tr>
                <th>ADE WA</th>
                <th>Proposta banco</th>
                <th>Nome cliente</th>
                <th>CPF</th>
                <th>Hist.</th>
                <th>Status</th>
                <th>Valor Liberado</th>
                <th>Valor de Parcela</th>
                <th>Banco</th>
                <th>Operação</th>
                <th>Convênio</th>
                <th>Data da última atualização</th>
                <th>Hora da última atualização</th>
                <th>Há</th>
                <th>Usuário digitador</th>
              </tr>
            </thead>
            <tbody>
              {propostas.map((item) => (
                <tr key={item.id} style={item.locked ? { fontWeight: 'bold' } : {}}>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{ cursor: 'pointer', color: '#000', fontWeight: 'bold' }}
                      onClick={() => handleAdeWaClick(item)}
                    >
                      {item.adeWa}
                    </span>
                  </td>
                  <td>{item.propostaBanco}</td>
                  <td>{item.nomeCliente.toUpperCase()}</td>
                  <td>{item.cpf ? `${item.cpf.slice(0, 3)}.${item.cpf.slice(3, 6)}.${item.cpf.slice(6, 9)}-${item.cpf.slice(9, 11)}` : 'N/A'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#3f3b6c', fontSize: '14px', cursor: 'pointer' }} onClick={() => { setModalDetalheId(item.id); setModalDetalheOpen(true) }}>
                    {item.statusHistorico}
                  </td>
                  <td>
                    <span
                      className="status-tag"
                      style={{ cursor: 'default', color: item.statusCor, fontWeight: 'bold' }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="valor-cell">
                    {(item.valorLiberadoReal ?? item.valorLiberado)
                      ? Number(item.valorLiberadoReal ?? item.valorLiberado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : '-'}
                  </td>
                  <td className="valor-cell">
                    {(item.parcelaReal ?? item.valorParcela)
                      ? Number(item.parcelaReal ?? item.valorParcela).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : '-'}
                  </td>
                  <td>{item.banco}</td>
                  <td>{item.operacao}</td>
                  <td>{item.convenio}</td>
                  <td>{item.dataAtualizacao}</td>
                  <td>{item.horaAtualizacao}</td>
                  <td>{item.tempoDecorrido}</td>
                  <td>{item.usuarioDigitador}</td>
                </tr>
              ))}
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

      <ModalDetalheProposta
        isOpen={modalDetalheOpen}
        onClose={() => setModalDetalheOpen(false)}
        propostaId={modalDetalheId}
      />
    </div>
  )
}
