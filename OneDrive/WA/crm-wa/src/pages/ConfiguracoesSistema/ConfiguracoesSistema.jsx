import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Building2, ArrowLeftRight, Handshake, Package, UserPlus, Plus, Save, Power, PowerOff, Pencil, Trash2 } from 'lucide-react'
import './ConfiguracoesSistema.css'
import LoadingBars from '../../components/LoadingBars/LoadingBars'

const TABS = [
  { id: 'bancos', label: 'Bancos', icon: Building2 },
  { id: 'produtos', label: 'Produtos', icon: Package },
  { id: 'convenios', label: 'Convênios', icon: Handshake },
  { id: 'promotora', label: 'Promotoras', icon: UserPlus },
]

export default function ConfiguracoesSistema() {
  const [tabAtiva, setTabAtiva] = useState('bancos')
  const [bancos, setBancos] = useState([])
  const [operacoes, setOperacoes] = useState([])
  const [convenios, setConvenios] = useState([])
  const [promotoras, setPromotoras] = useState([])
  const [loading, setLoading] = useState(true)

  const [bancoId, setBancoId] = useState(null)
  const [operacoesIds, setOperacoesIds] = useState([])
  const [conveniosIds, setConveniosIds] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [modalForm, setModalForm] = useState({ nome: '', codigo: '', tipo: '' })
  const [modalErro, setModalErro] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [modalTipo, setModalTipo] = useState('banco')

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (tabAtiva === 'bancos' && bancoId) carregarVinculos()
  }, [bancoId, tabAtiva])

  async function carregarDados() {
    setLoading(true)
    try {
      const [bancosRes, operacoesRes, conveniosRes, promotorasRes] = await Promise.all([
        supabase.from('banco_operacao').select('*').order('nome'),
        supabase.from('tipo_operacao').select('*').order('nome'),
        supabase.from('convenio').select('*').order('nome'),
        supabase.from('promotora').select('*').order('nome'),
      ])
      if (bancosRes.error) throw bancosRes.error
      if (operacoesRes.error) throw operacoesRes.error
      if (conveniosRes.error) throw conveniosRes.error
      if (promotorasRes.error) throw promotorasRes.error
      setBancos(bancosRes.data || [])
      setOperacoes(operacoesRes.data || [])
      setConvenios(conveniosRes.data || [])
      setPromotoras(promotorasRes.data || [])
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

  function abrirModal(tipo, item) {
    setModalTipo(tipo)
    setEditandoId(item?.id || null)
    setModalForm({ nome: item?.nome || '', codigo: item?.codigo || '', tipo: item?.tipo || '' })
    setModalErro('')
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditandoId(null)
    setModalForm({ nome: '', codigo: '', tipo: '' })
    setModalErro('')
  }

  async function salvarItem() {
    if (!modalForm.nome.trim()) {
      setModalErro('Nome é obrigatório')
      return
    }
    try {
      const payload = { nome: modalForm.nome.trim() }
      if (modalTipo === 'banco') payload.codigo = modalForm.codigo
      if (modalTipo === 'convenio') {
        if (!modalForm.tipo.trim()) {
          setModalErro('Tipo é obrigatório')
          return
        }
        payload.tipo = modalForm.tipo.trim()
      }

      if (editandoId) {
        const table = modalTipo === 'banco' ? 'banco_operacao' : modalTipo === 'produto' ? 'tipo_operacao' : modalTipo === 'promotora' ? 'promotora' : 'convenio'
        const { error } = await supabase.from(table).update(payload).eq('id', editandoId)
        if (error) throw error
      } else {
        const table = modalTipo === 'banco' ? 'banco_operacao' : modalTipo === 'produto' ? 'tipo_operacao' : modalTipo === 'promotora' ? 'promotora' : 'convenio'
        const { error } = await supabase.from(table).insert([payload])
        if (error) throw error
      }
      fecharModal()
      await carregarDados()
    } catch (err) {
      setModalErro(err.message)
    }
  }

  async function toggleAtivo(item, tipo) {
    try {
      const table = tipo === 'convenio' ? 'convenio' : tipo === 'promotora' ? 'promotora' : tipo === 'produto' ? 'tipo_operacao' : 'banco_operacao'
      await supabase.from(table).update({ ativo: !item.ativo }).eq('id', item.id)
      if (tipo === 'banco' && bancoId === item.id && item.ativo) {
        setBancoId(null)
      }
      await carregarDados()
    } catch (err) {
      console.error('Erro ao alternar status:', err)
    }
  }

  async function excluirItem(id, tipo) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return
    try {
      const table = tipo === 'produto' ? 'tipo_operacao' : tipo === 'promotora' ? 'promotora' : 'convenio'
      await supabase.from(table).delete().eq('id', id)
      await carregarDados()
    } catch (err) {
      console.error('Erro ao excluir:', err)
    }
  }

  async function salvarVinculos() {
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

  function renderListaSimples(items, tipo, IconComponent) {
    return (
      <div className="config-dual" style={{ minHeight: 400 }}>
        <aside className="config-dual-sidebar" style={{ borderRight: 'none' }}>
          <div className="config-dual-sidebar-header">
            <IconComponent size={16} />
            <span>{tipo === 'produto' ? 'Produtos' : tipo === 'promotora' ? 'Promotoras' : 'Convênios'}</span>
            <span className="config-dual-count">{items.length}</span>
            <button className="config-dual-add-btn" onClick={() => abrirModal(tipo)} title={`Novo ${tipo === 'produto' ? 'produto' : tipo === 'promotora' ? 'promotora' : 'convênio'}`}>
              <Plus size={14} />
            </button>
          </div>
          <div className="config-dual-lista">
            {items.length === 0 ? (
              <p style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                Nenhum {tipo === 'produto' ? 'produto' : tipo === 'promotora' ? 'promotora' : 'convênio'} cadastrado.
              </p>
            ) : (
              items.map(item => (
                <div key={item.id} className="config-dual-item">
                  <div className="config-dual-item-info">
                    <span className="config-dual-item-nome">{item.nome}</span>
                    {item.ativo !== undefined && (
                      <span className={`config-badge-sm ${item.ativo ? 'ativo' : 'inativo'}`}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    )}
                  </div>
                  <div className="config-dual-item-actions" style={{ display: 'flex' }}>
                    <button className="config-dual-item-btn" onClick={() => abrirModal(tipo, item)} title="Editar">
                      <Pencil size={12} />
                    </button>
                    {item.ativo !== undefined && (
                      <button className="config-dual-item-btn" onClick={() => toggleAtivo(item, tipo)} title={item.ativo ? 'Inativar' : 'Ativar'}>
                        {item.ativo ? <PowerOff size={12} /> : <Power size={12} />}
                      </button>
                    )}
                    <button className="config-dual-item-btn" onClick={() => excluirItem(item.id, tipo)} title="Excluir" style={{ color: '#dc2626' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    )
  }

  if (loading) {
    return <LoadingBars />
  }

  return (
    <div className="config-sistema-page">
      <header className="form-header">
        <div>
          <h1>Configurações do Sistema</h1>
          <p className="header-subtitle">Gerencie bancos, produtos, convênios e promotoras do sistema</p>
        </div>
      </header>

      <div className="config-sistema-card">
        <div className="config-sistema-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`config-tab ${tabAtiva === tab.id ? 'active' : ''}`}
              onClick={() => setTabAtiva(tab.id)}
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
                <button className="config-dual-add-btn" onClick={() => abrirModal('banco')} title="Novo banco">
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
                      <button className="config-dual-item-btn" onClick={(e) => { e.stopPropagation(); abrirModal('banco', b) }} title="Editar">
                        <Pencil size={12} />
                      </button>
                      <button className="config-dual-item-btn" onClick={(e) => { e.stopPropagation(); toggleAtivo(b, 'banco') }} title={b.ativo ? 'Inativar' : 'Ativar'}>
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
                        <button className="config-dual-item-btn" onClick={() => abrirModal('banco', bancoAtual)} title="Editar banco" style={{ width: 28, height: 28 }}>
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
                    <button className="config-btn-primary" onClick={salvarVinculos} disabled={salvando}>
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

        {tabAtiva === 'produtos' && renderListaSimples(operacoes, 'produto', Package)}

        {tabAtiva === 'convenios' && renderListaSimples(convenios, 'convenio', Handshake)}

        {tabAtiva === 'promotora' && renderListaSimples(promotoras, 'promotora', UserPlus)}

      </div>

      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              {editandoId
                ? `Editar ${modalTipo === 'banco' ? 'Banco' : modalTipo === 'produto' ? 'Produto' : modalTipo === 'promotora' ? 'Promotora' : 'Convênio'}`
                : `Novo ${modalTipo === 'banco' ? 'Banco' : modalTipo === 'produto' ? 'Produto' : modalTipo === 'promotora' ? 'Promotora' : 'Convênio'}`}
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
                    placeholder={`Nome do ${modalTipo === 'banco' ? 'banco' : modalTipo === 'produto' ? 'produto' : modalTipo === 'promotora' ? 'promotora' : 'convênio'}`}
                    autoFocus
                  />
                </div>
                {modalTipo === 'banco' && (
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
                )}
                {modalTipo === 'convenio' && (
                  <div className="config-field">
                    <label>Tipo</label>
                    <select
                      value={modalForm.tipo}
                      onChange={e => setModalForm({ ...modalForm, tipo: e.target.value })}
                      className="config-input"
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="INSS">INSS</option>
                      <option value="SIAPE Servidor">SIAPE Servidor</option>
                      <option value="SIAPE Pensionista">SIAPE Pensionista</option>
                      <option value="Estadual">Estadual</option>
                      <option value="Municipal">Municipal</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                )}
              </div>
              {modalErro && <div className="config-erro">{modalErro}</div>}
            </div>
            <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-cancel" onClick={fecharModal}>Cancelar</button>
              <button className="btn-primary" onClick={salvarItem}>{editandoId ? 'Salvar' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
