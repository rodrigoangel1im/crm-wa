import LoadingBars from '../../components/LoadingBars/LoadingBars'
import './EsteiraProposta.css'
import { supabase } from '../../lib/supabase'
import { useState, useEffect, useRef } from 'react'
import ModalDetalheProposta from '../../components/ModalDetalheProposta/ModalDetalheProposta'
import ModalAnexarDocumento from '../AnexarDocumento/ModalAnexarDocumento'

const TIPOS_DOCUMENTO = [
  { id: 'identidade', label: 'Documento de identidade' },
  { id: 'comprovante_residencia', label: 'Comprovante de residência' },
  { id: 'comprovante_renda', label: 'Contracheque' },
  { id: 'extrato_inss', label: 'Extrato consignado - Hiscon INSS' },
]

export default function EsteiraProposta({ setPaginaAtual }) {
  const [propostas, setPropostas] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const propostasRef = useRef([])
  const ITENS_POR_PAGINA = 10
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [filtroValor, setFiltroValor] = useState('')
  const [abaAtiva, setAbaAtiva] = useState(null)
  const [listaStatus, setListaStatus] = useState([])
  const [contagensStatus, setContagensStatus] = useState({})

  useEffect(() => {
    propostasRef.current = propostas
  }, [propostas])
  const [modalDetalheOpen, setModalDetalheOpen] = useState(false)
  const [modalDetalheId, setModalDetalheId] = useState(null)
  const [modalDocOpen, setModalDocOpen] = useState(false)
  const [modalDocProposta, setModalDocProposta] = useState(null)
  const [docAnexos, setDocAnexos] = useState({})
  const [docLoading, setDocLoading] = useState(false)
  const [docUploadModal, setDocUploadModal] = useState({ open: false, tipo: null, label: '', propostaId: null })

  useEffect(() => {
    carregarPropostas(pagina)
  }, [pagina, abaAtiva])

  useEffect(() => {
    carregarStatus()
  }, [])

  const ORDEM_STATUS = [
    'aguarda documento',
    'aguarda digitacao',
    'em analise',
    'aguarda assinatura',
    'aguarda cip',
    'aguarda refin',
    'pendente',
  ]

  function normalizarNome(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  }

  function ordenarStatus(lista) {
    return ORDEM_STATUS
      .map(nome => {
        const palavras = normalizarNome(nome).split(/\s+/)
        return lista.find(s => {
          const nomeNorm = normalizarNome(s.nome)
          return palavras.every(p => nomeNorm.includes(p))
        })
      })
      .filter(Boolean)
  }

  async function carregarStatus() {
    const { data: statuses } = await supabase
      .from('proposta_status')
      .select('id, nome, cor, historico')
      .order('id')
    if (statuses) {
      const filtrados = ordenarStatus(statuses)
      setListaStatus(filtrados)
      if (filtrados.length > 0 && !abaAtiva) {
        const savedTab = localStorage.getItem('esteira_aba_ativa')
        const tabExists = savedTab && filtrados.some(s => String(s.id) === savedTab)
        setAbaAtiva(tabExists ? savedTab : String(filtrados[0].id))
      }
    }
  }

  useEffect(() => {
    async function carregarContagens() {
      const { data: statuses } = await supabase
        .from('proposta_status')
        .select('id, nome')
      if (!statuses) return

      const filtrados = ordenarStatus(statuses)
      const contagens = {}
      for (const s of filtrados) {
        const { count } = await supabase
          .from('proposta')
          .select('id', { count: 'exact', head: true })
          .eq('proposta_status_id', s.id)
        contagens[s.id] = count || 0
      }
      setContagensStatus(contagens)
    }
    carregarContagens()
  }, [])

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

      if (!abaAtiva) return

      const perfil = localStorage.getItem('usuario_perfil_crmwa') || ''
      const usuarioId = parseInt(localStorage.getItem('usuario_id_crmwa') || '0')

      const temFiltro = filtroValor.trim() && filtroTipo !== 'Todos'

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
          previsao_saldo_data,

          atualizado_em,
          matricula (
            cliente (nome_completo, cpf),
            convenio (nome)
          ),
          banco_credor:banco_credor_id (nome),
          tipo_operacao:tipo_operacao_id (nome)
        `, { count: 'exact' })
        .eq('proposta_status_id', parseInt(abaAtiva))
        .order('atualizado_em', { ascending: true })

      if (!temFiltro) {
        const start = (page - 1) * ITENS_POR_PAGINA
        const end = start + ITENS_POR_PAGINA - 1
        query = query.range(start, end)
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
        previsaoSaldoData: item.previsao_saldo_data,
        parcelas: parcelasPorProposta[item.id] || [],
        _sort: ultimaAtualizacao,
        locked: !!lockedById[item.id],
        lockedByMe: lockedById[item.id] === usuarioIdLogado
      }})

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

  const handleStatusClick = (item) => {
    const perfil = localStorage.getItem('usuario_perfil_crmwa') || ''
    if (perfil === 'Vendedor') return
    if (item.proposta_status_id === 2) return
    if ((item.status || '').toLowerCase() === 'integrado' && perfil !== 'Administrador') return
    if (item.locked && !item.lockedByMe) return
    if (item.proposta_status_id === 10) {
      abrirModalDoc(item)
      return
    }
    localStorage.setItem('propostaSelecionada_crmwa', JSON.stringify(item))
    localStorage.setItem('esteira_aba_ativa', abaAtiva)
    setPaginaAtual('status-proposta')
  }

  async function abrirModalDoc(item) {
    setModalDocProposta(item)
    setDocLoading(true)
    setDocAnexos({})
    setModalDocOpen(true)

    const { data } = await supabase
      .from('documento_proposta')
      .select('id, tipo_documento, nome_arquivo')
      .eq('proposta_id', item.id)

    if (data) {
      const anexosMap = {}
      data.forEach(d => { anexosMap[d.tipo_documento] = d })
      setDocAnexos(anexosMap)
    }
    setDocLoading(false)
  }

  async function handleFinalizarDoc() {
    if (!modalDocProposta) return

    const { data: statusList } = await supabase
      .from('proposta_status')
      .select('id, nome')

    const aguardaDigitacao = statusList?.find(s => {
      const nome = s.nome.toLowerCase()
      return nome.includes('aguarda') && nome.includes('digita')
    })

    if (!aguardaDigitacao) {
      alert('Status "Aguarda Digitação" não encontrado no sistema.')
      return
    }

    const { data: propostaAtual } = await supabase
      .from('proposta')
      .select('valor_liberado')
      .eq('id', modalDocProposta.id)
      .single()

    const { data: parcelasAtuais } = await supabase
      .from('proposta_parcela')
      .select('id, troco')
      .eq('proposta_id', modalDocProposta.id)

    if (propostaAtual?.valor_liberado && parcelasAtuais && parcelasAtuais.length > 0) {
      const vl = Number(propostaAtual.valor_liberado) || 0
      const trocoPorParcela = vl / parcelasAtuais.length
      for (const p of parcelasAtuais) {
        await supabase
          .from('proposta_parcela')
          .update({ troco: trocoPorParcela })
          .eq('id', p.id)
      }
    }

    const { error } = await supabase
      .from('proposta')
      .update({ proposta_status_id: aguardaDigitacao.id, atualizado_em: new Date().toISOString() })
      .eq('id', modalDocProposta.id)

    if (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao finalizar documentação.')
      return
    }

    const nomeUsuario = localStorage.getItem('usuario_nome_crmwa') || ''
    const docsAnexados = Object.values(docAnexos).map(d => d.tipo_documento).join(', ')
    await supabase.from('proposta_historico').insert({
      proposta_id: modalDocProposta.id,
      dados: {
        acao: `Documentação finalizada - Documentos anexados: ${docsAnexados}`,
        usuario_nome: nomeUsuario,
        proposta_status_id: aguardaDigitacao.id
      }
    })

    setModalDocOpen(false)
    setModalDocProposta(null)
    setDocAnexos({})
    carregarPropostas(pagina)
  }

  function handleAnexarDoc(tipo) {
    const tipoInfo = TIPOS_DOCUMENTO.find(t => t.id === tipo)
    setDocUploadModal({ open: true, tipo, label: tipoInfo?.label || '', propostaId: modalDocProposta?.id })
  }

  function handleDocUploadComplete(tipo, atualizados) {
    if (atualizados && atualizados.length > 0) {
      setDocAnexos(prev => {
        const updated = { ...prev }
        atualizados.forEach(doc => {
          updated[doc.tipo_documento] = doc
        })
        return updated
      })
    }
    setDocUploadModal({ open: false, tipo: null, label: '', propostaId: null })
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

  if (loading) {
    return <LoadingBars />
  }

  return (
    <div className="form-container">
      <header className="form-header">
          <h1>Esteira de Proposta</h1>
          <p className="header-subtitle">Descrição da página</p>
      </header>

      <div className="form-content" style={{ width: '95%', maxWidth: '1500px' }}>
        <div className="status-tabs">
          {listaStatus.map(s => (
            <button
              key={s.id}
              className={`status-tab ${String(abaAtiva) === String(s.id) ? 'active' : ''}`}
              style={String(abaAtiva) === String(s.id) ? { borderBottomColor: s.cor || '#3f3b6c' } : {}}
              onClick={() => { setAbaAtiva(String(s.id)); setPagina(1); localStorage.setItem('esteira_aba_ativa', String(s.id)) }}
            >
              {s.nome}
              <span className="status-tab-count">{contagensStatus[s.id] ?? '-'}</span>
            </button>
          ))}
        </div>

        <div className="filtros-wrapper" style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'flex-end' }}>
          <div className="campo-grupo">
            <label>Pesquisar por:</label>
            <select className="input-estilizado" style={{ width: '200px' }} value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value) }}>
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
                <th>Tempo</th>
                <th>Usuário digitador</th>
              </tr>
            </thead>
            <tbody>
              {propostas.map((item) => (
                <tr key={item.id} style={{
                  ...(item.locked ? { fontWeight: 'bold' } : {}),
                  ...(item.previsaoSaldoData && (() => { const t = new Date(new Date().toDateString()).getTime(); const p = new Date(item.previsaoSaldoData).getTime(); return t >= p - 86400000 && t <= p + 86400000 })() ? { backgroundColor: '#ffcdd2' } : {})
                }}>
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
                      style={{ cursor: (item.proposta_status_id === 2 || ((item.status || '').toLowerCase() === 'integrado' && (localStorage.getItem('usuario_perfil_crmwa') || '') !== 'Administrador')) ? 'default' : 'pointer', color: item.statusCor, fontWeight: 'bold' }}
                      onClick={() => handleStatusClick(item)}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="valor-cell">
                    {item.valorLiberado
                      ? Number(item.valorLiberado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : '-'}
                  </td>
                  <td className="valor-cell">
                    {item.valorParcela
                      ? Number(item.valorParcela).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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

      {modalDocOpen && modalDocProposta && !docUploadModal.open && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Anexar Documentos - Proposta #{modalDocProposta.id}</h2>
              <p>Cliente: {modalDocProposta.nomeCliente}</p>
            </div>
            <div className="modal-body">
              {docLoading ? (
                <LoadingBars />
              ) : (
                <div className="documentos-lista">
                  {TIPOS_DOCUMENTO.map(tipo => {
                    const anexado = !!docAnexos[tipo.id]
                    return (
                      <div
                        key={tipo.id}
                        className={`documento-item ${anexado ? 'documento-anexado' : ''}`}
                        onClick={() => handleAnexarDoc(tipo.id)}
                        style={{
                          padding: '12px 16px',
                          margin: '6px 0',
                          border: `2px solid ${anexado ? '#28a745' : '#ddd'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: anexado ? '#f0fff4' : '#fff',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontWeight: anexado ? 'bold' : 'normal' }}>
                          {tipo.label}
                        </span>
                        <span style={{ color: anexado ? '#28a745' : '#999', fontSize: '13px' }}>
                          {anexado ? '✓ ANEXADO' : 'Clique para anexar'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px' }}>
              <button
                className="btn-cancelar"
                onClick={() => { setModalDocOpen(false); setModalDocProposta(null); setDocAnexos({}) }}
              >
                Cancelar
              </button>
              <button
                className="btn-salvar"
                onClick={handleFinalizarDoc}
                disabled={Object.keys(docAnexos).length === 0}
                style={{ opacity: Object.keys(docAnexos).length === 0 ? 0.5 : 1 }}
              >
                FINALIZAR
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalAnexarDocumento
        isOpen={docUploadModal.open}
        onClose={() => setDocUploadModal({ open: false, tipo: null, label: '', propostaId: null })}
        propostaIds={docUploadModal.propostaId ? [docUploadModal.propostaId] : []}
        tipoDocumento={docUploadModal.tipo}
        tipoLabel={docUploadModal.label}
        anexosExistentes={docUploadModal.tipo ? (docAnexos[docUploadModal.tipo] ? [docAnexos[docUploadModal.tipo]] : []) : []}
        onAnexar={(tipo, atualizados) => handleDocUploadComplete(tipo, atualizados)}
      />
    </div>
  )
}
