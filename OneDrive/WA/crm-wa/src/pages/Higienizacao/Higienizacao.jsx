import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import { Upload, Trash2, AlertTriangle, Sparkles, Users, Plus, Pencil, X, Shield, FileSpreadsheet } from 'lucide-react'
import './Higienizacao.css'

export default function Higienizacao() {
  const [tabAtiva, setTabAtiva] = useState('higienizacao')

  const fileRef = useRef(null)
  const [arquivo, setArquivo] = useState(null)
  const [totalLinhas, setTotalLinhas] = useState(0)
  const [cpfs, setCpfs] = useState([])
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [confirmar, setConfirmar] = useState(false)
  const [higienizando, setHigienizando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  const [usuariosExternos, setUsuariosExternos] = useState([])
  const [promotoras, setPromotoras] = useState([])
  const [bancos, setBancos] = useState([])
  const [convenios, setConvenios] = useState([])
  const [filtroBanco, setFiltroBanco] = useState('')
  const [filtroConvenio, setFiltroConvenio] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState({ usuario: '', senha: '', promotora_id: '', banco_id: '' })
  const [salvando, setSalvando] = useState(false)
  const [erroModal, setErroModal] = useState('')

  useEffect(() => {
    if (tabAtiva === 'usuarios') {
      carregarUsuariosExternos()
      carregarPromotoras()
      carregarBancos()
    }
    if (tabAtiva === 'higienizacao') {
      carregarBancos()
      carregarConvenios()
    }
  }, [tabAtiva])

  async function carregarUsuariosExternos() {
    const { data } = await supabase
      .from('usuario_externo')
      .select('*, promotora:promotora_id(nome), banco:banco_id(nome)')
      .order('usuario')
    if (data) setUsuariosExternos(data)
  }

  async function carregarPromotoras() {
    const { data } = await supabase.from('promotora').select('id, nome').eq('ativo', true).order('nome')
    if (data) setPromotoras(data)
  }

  async function carregarBancos() {
    const { data } = await supabase.from('banco_operacao').select('id, nome').eq('ativo', true).order('nome')
    if (data) setBancos(data)
  }

  async function carregarConvenios() {
    const { data } = await supabase.from('convenio').select('id, nome').eq('ativo', true).order('nome')
    if (data) setConvenios(data)
  }

  function abrirModal(u = null) {
    if (u) {
      setEditandoId(u.id)
      setForm({ usuario: u.usuario, senha: '', promotora_id: u.promotora_id ?? '', banco_id: u.banco_id ?? '' })
    } else {
      setEditandoId(null)
      setForm({ usuario: '', senha: '', promotora_id: '', banco_id: '' })
    }
    setErroModal('')
    setShowModal(true)
  }

  async function salvarUsuario() {
    if (!form.usuario || !form.senha) {
      setErroModal('Preencha usuário e senha.')
      return
    }
    setSalvando(true)
    setErroModal('')
    try {
      const payload = {
        usuario: form.usuario,
        senha: form.senha,
        promotora_id: form.promotora_id ? Number(form.promotora_id) : null,
        banco_id: form.banco_id ? Number(form.banco_id) : null,
      }
      if (editandoId) {
        const { error } = await supabase.from('usuario_externo').update(payload).eq('id', editandoId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('usuario_externo').insert([payload])
        if (error) throw error
      }
      setShowModal(false)
      carregarUsuariosExternos()
    } catch (err) {
      setErroModal(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function deletarUsuario(id) {
    if (!confirm('Remover este usuário?')) return
    await supabase.from('usuario_externo').delete().eq('id', id)
    carregarUsuariosExternos()
  }

  async function toggleAtivo(id, ativo) {
    await supabase.from('usuario_externo').update({ ativo: !ativo }).eq('id', id)
    carregarUsuariosExternos()
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setArquivo(file)
    setResultado(null)
    setConfirmar(false)
    setConcluido(false)
    setTotalLinhas(0)
    setCpfs([])

    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const dados = XLSX.utils.sheet_to_json(ws, { header: 1 })
      const linhas = dados.filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''))
      setTotalLinhas(linhas.length)
      const cpfsExtraidos = dados
        .flat()
        .filter(Boolean)
        .map(v => String(v).replace(/\D/g, ''))
        .filter(v => v.length === 11)
      setCpfs(cpfsExtraidos)
    } catch (err) {
      console.error('Erro ao ler arquivo:', err)
    }
  }

  async function handleProcessar() {
    if (!arquivo) return
    setProcessando(true)
    setResultado(null)
    setConfirmar(false)
    setConcluido(false)
    try {
      const buf = await arquivo.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const dados = XLSX.utils.sheet_to_json(ws, { header: 1 })
      const cpfsExtraidos = dados
        .flat()
        .filter(Boolean)
        .map(v => String(v).replace(/\D/g, ''))
        .filter(v => v.length === 11)
      if (cpfsExtraidos.length === 0) {
        alert('Nenhum CPF válido encontrado no arquivo.')
        setProcessando(false)
        return
      }
      setCpfs(cpfsExtraidos)

      let query = supabase
        .from('solicitacao_simulacao')
        .select('id, cpf, status, criado_em, usuario:usuario_id(nome), convenio:convenio_id(nome)')
        .in('cpf', cpfsExtraidos)

      if (filtroBanco) {
        query = query.eq('banco_credor_id', Number(filtroBanco))
      }
      if (filtroConvenio) {
        query = query.eq('convenio_id', Number(filtroConvenio))
      }

      const { data, error } = await query

      if (error) throw error
      setResultado(data || [])
    } catch (err) {
      console.error('Erro ao processar:', err)
      alert('Erro ao processar: ' + err.message)
    } finally {
      setProcessando(false)
    }
  }

  async function handleHigienizar() {
    if (!resultado || resultado.length === 0) return

    setHigienizando(true)
    try {
      const ids = resultado.map(r => r.id)

      const { error: errProposta } = await supabase
        .from('proposta_simulacao')
        .delete()
        .in('solicitacao_id', ids)
      if (errProposta) throw errProposta

      const { error: errContratos } = await supabase
        .from('contratos_simulacao')
        .delete()
        .in('solicitacao_id', ids)
      if (errContratos) throw errContratos

      const { error: errMatriculas } = await supabase
        .from('matricula_simulacao')
        .delete()
        .in('solicitacao_id', ids)
      if (errMatriculas) throw errMatriculas

      const { error: errInfo } = await supabase
        .from('informacoes_pessoais_simulacao')
        .delete()
        .in('solicitacao_id', ids)
      if (errInfo) throw errInfo

      const { error: errArquivos } = await supabase
        .from('solicitacao_simulacao_arquivo')
        .delete()
        .in('solicitacao_id', ids)
      if (errArquivos) throw errArquivos

      const { error: errSolicitacao } = await supabase
        .from('solicitacao_simulacao')
        .delete()
        .in('id', ids)
      if (errSolicitacao) throw errSolicitacao

      setConcluido(true)
      setConfirmar(false)
    } catch (err) {
      console.error('Erro ao higienizar:', err)
      alert('Erro ao higienizar: ' + err.message)
    } finally {
      setHigienizando(false)
    }
  }

  return (
    <div className="form-container">
      <header className="form-header">
        <h1>Higienização</h1>
        <p className="header-subtitle">Remover registros de simulação por CPF</p>
      </header>

      <div className="higienizacao-card">
        <div className="higienizacao-tabs">
          <button
            className={`higienizacao-tab ${tabAtiva === 'higienizacao' ? 'active' : ''}`}
            onClick={() => setTabAtiva('higienizacao')}
          >
            <Trash2 size={16} />
            <span>Higienização</span>
          </button>
          <button
            className={`higienizacao-tab ${tabAtiva === 'usuarios' ? 'active' : ''}`}
            onClick={() => setTabAtiva('usuarios')}
          >
            <Users size={16} />
            <span>Usuários</span>
          </button>
        </div>

        {tabAtiva === 'higienizacao' && (
        <>
        <div className="higienizacao-filtros">
          <select
            className="higienizacao-input"
            value={filtroBanco}
            onChange={e => setFiltroBanco(e.target.value)}
          >
            <option value="">Todos os bancos</option>
            {bancos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
          </select>
          <select
            className="higienizacao-input"
            value={filtroConvenio}
            onChange={e => setFiltroConvenio(e.target.value)}
          >
            <option value="">Todos os convênios</option>
            {convenios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="higienizacao-upload">
          <div className="higienizacao-upload-top">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="higienizacao-file-input"
              hidden
            />
            <button className="higienizacao-btn" onClick={() => fileRef.current?.click()}>
              <FileSpreadsheet size={18} />
              {arquivo ? arquivo.name : 'SELECIONAR ARQUIVO EXCEL'}
            </button>
            {arquivo && (
              <span className="higienizacao-arquivo-info">
                {totalLinhas > 0 ? `${totalLinhas} linha(s) — ${cpfs.length} CPF(s) encontrados` : 'Lendo arquivo...'}
              </span>
            )}
          </div>
          {arquivo && (
            <div className="higienizacao-upload-bottom">
              <button className="higienizacao-btn" onClick={handleProcessar} disabled={processando}>
                <Upload size={18} />
                {processando ? 'PROCESSANDO...' : 'PROCESSAR'}
              </button>
            </div>
          )}
        </div>

        {resultado && !concluido && (
          <div className="higienizacao-resultado">
            <p className="higienizacao-qtd">
              {resultado.length === 0
                ? 'Nenhum registro encontrado para os CPFs do arquivo.'
                : `${resultado.length} registro(s) encontrado(s) para ${cpfs.length} CPF(s).`}
            </p>

            {resultado.length > 0 && (
              <table className="higienizacao-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Convênio</th>
                    <th>Usuário</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.map(r => (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td>{r.convenio?.nome || 'N/A'}</td>
                      <td>{r.usuario?.nome || 'N/A'}</td>
                      <td>{r.status || 'pendente'}</td>
                      <td>{new Date(r.criado_em).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {resultado.length > 0 && !confirmar && (
              <button className="higienizacao-btn-danger" onClick={() => setConfirmar(true)}>
                <Trash2 size={18} />
                HIGIENIZAR REGISTROS
              </button>
            )}

            {confirmar && (
              <div className="higienizacao-confirmar">
                <AlertTriangle size={24} />
                <p>Tem certeza que deseja remover {resultado.length} registro(s)? Esta ação não pode ser desfeita.</p>
                <div className="higienizacao-confirmar-actions">
                  <button className="higienizacao-btn" onClick={() => setConfirmar(false)} disabled={higienizando}>
                    CANCELAR
                  </button>
                  <button className="higienizacao-btn-danger" onClick={handleHigienizar} disabled={higienizando}>
                    {higienizando ? 'HIGIENIZANDO...' : 'CONFIRMAR'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {concluido && (
          <div className="higienizacao-concluido">
            <Sparkles size={40} />
            <h2>Higienização concluída!</h2>
            <p>{resultado.length} registro(s) removido(s) com sucesso.</p>
            <button className="higienizacao-btn" onClick={() => { setArquivo(null); setCpfs([]); setResultado(null); setConcluido(false); if (fileRef.current) fileRef.current.value = '' }}>
              NOVA HIGIENIZAÇÃO
            </button>
          </div>
        )}
        </>
        )}

        {tabAtiva === 'usuarios' && (
          <div className="higienizacao-usuarios">
            <div className="higienizacao-usuarios-header">
              <h2>Usuários Externos</h2>
              <button className="higienizacao-btn" onClick={() => abrirModal()}>
                <Plus size={16} /> ADICIONAR USUÁRIO
              </button>
            </div>

            {usuariosExternos.length === 0 ? (
              <p className="higienizacao-qtd">Nenhum usuário cadastrado.</p>
            ) : (
              <table className="higienizacao-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Promotora</th>
                    <th>Banco</th>
                    <th>Ativo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosExternos.map(u => (
                    <tr key={u.id}>
                      <td>{u.usuario}</td>
                      <td>{u.promotora?.nome || '—'}</td>
                      <td>{u.banco?.nome || '—'}</td>
                      <td>
                        <button
                          className={`higienizacao-toggle ${u.ativo !== false ? 'ativo' : ''}`}
                          onClick={() => toggleAtivo(u.id, u.ativo)}
                        >
                          {u.ativo !== false ? 'Sim' : 'Não'}
                        </button>
                      </td>
                      <td className="higienizacao-acoes">
                        <button className="higienizacao-btn-icon" onClick={() => abrirModal(u)} title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button className="higienizacao-btn-icon danger" onClick={() => deletarUsuario(u.id)} title="Remover">
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {showModal && (
          <div className="higienizacao-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="higienizacao-modal" onClick={e => e.stopPropagation()}>
              <div className="higienizacao-modal-header">
                <h3>{editandoId ? 'Editar Usuário' : 'Adicionar Usuário'}</h3>
                <button className="higienizacao-btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="higienizacao-modal-body">
                <label>Usuário</label>
                <input
                  className="higienizacao-input"
                  value={form.usuario}
                  onChange={e => setForm({ ...form, usuario: e.target.value })}
                  placeholder="Nome de usuário"
                />
                <label>Senha</label>
                <input
                  className="higienizacao-input"
                  type="password"
                  value={form.senha}
                  onChange={e => setForm({ ...form, senha: e.target.value })}
                  placeholder={editandoId ? 'Deixe em branco para manter' : 'Senha'}
                />
                <label>Promotora</label>
                <select
                  className="higienizacao-input"
                  value={form.promotora_id}
                  onChange={e => setForm({ ...form, promotora_id: e.target.value })}
                >
                  <option value="">Selecione uma promotora</option>
                  {promotoras.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
                <label>Banco</label>
                <select
                  className="higienizacao-input"
                  value={form.banco_id}
                  onChange={e => setForm({ ...form, banco_id: e.target.value })}
                >
                  <option value="">Selecione um banco</option>
                  {bancos.map(b => (
                    <option key={b.id} value={b.id}>{b.nome}</option>
                  ))}
                </select>
              
                {erroModal && <p className="higienizacao-erro-modal">{erroModal}</p>}
              </div>
              <div className="higienizacao-modal-footer">
                <button className="higienizacao-btn" onClick={() => setShowModal(false)}>CANCELAR</button>
                <button className="higienizacao-btn" onClick={salvarUsuario} disabled={salvando}>
                  {salvando ? 'SALVANDO...' : 'SALVAR'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
