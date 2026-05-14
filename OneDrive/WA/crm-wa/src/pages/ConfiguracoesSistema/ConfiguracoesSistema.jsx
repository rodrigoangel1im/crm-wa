import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Building2, ArrowLeftRight, Handshake, Plus, Save, Settings, Power, PowerOff, Pencil } from 'lucide-react'
import './ConfiguracoesSistema.css'

const TABS = [
  { id: 'bancos', label: 'Bancos', icon: Building2 },
  { id: 'em breve', label: 'Em breve...', icon: Settings, disabled: true },
]

export default function ConfiguracoesSistema() {
  const [tabAtiva, setTabAtiva] = useState('bancos')
  const [bancos, setBancos] = useState([])
  const [operacoes, setOperacoes] = useState([])
  const [convenios, setConvenios] = useState([])
  const [loading, setLoading] = useState(true)

  const [bancoId, setBancoId] = useState(null)
  const [operacoesIds, setOperacoesIds] = useState([])
  const [conveniosIds, setConveniosIds] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [modalForm, setModalForm] = useState({ nome: '', codigo: '' })
  const [modalErro, setModalErro] = useState('')
  const [editandoBanco, setEditandoBanco] = useState(null)

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (bancoId) carregarVinculos()
  }, [bancoId])

  async function carregarDados() {
    setLoading(true)
    try {
      const [bancosRes, operacoesRes, conveniosRes] = await Promise.all([
        supabase.from('banco_operacao').select('*').order('nome'),
        supabase.from('tipo_operacao').select('*').order('nome'),
        supabase.from('convenio').select('*').eq('ativo', true).order('nome'),
      ])
      if (bancosRes.error) throw bancosRes.error
      if (operacoesRes.error) throw operacoesRes.error
      if (conveniosRes.error) throw conveniosRes.error
      setBancos(bancosRes.data || [])
      setOperacoes(operacoesRes.data || [])
      setConvenios(conveniosRes.data || [])
    } catch (err) {
      console.error('Erro ao carregar:', err)
    } finally {
      setLoading(false)
    }
  }

  async function carregarVinculos() {
    try {
      const [opRes, covRes] = await Promise.all([
        supabase.from('banco_tipo_operacao').select('tipo_operacao_id').eq('banco_id', bancoId),
        supabase.from('banco_convenio').select('convenio_id').eq('banco_id', bancoId),
      ])
      setOperacoesIds((opRes.data || []).map(v => v.tipo_operacao_id))
      setConveniosIds((covRes.data || []).map(v => v.convenio_id))
      setMensagem('')
    } catch (err) {
      console.error('Erro ao carregar vínculos:', err)
    }
  }

  function toggle(arr, setter, id) {
    setter(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  function abrirModalNovo() {
    setEditandoBanco(null)
    setModalForm({ nome: '', codigo: '' })
    setModalErro('')
    setModalAberto(true)
  }

  function abrirModalEditar(b) {
    setEditandoBanco(b)
    setModalForm({ nome: b.nome || '', codigo: b.codigo || '' })
    setModalErro('')
    setModalAberto(true)
  }

  async function salvarBanco() {
    if (!modalForm.nome.trim()) {
      setModalErro('Nome é obrigatório')
      return
    }
    try {
      if (editandoBanco) {
        const { error } = await supabase
          .from('banco_operacao')
          .update({ nome: modalForm.nome.trim(), codigo: modalForm.codigo })
          .eq('id', editandoBanco.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('banco_operacao')
          .insert([{ nome: modalForm.nome.trim(), codigo: modalForm.codigo }])
        if (error) throw error
      }
      setModalAberto(false)
      setModalForm({ nome: '', codigo: '' })
      setModalErro('')
      await carregarDados()
    } catch (err) {
      setModalErro(err.message)
    }
  }

  async function toggleAtivo(b, e) {
    e.stopPropagation()
    try {
      await supabase.from('banco_operacao').update({ ativo: !b.ativo }).eq('id', b.id)
      if (bancoId === b.id && b.ativo) {
        setBancoId(null)
      }
      await carregarDados()
    } catch (err) {
      console.error('Erro ao alternar status:', err)
    }
  }

  async function salvar() {
    if (!bancoId) return
    setSalvando(true)
    setMensagem('')
    try {
      const bid = bancoId

      await supabase.from('banco_tipo_operacao').delete().eq('banco_id', bid)
      if (operacoesIds.length > 0) {
        const { error } = await supabase.from('banco_tipo_operacao').insert(
          operacoesIds.map(id => ({ banco_id: bid, tipo_operacao_id: id }))
        )
        if (error) throw error
      }

      await supabase.from('banco_convenio').delete().eq('banco_id', bid)
      if (conveniosIds.length > 0) {
        const { error } = await supabase.from('banco_convenio').insert(
          conveniosIds.map(id => ({ banco_id: bid, convenio_id: id }))
        )
        if (error) throw error
      }

      setMensagem('ok')
    } catch (err) {
      setMensagem('erro: ' + err.message)
    } finally {
      setSalvando(false)
    }
  }

  const bancoAtual = bancos.find(b => b.id === bancoId)

  return (
    <div className="config-sistema-page">
      <header className="config-sistema-header">
        <div>
          <h1>Configurações do Sistema</h1>
          <p className="config-sistema-subtitle">Gerencie bancos, operações e convênios do sistema</p>
        </div>
      </header>

      <div className="config-sistema-card">
        <div className="config-sistema-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`config-tab ${tabAtiva === tab.id ? 'active' : ''}`}
              onClick={() => !tab.disabled && setTabAtiva(tab.id)}
              disabled={tab.disabled}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {tabAtiva === 'bancos' && (
          <div className="config-dual">
            <aside className="config-dual-sidebar">
              <div className="config-dual-sidebar-header">
                <Building2 size={16} />
                <span>Bancos</span>
                <span className="config-dual-count">{bancos.length}</span>
                <button className="config-dual-add-btn" onClick={abrirModalNovo} title="Novo banco">
                  <Plus size={14} />
                </button>
              </div>
              <div className="config-dual-lista">
                {bancos.map(b => (
                  <div
                    key={b.id}
                    className={`config-dual-item ${bancoId === b.id ? 'active' : ''}`}
                    onClick={() => setBancoId(b.id)}
                  >
                    <div className="config-dual-item-info">
                      <span className="config-dual-item-nome">{b.nome}</span>
                      <span className={`config-badge-sm ${b.ativo ? 'ativo' : 'inativo'}`}>
                        {b.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="config-dual-item-actions">
                      <button className="config-dual-item-btn" onClick={(e) => abrirModalEditar(b)} title="Editar">
                        <Pencil size={12} />
                      </button>
                      <button className="config-dual-item-btn" onClick={(e) => toggleAtivo(b, e)} title={b.ativo ? 'Inativar' : 'Ativar'}>
                        {b.ativo ? <PowerOff size={12} /> : <Power size={12} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <main className="config-dual-content">
              {!bancoId ? (
                <div className="config-dual-empty">
                  <div className="config-dual-empty-icon">
                    <Building2 size={48} />
                  </div>
                  <h3>Selecione um banco</h3>
                  <p>Escolha um banco na lista ao lado para configurar suas operações e convênios.</p>
                </div>
              ) : (
                <div className="config-dual-detail">
                  <div className="config-dual-detail-header">
                    <div className="config-dual-detail-avatar">
                      {bancoAtual?.nome?.charAt(0) || 'B'}
                    </div>
                    <div>
                      <h2>{bancoAtual?.nome}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`config-status ${bancoAtual?.ativo ? 'ativo' : 'inativo'}`}>
                          {bancoAtual?.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <button className="config-dual-item-btn" onClick={(e) => abrirModalEditar(bancoAtual)} title="Editar banco" style={{ width: 28, height: 28 }}>
                          <Pencil size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <section className="config-dual-section">
                    <div className="config-dual-section-title">
                      <ArrowLeftRight size={18} />
                      Operações
                    </div>
                    <p className="config-dual-hint">Tipos de operação que este banco pode realizar:</p>
                    <div className="config-dual-grid">
                      {operacoes.map(op => (
                        <label key={op.id} className={`config-chip ${operacoesIds.includes(op.id) ? 'checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={operacoesIds.includes(op.id)}
                            onChange={() => toggle(operacoesIds, setOperacoesIds, op.id)}
                          />
                          <span>{op.nome}</span>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="config-dual-section">
                    <div className="config-dual-section-title">
                      <Handshake size={18} />
                      Convênios
                    </div>
                    <p className="config-dual-hint">Convênios que este banco pode atender:</p>
                    <div className="config-dual-grid">
                      {convenios.length === 0 ? (
                        <p className="config-dual-hint" style={{ fontStyle: 'italic' }}>Nenhum convênio ativo cadastrado.</p>
                      ) : (
                        convenios.map(c => (
                          <label key={c.id} className={`config-chip ${conveniosIds.includes(c.id) ? 'checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={conveniosIds.includes(c.id)}
                              onChange={() => toggle(conveniosIds, setConveniosIds, c.id)}
                            />
                            <span>{c.nome}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </section>

                  <div className="config-dual-save-bar">
                    <button className="config-btn-primary" onClick={salvar} disabled={salvando}>
                      <Save size={16} />
                      {salvando ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                    {mensagem === 'ok' && <span className="config-toast success">Salvo com sucesso!</span>}
                    {mensagem.startsWith('erro') && <span className="config-toast error">{mensagem.replace('erro: ', '')}</span>}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              {editandoBanco ? 'Editar Banco' : 'Novo Banco'}
            </div>
            <div className="modal-body" style={{ padding: 20 }}>
              <div className="config-form">
                <div className="config-field">
                  <label>Nome</label>
                  <input
                    type="text"
                    value={modalForm.nome}
                    onChange={e => setModalForm({ ...modalForm, nome: e.target.value })}
                    className="config-input"
                    placeholder="Nome do banco"
                    autoFocus
                  />
                </div>
                <div className="config-field">
                  <label>Código</label>
                  <input
                    type="text"
                    value={modalForm.codigo}
                    onChange={e => setModalForm({ ...modalForm, codigo: e.target.value })}
                    className="config-input"
                    placeholder="Código do banco"
                  />
                </div>
              </div>
              {modalErro && <div className="config-erro">{modalErro}</div>}
            </div>
            <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-cancel" onClick={() => { setModalAberto(false); setModalErro('') }}>Cancelar</button>
              <button className="btn-primary" onClick={salvarBanco}>{editandoBanco ? 'Salvar' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
