import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingBars from '../../components/LoadingBars/LoadingBars'
import './DetalheSimulacao.css'

export default function DetalheSimulacao({ setPaginaAtual }) {
  const [sim, setSim] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [docVisualizando, setDocVisualizando] = useState(null)
  const [propostas, setPropostas] = useState([])
  const [modalSucesso, setModalSucesso] = useState(null)
  const [selectedStatusId, setSelectedStatusId] = useState('')
  const [alterandoStatus, setAlterandoStatus] = useState(false)
  const [statusList, setStatusList] = useState([])

  const [bancos, setBancos] = useState([])
  const [operacoes, setOperacoes] = useState([])
  const [tiposProduto, setTiposProduto] = useState([])
  const [operacoesPermitidas, setOperacoesPermitidas] = useState([])

  const [bancoId, setBancoId] = useState('')
  const [tipoOperacaoId, setTipoOperacaoId] = useState('')
  const [tipoProdutoId, setTipoProdutoId] = useState('')
  const [valorLiberado, setValorLiberado] = useState('')
  const [valorParcela, setValorParcela] = useState('')
  const [numeroParcelas, setNumeroParcelas] = useState('')
  const [taxaJuros, setTaxaJuros] = useState('')
  const [tps, setTps] = useState('')
  function handleCurrencyInput(value, setter) {
    const digits = value.replace(/\D/g, '')
    if (!digits) { setter(''); return }
    const num = parseInt(digits) / 100
    setter(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  function parseCurrency(str) {
    if (!str) return null
    const cleaned = str.replace(/\./g, '').replace(',', '.')
    return parseFloat(cleaned) || null
  }

  const [readOnly, setReadOnly] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('selectedSimulacao_crmwa')
    if (!raw) {
      setPaginaAtual('esteira-simulacoes')
      return
    }
    const parsed = JSON.parse(raw)
    setSim(parsed)
    setReadOnly(parsed.readOnly === true)
    carregarDados(parsed.id)
  }, [])

  useEffect(() => {
    if (!bancoId) {
      setOperacoesPermitidas([])
      setTipoOperacaoId('')
      return
    }
    supabase
      .from('banco_tipo_operacao')
      .select('tipo_operacao_id')
      .eq('banco_id', parseInt(bancoId))
      .then(({ data: permissoes }) => {
        if (!permissoes || permissoes.length === 0) {
          setOperacoesPermitidas([])
          return
        }
        const allowedIds = permissoes.map(p => p.tipo_operacao_id)
        setOperacoesPermitidas(operacoes.filter(op => allowedIds.includes(op.id)))
        setTipoOperacaoId('')
      })
  }, [bancoId])

  async function carregarDados(solicitacaoId) {
    setCarregando(true)
    try {
      const [bancosRes, operacoesRes, produtosRes, docsRes, statusRes] = await Promise.all([
        supabase.from('banco_operacao').select('id, nome').eq('ativo', true).order('nome'),
        supabase.from('tipo_operacao').select('id, nome').eq('ativo', true).order('id'),
        supabase.from('tipo_produto').select('id, nome, tipo_operacao_id').eq('ativo', true),
        supabase.from('solicitacao_simulacao_arquivo').select('*').eq('solicitacao_id', solicitacaoId).order('criado_em'),
        supabase.from('simulacao_status').select('id, nome, cor').order('id'),
      ])
      if (bancosRes.data) setBancos(bancosRes.data)
      if (operacoesRes.data) setOperacoes(operacoesRes.data)
      if (produtosRes.data) setTiposProduto(produtosRes.data)
      if (statusRes.error) {
        console.error('Erro ao carregar status:', statusRes.error)
        setStatusList([
          { id: 1, nome: 'Pendente',          cor: '#6c757d' },
          { id: 2, nome: 'Em Análise',        cor: '#007bff' },
          { id: 3, nome: 'Aguarda simulação',  cor: '#ff9800' },
          { id: 4, nome: 'Aprovado',          cor: '#28a745' },
          { id: 5, nome: 'Reprovado',         cor: '#dc3545' },
          { id: 6, nome: 'Cancelado',         cor: '#dc3545' },
          { id: 7, nome: 'Simulado',          cor: '#28a745' },
          { id: 8, nome: 'Aguardar banco',    cor: '#ff9800' },
        ])
      }
      if (statusRes.data) setStatusList(statusRes.data)
      if (docsRes.data) {
        const docsComUrl = await Promise.all(
          docsRes.data.map(async (doc) => {
            const { data: signed } = await supabase.storage
              .from('simulacoes-arquivos')
              .createSignedUrl(doc.storage_path, 3600)
            return { ...doc, signedUrl: signed?.signedUrl || null }
          })
        )
        setDocumentos(docsComUrl)
      }
      await carregarPropostas(solicitacaoId)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setCarregando(false)
    }
  }

  async function carregarPropostas(solicitacaoId) {
    const { data } = await supabase
      .from('proposta_simulacao')
      .select(`
        id,
        valor_liberado,
        valor_parcela,
        numero_parcelas,
        taxa_juros,
        tps,
        criado_em,
        banco_credor_id,
        tipo_operacao_id,
        tipo_produto_id
      `)
      .eq('solicitacao_id', solicitacaoId)
      .order('criado_em', { ascending: true })
    if (data) setPropostas(data)
  }

  function voltar() {
    localStorage.removeItem('selectedSimulacao_crmwa')
    setPaginaAtual('esteira-simulacoes')
  }

  async function handleAdicionarProposta() {
    if (!bancoId || !tipoOperacaoId || !tipoProdutoId) {
      alert('Preencha banco, operação e produto')
      return
    }
    setSalvando(true)
    try {
      let usuarioDigitadorId = null
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: usuarioLogado } = await supabase
          .from("usuario")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle()
        if (usuarioLogado) usuarioDigitadorId = usuarioLogado.id
      }

      const { error } = await supabase
        .from("proposta_simulacao")
        .insert([{
          solicitacao_id: sim.id,
          banco_credor_id: parseInt(bancoId),
          tipo_operacao_id: parseInt(tipoOperacaoId),
          tipo_produto_id: parseInt(tipoProdutoId),
          usuario_digitador_id: usuarioDigitadorId,
          valor_liberado: parseCurrency(valorLiberado),
          valor_parcela: parseCurrency(valorParcela),
          numero_parcelas: parseInt(numeroParcelas) || null,
          taxa_juros: parseCurrency(taxaJuros),
          tps: parseCurrency(tps),
        }])

      if (error) throw error
      await carregarPropostas(sim.id)
      setBancoId('')
      setTipoOperacaoId('')
      setTipoProdutoId('')
      setValorLiberado('')
      setValorParcela('')
      setNumeroParcelas('')
      setTaxaJuros('')
      setTps('')
    } catch (err) {
      console.error('Erro ao adicionar proposta:', err)
      alert('Erro: ' + err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function handleGravar() {
    setSalvando(true)
    try {
      if (bancoId && tipoOperacaoId && tipoProdutoId) {
        let usuarioDigitadorId = null
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: usuarioLogado } = await supabase
            .from("usuario")
            .select("id")
            .eq("auth_user_id", user.id)
            .maybeSingle()
          if (usuarioLogado) usuarioDigitadorId = usuarioLogado.id
        }

        const { error } = await supabase
          .from("proposta_simulacao")
          .insert([{
            solicitacao_id: sim.id,
            banco_credor_id: parseInt(bancoId),
            tipo_operacao_id: parseInt(tipoOperacaoId),
            tipo_produto_id: parseInt(tipoProdutoId),
            usuario_digitador_id: usuarioDigitadorId,
            valor_liberado: parseCurrency(valorLiberado),
            valor_parcela: parseCurrency(valorParcela),
            numero_parcelas: parseInt(numeroParcelas) || null,
            taxa_juros: parseCurrency(taxaJuros),
            tps: parseCurrency(tps),
          }])

        if (error) throw error

        await carregarPropostas(sim.id)

        setBancoId('')
        setTipoOperacaoId('')
        setTipoProdutoId('')
        setValorLiberado('')
        setValorParcela('')
        setNumeroParcelas('')
        setTaxaJuros('')
        setTps('')
      }

      const { data } = await supabase
        .from('solicitacao_simulacao')
        .select(`status, status_id, status_simulacao:status_id (nome, cor)`)
        .eq('id', sim.id)
        .single()
      const nomeStatus = data?.status_simulacao?.nome || data?.status || sim?.status
      setModalSucesso(nomeStatus)
      setSelectedStatusId(data?.status_id ? String(data.status_id) : '')
    } catch (err) {
      console.error('Erro ao gravar:', err)
      alert('Erro: ' + err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function handleOk() {
    if (selectedStatusId) {
      await supabase
        .from('solicitacao_simulacao')
        .update({ status_id: parseInt(selectedStatusId), atualizado_em: new Date().toISOString() })
        .eq('id', sim.id)
    }
    setModalSucesso(null)
    setSelectedStatusId('')
    localStorage.removeItem('selectedSimulacao_crmwa')
    setPaginaAtual('esteira-simulacoes')
  }

  if (carregando) {
    return <LoadingBars />
  }

  if (!sim) return null

  return (
    <div className="form-container">
      <header className="form-header">
        <h1>Simulação #{sim.id}</h1>
      </header>

      <div className="form-content" style={{ width: '95%', maxWidth: '900px' }}>
        <div className="ds-section">
          <h2 className="ds-section-title">Dados do Cliente</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 'bold', color: '#555' }}>NOME:</label>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginTop: 4 }}>{sim.nome?.toUpperCase() || 'N/A'}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 'bold', color: '#555' }}>CPF:</label>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginTop: 4 }}>
                {sim.cpf
                  ? `${sim.cpf.slice(0, 3)}.${sim.cpf.slice(3, 6)}.${sim.cpf.slice(6, 9)}-${sim.cpf.slice(9, 11)}`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="ds-divider" />

        <div className="ds-section">
          <h2 className="ds-section-title">Lista de Propostas ({propostas.length})</h2>
          {propostas.length === 0 ? (
            <p className="ds-empty-msg">Nenhuma proposta adicionada.</p>
          ) : (
            <div className="ds-propostas-list">
              {propostas.map((p, idx) => {
                const banco = bancos.find(b => b.id === p.banco_credor_id)
                const operacao = operacoes.find(o => o.id === p.tipo_operacao_id)
                const produto = tiposProduto.find(t => t.id === p.tipo_produto_id)
                return (
                  <div key={p.id} className="ds-proposta-item">
                    <div className="ds-proposta-header">
                      <span className="ds-proposta-num">Proposta #{idx + 1}</span>
                      <span className="ds-proposta-operacao">{operacao?.nome || 'N/A'} — {produto?.nome || 'N/A'}</span>
                    </div>
                    <div className="ds-proposta-body">
                      <div><label>Banco:</label> {banco?.nome || 'N/A'}</div>
                      <div><label>Valor Liberado:</label> R$ {p.valor_liberado != null ? Number(p.valor_liberado).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'N/A'}</div>
                      <div><label>Valor Parcela:</label> R$ {p.valor_parcela != null ? Number(p.valor_parcela).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'N/A'}</div>
                      <div><label>Nº Parcelas:</label> {p.numero_parcelas || 'N/A'}</div>
                      <div><label>Taxa Juros:</label> {p.taxa_juros != null ? Number(p.taxa_juros).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '%' : 'N/A'}</div>
                      <div><label>TPS:</label> R$ {p.tps != null ? Number(p.tps).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'N/A'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {!readOnly && <div className="ds-divider" />}

        {!readOnly && (
        <div className="ds-section">
          <h2 className="ds-section-title">Adicionar Proposta</h2>
          <div className="ds-form-grid">
            <div className="ds-form-group">
              <label>Banco <span className="required-asterisk">*</span></label>
              <select value={bancoId} onChange={e => setBancoId(e.target.value)}>
                <option value="">Selecione</option>
                {bancos.map(b => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </select>
            </div>
            <div className="ds-form-group">
              <label>Operação <span className="required-asterisk">*</span></label>
              <select value={tipoOperacaoId} onChange={e => setTipoOperacaoId(e.target.value)} disabled={!bancoId}>
                <option value="">Selecione</option>
                {operacoesPermitidas.map(op => (
                  <option key={op.id} value={op.id}>{op.nome}</option>
                ))}
              </select>
            </div>
            <div className="ds-form-group">
              <label>Produto <span className="required-asterisk">*</span></label>
              <select value={tipoProdutoId} onChange={e => setTipoProdutoId(e.target.value)} disabled={!tipoOperacaoId}>
                <option value="">Selecione</option>
                {tiposProduto.filter(p => String(p.tipo_operacao_id) === String(tipoOperacaoId)).map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div className="ds-form-group">
              <label>Valor Liberado (R$)</label>
              <input type="text" value={valorLiberado} onChange={e => handleCurrencyInput(e.target.value, setValorLiberado)} placeholder="0,00" />
            </div>
            <div className="ds-form-group">
              <label>Valor Parcela (R$)</label>
              <input type="text" value={valorParcela} onChange={e => handleCurrencyInput(e.target.value, setValorParcela)} placeholder="0,00" />
            </div>
            <div className="ds-form-group">
              <label>Nº Parcelas</label>
              <input type="text" value={numeroParcelas} onChange={e => setNumeroParcelas(e.target.value)} placeholder="Ex: 12" />
            </div>
            <div className="ds-form-group">
              <label>Taxa de Juros (%)</label>
              <input type="text" value={taxaJuros} onChange={e => setTaxaJuros(e.target.value)} placeholder="0,00" />
            </div>
            <div className="ds-form-group">
              <label>TPS (R$)</label>
              <input type="text" value={tps} onChange={e => handleCurrencyInput(e.target.value, setTps)} placeholder="0,00" />
            </div>
          </div>
          <div className="ds-form-add-btn">
            <button
              className="btn-adicionar"
              onClick={handleAdicionarProposta}
              disabled={salvando || !bancoId || !tipoOperacaoId || !tipoProdutoId}
            >
              {salvando ? 'SALVANDO...' : 'ADICIONAR PROPOSTA'}
            </button>
          </div>
        </div>
        )}

        <div className="ds-page-actions">
          <button className="btn-voltar" onClick={voltar}>VOLTAR</button>
          {!readOnly && (
          <button
            className="btn-voltar"
            onClick={handleGravar}
            disabled={salvando}
          >
            {salvando ? 'SALVANDO...' : 'GRAVAR'}
          </button>
          )}
        </div>
      </div>

      {modalSucesso && (
        <div className="modal-overlay" onClick={() => setModalSucesso(null)}>
          <div className="sim-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 540, width: '90%' }}>
            <div className="modal-header">
              <h2>Simulação Gravada</h2>
            </div>
            <div className="sim-modal-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <p style={{ fontSize: 16, marginBottom: 12 }}>Simulação gravada com sucesso!</p>
              <p style={{ fontSize: 14, color: '#555' }}>
                Status atual da simulação:{' '}
                <strong style={{ color: statusList.find(s => s.nome === modalSucesso)?.cor || '#3f3b6c', textTransform: 'capitalize' }}>{modalSucesso}</strong>
              </p>

              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

              <p style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>Alterar status da simulação:</p>
              <select
                value={selectedStatusId}
                onChange={e => setSelectedStatusId(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 6,
                  border: '1px solid #ccc', fontSize: 14, marginBottom: 12
                }}
              >
                <option value="">Selecione um status</option>
                {statusList.map(s => (
                  <option key={s.id} value={s.id} style={{ color: s.cor || '#000' }}>{s.nome}</option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn-voltar-modal" onClick={handleOk}>Gravar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatarTamanho(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}
