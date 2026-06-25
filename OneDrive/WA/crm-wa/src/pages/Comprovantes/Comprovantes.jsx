import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingBars from '../../components/LoadingBars/LoadingBars'
import { lerComprovante } from '../../lib/gemini'
import './Comprovantes.css'

export default function Comprovantes() {
  const [propostas, setPropostas] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [filtroValor, setFiltroValor] = useState('')
  const [integradoId, setIntegradoId] = useState(null)
  const [lendoGemini, setLendoGemini] = useState(null)
  const [falhaGemini, setFalhaGemini] = useState({})
  const [toast, setToast] = useState(null)
  const [temMais, setTemMais] = useState(false)
  const ITENS_POR_PAGINA = 30

  function mostrarToast(mensagem, erro = false) {
    setToast({ mensagem, erro })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const cached = localStorage.getItem('integradoId_crmwa')
    if (cached) {
      setIntegradoId(Number(cached))
    } else {
      carregarStatus()
    }
  }, [])

  useEffect(() => {
    if (integradoId) carregarPropostas(pagina)
  }, [pagina, integradoId])

  async function carregarStatus() {
    const { data } = await supabase
      .from('proposta_status')
      .select('id')
      .ilike('nome', '%integrado%')
      .single()

    if (data) {
      localStorage.setItem('integradoId_crmwa', data.id)
      setIntegradoId(data.id)
    }
  }

  async function carregarPropostas(page = 1) {
    try {
      setLoading(true)

      let query = supabase
        .from('proposta')
        .select(`
          id,
          numero_proposta_banco,
          tps,
          tps_pago,
          comprovante_path,
          matricula!inner (
            cliente!inner (nome_completo, cpf)
          )
        `)
        .eq('proposta_status_id', integradoId)
        .gt('tps', 1)
        .is('tps_pago', null)
        .order('id', { ascending: false })
        .limit(ITENS_POR_PAGINA + 1)

      const start = (page - 1) * ITENS_POR_PAGINA
      if (start > 0) query = query.range(start, start + ITENS_POR_PAGINA)

      const termo = filtroValor.trim()
      if (termo) {
        const apenasNumeros = termo.replace(/\D/g, '')
        if (apenasNumeros) {
          query = query.eq('id', parseInt(apenasNumeros) || 0)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao carregar:', error)
        return
      }

      if (!data) {
        setPropostas([])
        setTemMais(false)
        return
      }

      const temMaisPagina = data.length > ITENS_POR_PAGINA
      const itens = temMaisPagina ? data.slice(0, ITENS_POR_PAGINA) : data

      const formatadas = itens.map(item => ({
        id: item.id,
        adeWa: item.id,
        propostaBanco: item.numero_proposta_banco,
        nomeCliente: item.matricula?.cliente?.nome_completo || 'N/A',
        cpf: item.matricula?.cliente?.cpf || 'N/A',
        valorTps: item.tps,
        valorTpsPago: item.tps_pago,
        comprovantePath: item.comprovante_path,
      }))

      setPropostas(formatadas)
      setTemMais(temMaisPagina)
    } catch (error) {
      console.error('Erro ao carregar propostas:', error)
    } finally {
      setLoading(false)
    }
  }

  function handlePesquisar() {
    setPagina(1)
    carregarPropostas(1)
  }

  async function handleUploadComprovante(propostaId, file) {
    if (!file) return

    try {
      const ext = file.name.split('.').pop()
      const storagePath = `comprovantes/${propostaId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('documentos-proposta')
        .upload(storagePath, file)

      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('proposta')
        .update({ comprovante_path: storagePath, tps_pago: null })
        .eq('id', propostaId)

      if (updateError) throw updateError

      setPropostas(prev => prev.map(p =>
        p.id === propostaId ? { ...p, comprovantePath: storagePath } : p
      ))
    } catch (err) {
      console.error('Erro ao anexar comprovante:', err)
        mostrarToast('Erro ao anexar comprovante: ' + err.message, true)
    }
  }

  async function handleMarcarPago(item) {
    if (!item.valorTpsPago || item.valorTpsPago <= 0) {
      mostrarToast('Defina o valor do TPS Pago antes de marcar como pago.', true)
      return
    }

    const { error } = await supabase
      .from('proposta')
      .update({ tps_pago: item.valorTpsPago })
      .eq('id', item.id)

    if (error) {
      console.error('Erro ao marcar como pago:', error)
      return
    }

    setPropostas(prev => prev.filter(p => p.id !== item.id))
  }

  async function handleMarcarNaoPago(propostaId) {
    const { error } = await supabase
      .from('proposta')
      .update({ tps_pago: 0 })
      .eq('id', propostaId)

    if (error) {
      console.error('Erro ao marcar como não pago:', error)
      return
    }

    setPropostas(prev => prev.filter(p => p.id !== propostaId))
  }

  async function handleLerGemini(item) {
    if (!item.comprovantePath) return
    setLendoGemini(item.id)

    try {
      const publicUrl = supabase.storage.from('documentos-proposta').getPublicUrl(item.comprovantePath).data.publicUrl
      const valor = await lerComprovante(publicUrl)

      if (valor !== null && valor > 0) {
        const pago = parseFloat(valor.toFixed(2))
        const { error } = await supabase
          .from('proposta')
          .update({ tps_pago: pago })
          .eq('id', item.id)
        if (!error) {
          setPropostas(prev => prev.map(p =>
            p.id === item.id ? { ...p, valorTpsPago: pago } : p
          ))
        }
      } else {
        setFalhaGemini(prev => ({ ...prev, [item.id]: true }))
        mostrarToast('Gemini não conseguiu identificar o valor. Digite manualmente.', true)
      }
    } catch (err) {
      console.error('Erro ao ler comprovante:', err)
      mostrarToast('Erro ao ler comprovante: ' + err.message, true)
    } finally {
      setLendoGemini(null)
    }
  }

  function handleFileChange(propostaId, e) {
    const file = e.target.files?.[0]
    if (file) {
      handleUploadComprovante(propostaId, file)
    }
    e.target.value = ''
  }

  function formatCpf(cpf) {
    if (!cpf) return 'N/A'
    const d = cpf.replace(/\D/g, '')
    if (d.length !== 11) return cpf
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
  }

  function formatValor(val) {
    if (val === null || val === undefined) return '-'
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  if (loading) {
    return <LoadingBars />
  }

  return (
    <div className="form-container">
      {toast && (
        <div className={`toast-central ${toast.erro ? 'toast-erro' : ''}`}>
          {toast.mensagem}
        </div>
      )}
      <header className="form-header">
        <h1>Comprovantes</h1>
        <p className="header-subtitle">Gerenciar comprovantes de pagamento TPS</p>
      </header>

      <div className="form-content" style={{ width: '95%', maxWidth: '1400px' }}>
        <div className="filtros-wrapper" style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'flex-end' }}>
          <div className="campo-grupo" style={{ flex: '0 0 300px' }}>
            <label>Buscar por nome ou CPF:</label>
            <input
              type="text"
              className="input-estilizado"
              placeholder="Digite para pesquisar..."
              value={filtroValor}
              onChange={e => setFiltroValor(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handlePesquisar() }}
            />
          </div>
          <button className="btn-pesquisar" onClick={handlePesquisar}>
            Pesquisar
          </button>
        </div>

        <div className="tabela-container">
          <table className="tabela-propostas">
            <thead>
              <tr>
                <th>ADE WA</th>
                <th>Nome</th>
                <th>CPF</th>
                <th>Valor TPS</th>
                <th>Valor TPS Pago</th>
                <th>Ação</th>
                <th>Anexar Comprovante</th>
              </tr>
            </thead>
            <tbody>
              {propostas.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    Nenhum comprovante encontrado.
                  </td>
                </tr>
              ) : (
                propostas.map(item => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {item.adeWa}
                    </td>
                    <td>{item.nomeCliente.toUpperCase()}</td>
                    <td>{formatCpf(item.cpf)}</td>
                    <td className="valor-cell">{formatValor(item.valorTps)}</td>
                    <td className="valor-cell">
                      <input
                        type="text"
                        className="input-estilizado tps-pago-input"
                        defaultValue={item.valorTpsPago != null ? Number(item.valorTpsPago).toFixed(2).replace('.', ',') : ''}
                        placeholder="0,00"
                        readOnly={!falhaGemini[item.id]}
                        onBlur={e => {
                          const val = e.target.value.trim()
                          if (val) {
                            const parsed = parseFloat(val.replace(',', '.'))
                            if (!isNaN(parsed)) {
                              setPropostas(prev => prev.map(p =>
                                p.id === item.id ? { ...p, valorTpsPago: parsed } : p
                              ))
                            }
                          }
                        }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="acao-botoes">
                        <button
                          className="btn-pago"
                          onClick={() => handleMarcarPago(item)}
                          title="Marcar como pago"
                        >
                          Pago
                        </button>
                        <button
                          className="btn-nao-pago"
                          onClick={() => handleMarcarNaoPago(item.id)}
                          title="Marcar como não pago"
                        >
                          Não Pago
                        </button>
                      </div>
                    </td>
                    <td>
                      {item.comprovantePath ? (
                        <div className="comprovante-actions">
                          <a
                            href={supabase.storage.from('documentos-proposta').getPublicUrl(item.comprovantePath).data.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-comprovante-visualizar"
                          >
                            Visualizar
                          </a>
                          <button
                            className="btn-comprovante-gemini"
                            onClick={() => handleLerGemini(item)}
                            disabled={lendoGemini === item.id}
                          >
                            {lendoGemini === item.id ? 'Lendo...' : 'Ler Gemini'}
                          </button>
                          <label className="btn-comprovante-trocar">
                            Trocar
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              hidden
                              onChange={e => handleFileChange(item.id, e)}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="btn-comprovante-anexar">
                          Anexar
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            hidden
                            onChange={e => handleFileChange(item.id, e)}
                          />
                        </label>
                      )}
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
          <span style={{ fontSize: '14px' }}>Página {pagina}</span>
          <button
            className="btn-paginacao"
            disabled={!temMais}
            onClick={() => setPagina(p => p + 1)}
            style={{ padding: '6px 14px', cursor: !temMais ? 'default' : 'pointer', opacity: !temMais ? 0.5 : 1 }}
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  )
}
