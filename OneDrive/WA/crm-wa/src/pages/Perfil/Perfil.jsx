import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, ClipboardList, Shield, Settings, User, Target, Clock, Key, File } from 'lucide-react'
import './Perfil.css'

const RECURSOS = [
  { id: 'propostas', nome: 'Propostas' },
  { id: 'simulacoes', nome: 'Simulações' },
  { id: 'contratos', nome: 'Contratos' },
  { id: 'usuarios', nome: 'Usuários' },
  { id: 'relatorios', nome: 'Relatórios' },
]

const PERFIS = ['Vendedor', 'Operacional', 'RH', 'Marketing', 'Administrador']

const ADMIN_TABS = [
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'logs', label: 'Atividades', icon: ClipboardList },
  { id: 'documentos', label: 'Documentos', icon: File },
  { id: 'permissoes', label: 'Permissões', icon: Shield },
  { id: 'config', label: 'Configurações', icon: Settings },
]

const USER_TABS = [
  { id: 'info', label: 'Informações Pessoais', icon: User },
  { id: 'documentos', label: 'Documentos', icon: File },
  { id: 'metas', label: 'Metas', icon: Target },
  { id: 'horarios', label: 'Horários', icon: Clock },
  { id: 'senhas', label: 'Senhas', icon: Key },
]

const FORM_INICIAL = {
  nome: '', email: '', login: '', senha: '', perfil: 'Vendedor', ativo: true, admin: false,
  cpf: '', rg: '', data_nascimento: '', telefone: '', telefone2: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  contato_emergencia_nome: '', contato_emergencia_telefone: '', contato_emergencia_parentesco: '',
  banco: '', agencia: '', conta: '', tipo_conta: '',
  cargo: '', posicao: '', salario: '', vale_transporte: '', email_corporativo: '',
}

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]

function ModalFormUsuario({ editando, form, setForm, salvar, erro }) {
  return (
    <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 4px' }}>
      <div className="modal-section-title">Dados Pessoais</div>
      <div className="form-row">
        <div className="form-group"><label>Nome</label><input type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
        <div className="form-group"><label>E-mail</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="usuario@email.com" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>CPF</label><input type="text" value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
        <div className="form-group"><label>RG</label><input type="text" value={form.rg} onChange={e => setForm({ ...form, rg: e.target.value })} /></div>
        <div className="form-group"><label>Data Nascimento</label><input type="date" value={form.data_nascimento} onChange={e => setForm({ ...form, data_nascimento: e.target.value })} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Telefone</label><input type="text" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" /></div>
        <div className="form-group"><label>Telefone 2</label><input type="text" value={form.telefone2} onChange={e => setForm({ ...form, telefone2: e.target.value })} placeholder="(11) 99999-9999" /></div>
      </div>
      {!editando && (
        <div className="form-group"><label>Senha</label><input type="password" value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} placeholder="Padrão: 123456" /></div>
      )}

      <div className="modal-section-title">Endereço</div>
      <div className="form-row">
        <div className="form-group" style={{ flex: 0.3 }}><label>CEP</label><input type="text" value={form.cep} onChange={e => setForm({ ...form, cep: e.target.value })} placeholder="00000-000" /></div>
        <div className="form-group" style={{ flex: 1 }}><label>Logradouro</label><input type="text" value={form.logradouro} onChange={e => setForm({ ...form, logradouro: e.target.value })} /></div>
        <div className="form-group" style={{ flex: 0.2 }}><label>Número</label><input type="text" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Complemento</label><input type="text" value={form.complemento} onChange={e => setForm({ ...form, complemento: e.target.value })} /></div>
        <div className="form-group"><label>Bairro</label><input type="text" value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Cidade</label><input type="text" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} /></div>
        <div className="form-group" style={{ flex: 0.3 }}><label>Estado</label>
          <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="config-input">
            <option value="">Selecione</option>
            {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
      </div>

      <div className="modal-section-title">Contato de Emergência</div>
      <div className="form-row">
        <div className="form-group"><label>Nome</label><input type="text" value={form.contato_emergencia_nome} onChange={e => setForm({ ...form, contato_emergencia_nome: e.target.value })} /></div>
        <div className="form-group"><label>Telefone</label><input type="text" value={form.contato_emergencia_telefone} onChange={e => setForm({ ...form, contato_emergencia_telefone: e.target.value })} /></div>
        <div className="form-group"><label>Parentesco</label><input type="text" value={form.contato_emergencia_parentesco} onChange={e => setForm({ ...form, contato_emergencia_parentesco: e.target.value })} /></div>
      </div>

      <div className="modal-section-title">Dados Financeiros</div>
      <div className="form-row">
        <div className="form-group"><label>Banco</label><input type="text" value={form.banco} onChange={e => setForm({ ...form, banco: e.target.value })} /></div>
        <div className="form-group"><label>Agência</label><input type="text" value={form.agencia} onChange={e => setForm({ ...form, agencia: e.target.value })} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Conta</label><input type="text" value={form.conta} onChange={e => setForm({ ...form, conta: e.target.value })} /></div>
        <div className="form-group"><label>Tipo</label>
          <select value={form.tipo_conta} onChange={e => setForm({ ...form, tipo_conta: e.target.value })} className="config-input">
            <option value="">Selecione</option>
            <option value="Corrente">Corrente</option>
            <option value="Poupança">Poupança</option>
            <option value="Salário">Salário</option>
          </select>
        </div>
      </div>

      <div className="modal-section-title">Dados Profissionais</div>
      <div className="form-row">
        <div className="form-group"><label>Cargo</label><input type="text" value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Vendedor" /></div>
        <div className="form-group"><label>Posição</label>
          <select value={form.posicao} onChange={e => setForm({ ...form, posicao: e.target.value })} className="config-input">
            <option value="">Selecione</option>
            <option value="A">A - Ativo</option>
            <option value="F">F - Férias</option>
            <option value="D">D - Demitido</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Salário</label><input type="text" value={form.salario} onChange={e => setForm({ ...form, salario: e.target.value })} placeholder="0,00" /></div>
        <div className="form-group"><label>Vale-Transporte</label><input type="text" value={form.vale_transporte} onChange={e => setForm({ ...form, vale_transporte: e.target.value })} placeholder="0,00" /></div>
        <div className="form-group"><label>E-mail Corporativo</label><input type="email" value={form.email_corporativo} onChange={e => setForm({ ...form, email_corporativo: e.target.value })} placeholder="usuario@empresa.com" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Perfil</label>
          <select value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value })} className="config-input">
            <option value="">Selecione</option>
            <option value="Administrador">Administrador</option>
            <option value="Operacional">Operacional</option>
            <option value="Vendedor">Vendedor</option>
          </select>
        </div>
      </div>
      {form.admin && (
        <div className="checkbox-group">
          <div className="form-row">
            <label className="checkbox-label"><input type="checkbox" checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} /> Ativo</label>
            <label className="checkbox-label"><input type="checkbox" checked={form.admin} onChange={e => setForm({ ...form, admin: e.target.checked })} /> Administrador</label>
          </div>
        </div>
      )}

      {erro && <div className="login-error" style={{ marginTop: 12 }}>{erro}</div>}
    </div>
  )
}

function SenhaSection({ usuarioLogado }) {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [alterando, setAlterando] = useState(false)
  const [msg, setMsg] = useState('')

  async function alterarSenha() {
    setMsg('')
    if (!senhaAtual || !novaSenha) { setMsg('Preencha todos os campos.'); return }
    if (novaSenha.length < 6) { setMsg('A nova senha deve ter no mínimo 6 caracteres.'); return }
    if (novaSenha !== confirmarSenha) { setMsg('A nova senha e a confirmação não conferem.'); return }
    setAlterando(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: usuarioLogado?.email || '',
        password: senhaAtual,
      })
      if (signInError) { setMsg('Senha atual incorreta.'); return }

      const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha })
      if (updateError) throw updateError

      setMsg('ok')
      setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('')
    } catch (err) {
      setMsg(err.message)
    } finally {
      setAlterando(false)
    }
  }

  return (
    <div className="tab-section">
      <div className="tab-header"><h2>Alterar Senha</h2></div>
      <div className="card-body" style={{ padding: 24 }}>
        <div className="form-group"><label>Senha atual</label><input type="password" className="config-input" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} placeholder="Digite sua senha atual" /></div>
        <div className="form-group"><label>Nova senha</label><input type="password" className="config-input" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Digite a nova senha (mín. 6 caracteres)" /></div>
        <div className="form-group"><label>Confirmar nova senha</label><input type="password" className="config-input" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="Confirme a nova senha" /></div>
        <button className="btn-primary" style={{ marginTop: 10 }} onClick={alterarSenha} disabled={alterando}>{alterando ? 'Alterando...' : 'Alterar Senha'}</button>
        {msg === 'ok' ? <p style={{ color: '#2e7d32', marginTop: 10, fontSize: 13 }}>Senha alterada com sucesso!</p> : msg ? <div className="login-error" style={{ marginTop: 10 }}>{msg}</div> : null}
      </div>
    </div>
  )
}

export default function Perfil() {
  const [tabAtiva, setTabAtiva] = useState('info')
  const [usuarios, setUsuarios] = useState([])
  const [logs, setLogs] = useState([])
  const [permissoes, setPermissoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [usuarioNome, setUsuarioNome] = useState('')
  const [usuarioAdmin, setUsuarioAdmin] = useState(false)
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false)
  const [editandoUsuario, setEditandoUsuario] = useState(null)
  const [formUsuario, setFormUsuario] = useState({ ...FORM_INICIAL })
  const [erroModal, setErroModal] = useState('')
  const [documentos, setDocumentos] = useState([])
  const [docUsuarioId, setDocUsuarioId] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (tabAtiva === 'documentos') {
      if (usuarioAdmin && docUsuarioId) {
        carregarDocumentos(docUsuarioId)
      } else if (!usuarioAdmin && usuarioLogado) {
        carregarDocumentos(usuarioLogado.id)
      }
    } else {
      setDocumentos([])
    }
  }, [tabAtiva, docUsuarioId, usuarioAdmin])

  useEffect(() => {
    async function init() {
      const nome = localStorage.getItem('usuario_nome_crmwa') || 'Administrador'
      setUsuarioNome(nome)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: usuario } = await supabase
          .from('usuario')
          .select('*')
          .eq('auth_user_id', user.id)
          .single()
        if (usuario) {
          setUsuarioAdmin(usuario.admin || false)
          setUsuarioLogado(usuario)
          if (usuario.admin) setTabAtiva('usuarios')
        }
      }

      await carregarDados()
    }
    init()
  }, [])

  async function carregarDados() {
    setLoading(true)
    try {
      const [usuariosRes, logsRes, permissoesRes] = await Promise.all([
        supabase.from('usuario').select('*').order('nome'),
        supabase.from('usuario_log').select('*, usuario:usuario_id(nome)').order('criado_em', { ascending: false }).limit(100),
        supabase.from('usuario_permissao').select('*, usuario:usuario_id(nome)').order('usuario_id'),
      ])
      if (usuariosRes.error) throw usuariosRes.error
      setUsuarios(usuariosRes.data || [])
      if (logsRes.error) throw logsRes.error
      setLogs(logsRes.data || [])
      if (permissoesRes.error) throw permissoesRes.error
      setPermissoes(permissoesRes.data || [])
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err)
    } finally {
      setLoading(false)
    }
  }

  async function salvarUsuario() {
    setErroModal('')
    if (!formUsuario.nome || !formUsuario.email) return
    try {
      const payload = {
        nome: formUsuario.nome,
        email: formUsuario.email,
        login: formUsuario.email.split('@')[0],
        perfil: formUsuario.perfil,
        ativo: formUsuario.ativo,
        admin: formUsuario.admin,
        cpf: formUsuario.cpf,
        rg: formUsuario.rg,
        data_nascimento: formUsuario.data_nascimento || null,
        telefone: formUsuario.telefone,
        telefone2: formUsuario.telefone2,
        cep: formUsuario.cep,
        logradouro: formUsuario.logradouro,
        numero: formUsuario.numero,
        complemento: formUsuario.complemento,
        bairro: formUsuario.bairro,
        cidade: formUsuario.cidade,
        estado: formUsuario.estado,
        contato_emergencia_nome: formUsuario.contato_emergencia_nome,
        contato_emergencia_telefone: formUsuario.contato_emergencia_telefone,
        contato_emergencia_parentesco: formUsuario.contato_emergencia_parentesco,
        banco: formUsuario.banco,
        agencia: formUsuario.agencia,
        conta: formUsuario.conta,
        tipo_conta: formUsuario.tipo_conta,
        cargo: formUsuario.cargo,
        posicao: formUsuario.posicao,
        salario: formUsuario.salario || null,
        vale_transporte: formUsuario.vale_transporte || null,
        email_corporativo: formUsuario.email_corporativo,
      }

      if (editandoUsuario) {
        const { error } = await supabase
          .from('usuario')
          .update(payload)
          .eq('id', editandoUsuario.id)
        if (error) throw error
        await registrarLog('editou_usuario', `Editou usuário: ${formUsuario.nome}`)
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formUsuario.email,
          password: formUsuario.senha || '123456',
          options: { data: { nome: formUsuario.nome } },
        })
        if (authError) {
          if (authError.message.includes('Database error on new user')) {
            throw new Error('Erro no banco: verifique se a migration foi executada corretamente.')
          }
          throw new Error(authError.message)
        }
        if (!authData.user) throw new Error('Erro ao criar usuário de autenticação.')
        if (authData.user.identities?.length === 0) {
          throw new Error('Usuário já existe com este e-mail ou a confirmação de e-mail está pendente.')
        }
        await new Promise(r => setTimeout(r, 1500))

        const { data: usuario } = await supabase
          .from('usuario')
          .select('id')
          .eq('auth_user_id', authData.user.id)
          .single()

        if (usuario) {
          await supabase.from('usuario').update(payload).eq('id', usuario.id)
        } else {
          await supabase.from('usuario').insert([{ auth_user_id: authData.user.id, ...payload }])
        }
        await registrarLog('criou_usuario', `Criou usuário: ${formUsuario.nome} (${formUsuario.email})`)
      }
      setModalUsuarioAberto(false)
      setEditandoUsuario(null)
      setFormUsuario({ ...FORM_INICIAL })
      await carregarDados()
    } catch (err) {
      setErroModal(err.message)
    }
  }

  async function toggleAtivo(usuario) {
    try {
      await supabase.from('usuario').update({ ativo: !usuario.ativo }).eq('id', usuario.id)
      await registrarLog(usuario.ativo ? 'desativou_usuario' : 'ativou_usuario', `${usuario.ativo ? 'Desativou' : 'Ativou'} usuário: ${usuario.nome}`)
      await carregarDados()
    } catch (err) {
      console.error('Erro ao toggle ativo:', err)
    }
  }

  async function registrarLog(acao, descricao) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: usuario } = await supabase
        .from('usuario')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      if (usuario) {
        await supabase.from('usuario_log').insert([{ usuario_id: usuario.id, acao, descricao }])
      }
    } catch {}
  }

  async function salvarPermissao(usuarioId, recurso, permissao) {
    try {
      const existente = permissoes.find(p => p.usuario_id === usuarioId && p.recurso === recurso)
      if (existente) {
        await supabase.from('usuario_permissao').update({ permissao }).eq('id', existente.id)
      } else {
        await supabase.from('usuario_permissao').insert([{ usuario_id: usuarioId, recurso, permissao }])
      }
      await registrarLog('alterou_permissao', `Alterou permissão do usuário ${usuarioId}: ${recurso} = ${permissao}`)
      await carregarDados()
    } catch (err) {
      console.error('Erro ao salvar permissão:', err)
    }
  }

  async function carregarDocumentos(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('usuario_documento')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('criado_em', { ascending: false })
      if (error) throw error
      setDocumentos(data || [])
    } catch (err) {
      console.error('Erro ao carregar documentos:', err)
    }
  }

  async function uploadDocumento(file) {
    if (!file || !docUsuarioId) return
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: usuario } = await supabase.from('usuario').select('id').eq('auth_user_id', user.id).single()
      if (!usuario) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${docUsuarioId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('documentos-usuario').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('documentos-usuario').getPublicUrl(fileName)

      const { error: dbError } = await supabase.from('usuario_documento').insert([{
        usuario_id: docUsuarioId,
        nome: file.name,
        tipo: file.type,
        arquivo_url: publicUrl,
        criado_por: usuario.id,
      }])
      if (dbError) throw dbError

      await registrarLog('adicionou_documento', `Adicionou documento para usuário #${docUsuarioId}: ${file.name}`)
      await carregarDocumentos(docUsuarioId)
    } catch (err) {
      console.error('Erro ao upload documento:', err)
      alert('Erro ao enviar documento: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  async function excluirDocumento(docId) {
    try {
      const doc = documentos.find(d => d.id === docId)
      if (doc?.arquivo_url) {
        const path = doc.arquivo_url.split('/').pop()
        await supabase.storage.from('documentos-usuario').remove([path])
      }
      await supabase.from('usuario_documento').delete().eq('id', docId)
      await carregarDocumentos(docUsuarioId)
    } catch (err) {
      console.error('Erro ao excluir documento:', err)
    }
  }

  function abrirModalNovo() {
    setEditandoUsuario(null)
    setFormUsuario({ ...FORM_INICIAL })
    setErroModal('')
    setModalUsuarioAberto(true)
  }

  function abrirModalEditar(u) {
    setEditandoUsuario(u)
    setFormUsuario({
      nome: u.nome || '',
      email: u.email || '',
      senha: '',
      perfil: u.perfil || 'Vendedor',
      ativo: u.ativo ?? true,
      admin: u.admin ?? false,
      cpf: u.cpf || '',
      rg: u.rg || '',
      data_nascimento: u.data_nascimento || '',
      telefone: u.telefone || '',
      telefone2: u.telefone2 || '',
      cep: u.cep || '',
      logradouro: u.logradouro || '',
      numero: u.numero || '',
      complemento: u.complemento || '',
      bairro: u.bairro || '',
      cidade: u.cidade || '',
      estado: u.estado || '',
      contato_emergencia_nome: u.contato_emergencia_nome || '',
      contato_emergencia_telefone: u.contato_emergencia_telefone || '',
      contato_emergencia_parentesco: u.contato_emergencia_parentesco || '',
      banco: u.banco || '',
      agencia: u.agencia || '',
      conta: u.conta || '',
      tipo_conta: u.tipo_conta || '',
      cargo: u.cargo || '',
      posicao: u.posicao || '',
      salario: u.salario || '',
      vale_transporte: u.vale_transporte || '',
      email_corporativo: u.email_corporativo || '',
    })
    setErroModal('')
    setModalUsuarioAberto(true)
  }

  const getPermissao = (usuarioId, recurso) => {
    const p = permissoes.find(p => p.usuario_id === usuarioId && p.recurso === recurso)
    return p ? p.permissao : 'nenhum'
  }

  const iniciais = (usuarioLogado?.nome || usuarioNome).split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-avatar">{iniciais || 'A'}</div>
          <div>
            <h1>{usuarioLogado?.nome || usuarioNome}</h1>
            <span className="admin-badge">{usuarioAdmin ? 'Administrador' : (usuarioLogado?.perfil || 'Operador')}</span>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        {(usuarioAdmin ? ADMIN_TABS : USER_TABS).map(tab => (
          <button key={tab.id} className={`admin-tab ${tabAtiva === tab.id ? 'active' : ''}`} onClick={() => setTabAtiva(tab.id)}>
            <tab.icon size={18} className="tab-icon" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="admin-loading">Carregando...</div>
        ) : (
          <>
            {usuarioAdmin && tabAtiva === 'usuarios' && (
              <div className="tab-section">
                <div className="tab-header">
                  <h2>Gerenciar Usuários</h2>
                  <button className="btn-primary" onClick={abrirModalNovo}>+ Novo Usuário</button>
                </div>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Perfil</th>
                        <th>E-mail</th>
                        <th>Telefone</th>
                        <th>Admin</th>
                        <th>Ativo</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.length === 0 ? (
                        <tr><td colSpan={7} className="empty-row">Nenhum usuário encontrado.</td></tr>
                      ) : (
                        usuarios.map(u => (
                          <tr key={u.id}>
                            <td>{u.nome}</td>
                            <td><span className="perfil-badge">{u.perfil || '-'}</span></td>
                            <td>{u.email || '-'}</td>
                            <td>{u.telefone || '-'}</td>
                            <td>{u.admin ? 'Sim' : 'Não'}</td>
                            <td>
                              <span className={`status-badge ${u.ativo ? 'ativo' : 'inativo'}`}>
                                {u.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td>
                              <div className="action-btns">
                                <button className="btn-icon" title="Editar" onClick={() => abrirModalEditar(u)}>✏️</button>
                                <button className="btn-icon" title={u.ativo ? 'Desativar' : 'Ativar'} onClick={() => toggleAtivo(u)}>
                                  {u.ativo ? '🚫' : '✅'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {usuarioAdmin && tabAtiva === 'logs' && (
              <div className="tab-section">
                <div className="tab-header"><h2>Atividades Recentes</h2></div>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead><tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Descrição</th></tr></thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr><td colSpan={4} className="empty-row">Nenhuma atividade registrada.</td></tr>
                      ) : (
                        logs.map(log => (
                          <tr key={log.id}>
                            <td className="cell-date">{new Date(log.criado_em).toLocaleString('pt-BR')}</td>
                            <td>{log.usuario?.nome || `#${log.usuario_id}`}</td>
                            <td><span className="log-acao">{log.acao}</span></td>
                            <td>{log.descricao || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {usuarioAdmin && tabAtiva === 'permissoes' && (
              <div className="tab-section">
                <div className="tab-header"><h2>Permissões por Usuário</h2></div>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead><tr><th>Usuário</th>{RECURSOS.map(r => <th key={r.id}>{r.nome}</th>)}</tr></thead>
                    <tbody>
                      {usuarios.length === 0 ? (
                        <tr><td colSpan={RECURSOS.length + 1} className="empty-row">Nenhum usuário cadastrado.</td></tr>
                      ) : (
                        usuarios.map(u => (
                          <tr key={u.id}>
                            <td>{u.nome}</td>
                            {RECURSOS.map(r => (
                              <td key={r.id}>
                                <select value={getPermissao(u.id, r.id)} onChange={(e) => salvarPermissao(u.id, r.id, e.target.value)} className="perm-select">
                                  <option value="nenhum">Nenhum</option>
                                  <option value="visualizar">Visualizar</option>
                                  <option value="gerenciar">Gerenciar</option>
                                </select>
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {usuarioAdmin && tabAtiva === 'config' && (
              <div className="tab-section">
                <div className="tab-header"><h2>Configurações do Sistema</h2></div>
                <div className="config-grid">
                  <div className="config-card">
                    <h3>Sistema</h3>
                    <div className="config-item"><label>Nome da empresa</label><input type="text" defaultValue="CRM WA" className="config-input" readOnly /></div>
                    <div className="config-item"><label>Versão</label><input type="text" defaultValue="1.0.0" className="config-input" readOnly /></div>
                  </div>
                  <div className="config-card">
                    <h3>Notificações</h3>
                    <div className="config-item"><label>Notificações por e-mail</label><select className="config-input" defaultValue="sim"><option value="sim">Ativado</option><option value="nao">Desativado</option></select></div>
                    <div className="config-item"><label>Alertas de proposta</label><select className="config-input" defaultValue="sim"><option value="sim">Ativado</option><option value="nao">Desativado</option></select></div>
                  </div>
                  <div className="config-card">
                    <h3>Segurança</h3>
                    <div className="config-item"><label>Exigir senha forte</label><select className="config-input" defaultValue="nao"><option value="sim">Sim</option><option value="nao">Não</option></select></div>
                    <div className="config-item"><label>Sessão expirar em</label><select className="config-input" defaultValue="24h"><option value="1h">1 hora</option><option value="8h">8 horas</option><option value="24h">24 horas</option></select></div>
                  </div>
                </div>
              </div>
            )}

            {usuarioAdmin && tabAtiva === 'documentos' && (
              <div className="tab-section">
                <div className="tab-header">
                  <h2>Documentos por Usuário</h2>
                </div>
                <div style={{ padding: 20 }}>
                  <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: 20 }}>
                    <div className="form-group">
                      <label>Selecionar Usuário</label>
                      <select
                        value={docUsuarioId}
                        onChange={e => { setDocUsuarioId(e.target.value); if (e.target.value) carregarDocumentos(e.target.value) }}
                        className="config-input"
                        style={{ minWidth: 280 }}
                      >
                        <option value="">Selecione um usuário</option>
                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.perfil || 'sem perfil'})</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>&nbsp;</label>
                      <label style={{ display: 'inline-block', cursor: 'pointer' }}>
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          disabled={!docUsuarioId || uploading}
                          onChange={e => { if (e.target.files?.[0]) uploadDocumento(e.target.files[0]); e.target.value = '' }}
                        />
                        <span className="btn-primary" style={{ fontSize: 11, padding: '8px 14px', opacity: !docUsuarioId ? 0.5 : 1 }}>
                          {uploading ? 'Enviando...' : '+ Adicionar Documento'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {!docUsuarioId ? (
                    <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Selecione um usuário para ver os documentos.</p>
                  ) : documentos.length === 0 ? (
                    <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Nenhum documento encontrado para este usuário.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Nome do Arquivo</th>
                            <th>Tipo</th>
                            <th>Data de Envio</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documentos.map(doc => (
                            <tr key={doc.id}>
                              <td>
                                <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3f3b6c', fontWeight: 600, textDecoration: 'none' }}>
                                  {doc.nome}
                                </a>
                              </td>
                              <td style={{ fontSize: 12 }}>{doc.tipo || '-'}</td>
                              <td className="cell-date">{new Date(doc.criado_em).toLocaleString('pt-BR')}</td>
                              <td>
                                <button className="btn-icon" title="Excluir" onClick={() => excluirDocumento(doc.id)}>🗑️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!usuarioAdmin && tabAtiva === 'info' && (
              <div className="tab-section">
                <div className="tab-header">
                  <h2>Informações Pessoais</h2>
                </div>
                <div className="profile-sections">
                  <div className="profile-section">
                    <h3>Dados Pessoais</h3>
                    <div className="info-grid">
                      <div className="info-item"><label>Nome</label><span>{usuarioLogado?.nome || '-'}</span></div>
                      <div className="info-item"><label>E-mail</label><span>{usuarioLogado?.email || '-'}</span></div>
                      <div className="info-item"><label>CPF</label><span>{usuarioLogado?.cpf || '-'}</span></div>
                      <div className="info-item"><label>RG</label><span>{usuarioLogado?.rg || '-'}</span></div>
                      <div className="info-item"><label>Data Nascimento</label><span>{usuarioLogado?.data_nascimento || '-'}</span></div>
                      <div className="info-item"><label>Telefone</label><span>{usuarioLogado?.telefone || '-'}</span></div>
                      <div className="info-item"><label>Telefone 2</label><span>{usuarioLogado?.telefone2 || '-'}</span></div>
                    </div>
                  </div>
                  <div className="profile-section">
                    <h3>Endereço</h3>
                    <div className="info-grid">
                      <div className="info-item"><label>CEP</label><span>{usuarioLogado?.cep || '-'}</span></div>
                      <div className="info-item"><label>Logradouro</label><span>{usuarioLogado?.logradouro || '-'}</span></div>
                      <div className="info-item"><label>Número</label><span>{usuarioLogado?.numero || '-'}</span></div>
                      <div className="info-item"><label>Complemento</label><span>{usuarioLogado?.complemento || '-'}</span></div>
                      <div className="info-item"><label>Bairro</label><span>{usuarioLogado?.bairro || '-'}</span></div>
                      <div className="info-item"><label>Cidade / UF</label><span>{(usuarioLogado?.cidade || '') + (usuarioLogado?.estado ? ' / ' + usuarioLogado?.estado : '') || '-'}</span></div>
                    </div>
                  </div>
                  <div className="profile-section">
                    <h3>Contato de Emergência</h3>
                    <div className="info-grid">
                      <div className="info-item"><label>Nome</label><span>{usuarioLogado?.contato_emergencia_nome || '-'}</span></div>
                      <div className="info-item"><label>Telefone</label><span>{usuarioLogado?.contato_emergencia_telefone || '-'}</span></div>
                      <div className="info-item"><label>Parentesco</label><span>{usuarioLogado?.contato_emergencia_parentesco || '-'}</span></div>
                    </div>
                  </div>
                  <div className="profile-section">
                    <h3>Dados Financeiros</h3>
                    <div className="info-grid">
                      <div className="info-item"><label>Banco</label><span>{usuarioLogado?.banco || '-'}</span></div>
                      <div className="info-item"><label>Agência</label><span>{usuarioLogado?.agencia || '-'}</span></div>
                      <div className="info-item"><label>Conta</label><span>{usuarioLogado?.conta || '-'}</span></div>
                      <div className="info-item"><label>Tipo</label><span>{usuarioLogado?.tipo_conta || '-'}</span></div>
                    </div>
                  </div>
                  <div className="profile-section">
                    <h3>Dados de Trabalho</h3>
                    <div className="info-grid">
                      <div className="info-item"><label>Cargo</label><span>{usuarioLogado?.cargo || '-'}</span></div>
                      <div className="info-item"><label>Posição</label><span>{usuarioLogado?.posicao || '-'}</span></div>
                      <div className="info-item"><label>Salário</label><span>{usuarioLogado?.salario ? `R$ ${parseFloat(usuarioLogado.salario).toFixed(2)}` : '-'}</span></div>
                      <div className="info-item"><label>Vale-Transporte</label><span>{usuarioLogado?.vale_transporte ? `R$ ${parseFloat(usuarioLogado.vale_transporte).toFixed(2)}` : '-'}</span></div>
                      <div className="info-item"><label>E-mail Corporativo</label><span>{usuarioLogado?.email_corporativo || '-'}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!usuarioAdmin && tabAtiva === 'documentos' && (
              <div className="tab-section">
                <div className="tab-header">
                  <h2>Meus Documentos</h2>
                </div>
                <div style={{ padding: 20 }}>
                  {!usuarioLogado ? (
                    <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Carregando...</p>
                  ) : documentos.length === 0 ? (
                    <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>Nenhum documento disponível.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Nome do Arquivo</th>
                            <th>Tipo</th>
                            <th>Data de Envio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documentos.map(doc => (
                            <tr key={doc.id}>
                              <td>
                                <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3f3b6c', fontWeight: 600, textDecoration: 'none' }}>
                                  {doc.nome}
                                </a>
                              </td>
                              <td style={{ fontSize: 12 }}>{doc.tipo || '-'}</td>
                              <td className="cell-date">{new Date(doc.criado_em).toLocaleString('pt-BR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!usuarioAdmin && tabAtiva === 'metas' && (
              <div className="tab-section">
                <div className="tab-header"><h2>Metas</h2></div>
                <div className="card-body" style={{ padding: 24, color: '#999', fontStyle: 'italic', textAlign: 'center' }}>Nenhuma meta definida.</div>
              </div>
            )}

            {!usuarioAdmin && tabAtiva === 'horarios' && (
              <div className="tab-section">
                <div className="tab-header"><h2>Horários</h2></div>
                <div className="card-body" style={{ padding: 24, color: '#999', fontStyle: 'italic', textAlign: 'center' }}>Nenhum horário registrado.</div>
              </div>
            )}

            {!usuarioAdmin && tabAtiva === 'senhas' && <SenhaSection usuarioLogado={usuarioLogado} />}
          </>
        )}
      </div>

      {modalUsuarioAberto && (
        <div className="modal-overlay" onClick={() => setModalUsuarioAberto(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">{editandoUsuario ? 'Editar Usuário' : 'Novo Usuário'}</div>
            <div className="modal-body" style={{ padding: 20 }}>
              <ModalFormUsuario
                editando={editandoUsuario}
                form={formUsuario}
                setForm={setFormUsuario}
                erro={erroModal}
              />
            </div>
            <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-cancel" onClick={() => { setModalUsuarioAberto(false); setErroModal('') }}>Cancelar</button>
              <button className="btn-primary" onClick={salvarUsuario}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
