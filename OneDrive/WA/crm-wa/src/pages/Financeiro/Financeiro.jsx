import LoadingBars from '../../components/LoadingBars/LoadingBars'
import './Financeiro.css'
import { supabase } from '../../lib/supabase'
import { useState, useEffect, useRef } from 'react'

export default function Financeiro({ setPaginaAtual }) {
  const [propostas, setPropostas] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const propostasRef = useRef([])
  const statusFiltroExcluirRef = useRef(null)
  const ITENS_POR_PAGINA = 10

  useEffect(() => {
    propostasRef.current = propostas
  }, [propostas])

  useEffect(() => {
    carregarPropostas(pagina)
  }, [pagina])

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

      if (!statusFiltroExcluirRef.current) {
        const { data: allStatuses } = await supabase
          .from('proposta_status')
          .select('id, nome')
        if (allStatuses) {
          const integrado = allStatuses.find(s => s.nome.toLowerCase() === 'integrado')
          statusFiltroExcluirRef.current = integrado ? integrado.id : null
        } else {
          statusFiltroExcluirRef.current = null
        }
      }

      const start = (page - 1) * ITENS_POR_PAGINA
      const end = start + ITENS_POR_PAGINA - 1

      const perfil = localStorage.getItem('usuario_perfil_crmwa') || ''
      const usuarioId = parseInt(localStorage.getItem('usuario_id_crmwa') || '0')

      let query = supabase
        .from('proposta')
        .select(`
          id,
          numero_proposta_banco,
          codigo_tabela,
          comissao,
          tps_feita,
          percentual_recebido,
          proposta_status_id,
          proposta_status:proposta_status_id (nome, cor, historico),
          usuario_digitador_id,
          usuario_digitador:usuario_digitador_id (nome),
          valor_liberado,
          valor_liberado_real,
          atualizado_em,
          matricula (
            cliente (nome_completo, cpf),
            convenio (nome)
          ),
          promotora_id,
          promotora:promotora_id (nome),
          banco_credor:banco_credor_id (nome),
          tipo_operacao:tipo_operacao_id (nome)
        `, { count: 'exact' })
        .order('atualizado_em', { ascending: true })
        .range(start, end)

      if (statusFiltroExcluirRef.current) {
        query = query.eq('proposta_status_id', statusFiltroExcluirRef.current)
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
        return
      }

      const ids = data.map(p => p.id)

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

      const propostasFormatadas = data.map(item => {
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
        valorLiberadoReal: item.valor_liberado_real,
        banco: item.banco_credor?.nome || 'N/A',
        tabelaBanco: item.codigo_tabela || '',
        promotora: item.promotora?.nome || '',
        promotora_id: item.promotora_id,
        percentualRecebido: item.percentual_recebido ?? '',
        comissao: item.comissao ?? '',
        tps: item.tps_feita ?? '',
        meta: '',
        usuarioDigitador: item.usuario_digitador?.nome || 'N/A',
        _sort: item.atualizado_em,
        locked: !!lockedById[item.id],
        lockedByMe: lockedById[item.id] === usuarioIdLogado
      }})

      propostasFormatadas.sort((a, b) => {
        if (!a._sort && !b._sort) return 0
        if (!a._sort) return 1
        if (!b._sort) return -1
        return new Date(a._sort) - new Date(b._sort)
      })

      setPropostas(propostasFormatadas)
      setTotalPaginas(count ? Math.ceil(count / ITENS_POR_PAGINA) : 1)
    } catch (error) {
      console.error('Erro ao carregar propostas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusClick = (item) => {
    localStorage.setItem('propostaSelecionada_crmwa', JSON.stringify(item))
    setPaginaAtual('status-financeiro')
  }

  const handleAdeWaClick = (item) => {
    localStorage.setItem('propostaSelecionada_crmwa', JSON.stringify(item))
    setPaginaAtual('detalhe-proposta')
  }

  if (loading) {
    return <LoadingBars />
  }

  return (
    <div className="form-container">
      <header className="form-header">
          <h1>Financeiro</h1>
          <p className="header-subtitle">Acompanhamento financeiro e comissões</p>
      </header>

      <div className="form-content" style={{ width: '95%', maxWidth: '1500px' }}>
        <div className="status-badge">Financeiro / Comissões</div>

        <div className="filtros-wrapper">
          <div className="campo-grupo">
            <label>Pesquisar por:</label>
            <select className="input-estilizado" style={{ width: '250px' }}>
              <option>Selecione o tipo de pesquisa</option>
              <option>Nome do Cliente</option>
              <option>CPF</option>
              <option>Proposta Banco</option>
              <option>Status</option>
              <option>Convênio</option>
            </select>
          </div>

          <div className="campo-grupo" style={{ flexGrow: 1 }}>
            <label>Proposta:</label>
            <input type="text" className="input-estilizado" placeholder="Digite para pesquisar..." />
          </div>

          <button className="btn-pesquisar">Pesquisar</button>
          <button className="btn-refresh" onClick={() => { setPagina(1); carregarPropostas(1) }} title="Atualizar lista">
            ↻
          </button>
        </div>

        <div className="tabela-container">
          <table className="tabela-propostas">
            <thead>
              <tr>
                <th>ADE WA</th>
                <th>Proposta banco</th>
                <th>Nome completo</th>
                <th>CPF</th>
                <th>Status</th>
                <th>Valor Liberado</th>
                <th>Banco</th>
                <th>Tabela Banco</th>
                <th>Comissão</th>
                <th>TPS</th>
                <th>Meta</th>
                <th>Promotora</th>
                <th>% Recebido</th>
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
                  <td>{item.cpf}</td>
                  <td>
                    <span
                      className="status-tag"
                      style={{ cursor: 'pointer', color: item.statusCor, fontWeight: 'bold' }}
                      onClick={() => handleStatusClick(item)}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="valor-cell">
                    {(item.valorLiberadoReal ?? item.valorLiberado)
                      ? Number(item.valorLiberadoReal ?? item.valorLiberado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : '-'}
                  </td>
                  <td>{item.banco}</td>
                  <td>{item.tabelaBanco}</td>
                  <td>{item.comissao ? Number(item.comissao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                  <td>{item.tps ? Number(item.tps).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</td>
                  <td>{(item.comissao || item.tps)
                    ? 'R$ ' + ((Number(item.comissao || 0) + Number(item.tps || 0)) * 10).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '-'}</td>
                  <td>{item.promotora}</td>
                  <td style={{ color: item.percentualRecebido ? (Number(item.percentualRecebido) > 10 ? '#16a34a' : '#dc2626') : 'inherit', fontWeight: 600 }}>
                    {item.percentualRecebido ? `${Math.min(Number(item.percentualRecebido), 15)}%` : '-'}
                  </td>
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
    </div>
  )
}
