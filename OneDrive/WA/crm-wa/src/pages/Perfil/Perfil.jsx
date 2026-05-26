import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, ClipboardList, Shield, Settings, User, Target, Clock, Key } from 'lucide-react'
import './Perfil.css'
import HorariosList from './HorariosList'
import ModalFormUsuario from './ModalFormUsuario'
import ModalImportarPonto from './ModalImportarPonto'

const RECURSOS = [
  { id: 'inicio', nome: 'Início' },
  { id: 'contratos', nome: 'Contratos' },
  { id: 'simulacoes', nome: 'Simulações' },
  { id: 'esteira-simulacoes', nome: 'Esteira - Simulações' },
  { id: 'propostas', nome: 'Esteira - Propostas' },
  { id: 'pagas-canceladas', nome: 'Esteira - Pagas/Canceladas' },
  { id: 'financeiro', nome: 'Financeiro' },
  { id: 'base-conhecimento', nome: 'Base de Conhecimento' },
  { id: 'configuracoes', nome: 'Configurações' },
  { id: 'perfil', nome: 'Perfil' },
  { id: 'usuarios', nome: 'Usuários' },
  { id: 'relatorios', nome: 'Relatórios' },
]

const PERFIS = ['Vendedor', 'Operacional', 'RH', 'Marketing', 'Administrador']

const ADMIN_TABS = [
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'logs', label: 'Atividades', icon: ClipboardList },
  { id: 'horarios', label: 'Horários', icon: Clock },
  { id: 'permissoes', label: 'Permissões', icon: Shield },
  { id: 'config', label: 'Configurações', icon: Settings },
]

const USER_TABS = [
  { id: 'info', label: 'Informações Pessoais', icon: User },
  { id: 'metas', label: 'Metas', icon: Target },
  { id: 'horarios', label: 'Horários', icon: Clock },
  { id: 'senhas', label: 'Senhas', icon: Key },
]

export default function Perfil() {
  const [tabAtiva, setTabAtiva] = useState('info')
  const [usuarios, setUsuarios] = useState([])
  const [logs, setLogs] = useState([])
  const [permissoes, setPermissoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [usuarioNome, setUsuarioNome] = useState('')
  const [usuarioAdmin, setUsuarioAdmin] = useState(false)
  const [usuarioId, setUsuarioId] = useState(null)
  const [perfilPermissoes, setPerfilPermissoes] = useState([])
  const [perfilSelecionado, setPerfilSelecionado] = useState(null)

  const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false)
  const [editandoUsuario, setEditandoUsuario] = useState(null)
  const [formUsuario, setFormUsuario] = useState({
    nome: '', email: '', login: '', senha: '',
    perfil: 'Vendedor', ativo: true, admin: false,
    cpf: '', rg: '', data_nascimento: '', telefone: '', telefone2: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    contato_emergencia_nome: '', contato_emergencia_telefone: '', contato_emergencia_parentesco: '',
    banco: '', agencia: '', conta: '', tipo_conta: '',
    cargo: '', posicao: '', salario: '', vale_transporte: '', email_corporativo: '',
    id_ponto: ''
  })
  const [erroModal, setErroModal] = useState('')
  const [modalImportarPonto, setModalImportarPonto] = useState(false)

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
          setUsuarioId(usuario.id)
          setUsuarioAdmin(usuario.admin || false)
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
      const [usuariosRes, logsRes, permissoesRes, perfilPermsRes] = await Promise.all([
        supabase.from('usuario').select('*').order('nome'),
        supabase.from('usuario_log').select('*, usuario:usuario_id(nome)').order('criado_em', { ascending: false }).limit(100),
        supabase.from('usuario_permissao').select('*, usuario:usuario_id(nome)').order('usuario_id'),
        supabase.from('perfil_permissao').select('*').order('perfil'),
      ])
      if (usuariosRes.error) throw usuariosRes.error
      setUsuarios(usuariosRes.data || [])
      if (logsRes.error) throw logsRes.error
      setLogs(logsRes.data || [])
      if (permissoesRes.error) throw permissoesRes.error
      setPermissoes(permissoesRes.data || [])
      if (perfilPermsRes.error) throw perfilPermsRes.error
      setPerfilPermissoes(perfilPermsRes.data || [])
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
      if (editandoUsuario) {
        const { error } = await supabase
          .from('usuario')
          .update({
            nome: formUsuario.nome,
            email: formUsuario.email,
            login: formUsuario.email.split('@')[0],
            perfil: formUsuario.perfil,
            ativo: formUsuario.ativo,
            admin: formUsuario.admin,
            cpf: formUsuario.cpf, rg: formUsuario.rg, data_nascimento: formUsuario.data_nascimento,
            telefone: formUsuario.telefone, telefone2: formUsuario.telefone2,
            cep: formUsuario.cep, logradouro: formUsuario.logradouro, numero: formUsuario.numero,
            complemento: formUsuario.complemento, bairro: formUsuario.bairro, cidade: formUsuario.cidade, estado: formUsuario.estado,
            contato_emergencia_nome: formUsuario.contato_emergencia_nome,
            contato_emergencia_telefone: formUsuario.contato_emergencia_telefone,
            contato_emergencia_parentesco: formUsuario.contato_emergencia_parentesco,
            banco: formUsuario.banco, agencia: formUsuario.agencia, conta: formUsuario.conta, tipo_conta: formUsuario.tipo_conta,
            cargo: formUsuario.cargo, posicao: formUsuario.posicao,
            salario: formUsuario.salario || null, vale_transporte: formUsuario.vale_transporte || null,
            email_corporativo: formUsuario.email_corporativo,
            id_ponto: formUsuario.id_ponto || null
          })
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
          await supabase
            .from('usuario')
            .update({
              nome: formUsuario.nome,
              email: formUsuario.email,
              perfil: formUsuario.perfil,
              admin: formUsuario.admin,
              ativo: formUsuario.ativo,
              cpf: formUsuario.cpf, rg: formUsuario.rg, data_nascimento: formUsuario.data_nascimento,
              telefone: formUsuario.telefone, telefone2: formUsuario.telefone2,
              cep: formUsuario.cep, logradouro: formUsuario.logradouro, numero: formUsuario.numero,
              complemento: formUsuario.complemento, bairro: formUsuario.bairro, cidade: formUsuario.cidade, estado: formUsuario.estado,
              contato_emergencia_nome: formUsuario.contato_emergencia_nome,
              contato_emergencia_telefone: formUsuario.contato_emergencia_telefone,
              contato_emergencia_parentesco: formUsuario.contato_emergencia_parentesco,
              banco: formUsuario.banco, agencia: formUsuario.agencia, conta: formUsuario.conta, tipo_conta: formUsuario.tipo_conta,
              cargo: formUsuario.cargo, posicao: formUsuario.posicao,
              salario: formUsuario.salario || null, vale_transporte: formUsuario.vale_transporte || null,
              email_corporativo: formUsuario.email_corporativo,
              id_ponto: formUsuario.id_ponto || null
            })
            .eq('id', usuario.id)
        } else {
          await supabase.from('usuario').insert([{
            auth_user_id: authData.user.id,
            nome: formUsuario.nome,
            email: formUsuario.email,
            login: formUsuario.email.split('@')[0],
            perfil: formUsuario.perfil,
            admin: formUsuario.admin,
            ativo: formUsuario.ativo,
            cpf: formUsuario.cpf, rg: formUsuario.rg, data_nascimento: formUsuario.data_nascimento,
            telefone: formUsuario.telefone, telefone2: formUsuario.telefone2,
            cep: formUsuario.cep, logradouro: formUsuario.logradouro, numero: formUsuario.numero,
            complemento: formUsuario.complemento, bairro: formUsuario.bairro, cidade: formUsuario.cidade, estado: formUsuario.estado,
            contato_emergencia_nome: formUsuario.contato_emergencia_nome,
            contato_emergencia_telefone: formUsuario.contato_emergencia_telefone,
            contato_emergencia_parentesco: formUsuario.contato_emergencia_parentesco,
            banco: formUsuario.banco, agencia: formUsuario.agencia, conta: formUsuario.conta, tipo_conta: formUsuario.tipo_conta,
            cargo: formUsuario.cargo, posicao: formUsuario.posicao,
            salario: formUsuario.salario || null, vale_transporte: formUsuario.vale_transporte || null,
            email_corporativo: formUsuario.email_corporativo,
            id_ponto: formUsuario.id_ponto || null
          }])
        }
        await registrarLog('criou_usuario', `Criou usuário: ${formUsuario.nome} (${formUsuario.email})`)
      }
      setModalUsuarioAberto(false)
      setEditandoUsuario(null)
      setFormUsuario({
        nome: '', email: '', login: '', senha: '',
        perfil: 'Vendedor', ativo: true, admin: false,
        cpf: '', rg: '', data_nascimento: '', telefone: '', telefone2: '',
        cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
        contato_emergencia_nome: '', contato_emergencia_telefone: '', contato_emergencia_parentesco: '',
        banco: '', agencia: '', conta: '', tipo_conta: '',
        cargo: '', posicao: '', salario: '', vale_transporte: '', email_corporativo: '',
        id_ponto: ''
      })
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

  async function salvarPermissaoPerfil(perfil, recurso, permissao) {
    try {
      await supabase
        .from('perfil_permissao')
        .upsert({ perfil, recurso, permissao }, { onConflict: 'perfil, recurso' })
      await carregarDados()
    } catch (err) {
      console.error('Erro ao salvar permissão de perfil:', err)
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
    setFormUsuario({
      nome: '', email: '', login: '', senha: '',
      perfil: 'Vendedor', ativo: true, admin: false,
      cpf: '', rg: '', data_nascimento: '', telefone: '', telefone2: '',
      cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
      contato_emergencia_nome: '', contato_emergencia_telefone: '', contato_emergencia_parentesco: '',
      banco: '', agencia: '', conta: '', tipo_conta: '',
      cargo: '', posicao: '', salario: '', vale_transporte: '', email_corporativo: '',
      id_ponto: ''
    })
    setErroModal('')
    setModalUsuarioAberto(true)
  }

  function abrirModalEditar(u) {
    setEditandoUsuario(u)
    setFormUsuario({
      nome: u.nome || '', email: u.email || '', login: u.login || '', senha: '',
      perfil: u.perfil || 'Vendedor', ativo: u.ativo, admin: u.admin,
      cpf: u.cpf || '', rg: u.rg || '', data_nascimento: u.data_nascimento || '', telefone: u.telefone || '', telefone2: u.telefone2 || '',
      cep: u.cep || '', logradouro: u.logradouro || '', numero: u.numero || '', complemento: u.complemento || '', bairro: u.bairro || '', cidade: u.cidade || '', estado: u.estado || '',
      contato_emergencia_nome: u.contato_emergencia_nome || '', contato_emergencia_telefone: u.contato_emergencia_telefone || '', contato_emergencia_parentesco: u.contato_emergencia_parentesco || '',
      banco: u.banco || '', agencia: u.agencia || '', conta: u.conta || '', tipo_conta: u.tipo_conta || '',
      cargo: u.cargo || '', posicao: u.posicao || '', salario: u.salario || '', vale_transporte: u.vale_transporte || '', email_corporativo: u.email_corporativo || '',
      id_ponto: u.id_ponto || ''
    })
    setErroModal('')
    setModalUsuarioAberto(true)
  }

  const getPermissao = (usuarioId, recurso) => {
    const p = permissoes.find(p => p.usuario_id === usuarioId && p.recurso === recurso)
    return p ? p.permissao : 'nenhum'
  }

  const iniciais = usuarioNome.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-avatar">{iniciais || 'A'}</div>
          <div>
            <h1>{usuarioNome}</h1>
            <span className="admin-badge">{usuarioAdmin ? 'Administrador' : 'Operador'}</span>
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
                        <th>Admin</th>
                        <th>Ativo</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.length === 0 ? (
                        <tr><td colSpan={6} className="empty-row">Nenhum usuário encontrado.</td></tr>
                      ) : (
                        usuarios.map(u => (
                          <tr key={u.id}>
                            <td>{u.nome}</td>
                            <td>{u.login}</td>
                            <td>{u.email || '-'}</td>
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
                <div className="tab-header">
                  <h2>Atividades Recentes</h2>
                </div>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Data/Hora</th>
                        <th>Usuário</th>
                        <th>Ação</th>
                        <th>Descrição</th>
                      </tr>
                    </thead>
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
                <div className="tab-header">
                  <h2>Permissões por Perfil</h2>
                </div>
                <div className="perfil-permissoes-list">
                  {PERFIS.map(perfil => (
                    <div key={perfil} className={`perfil-card ${perfilSelecionado === perfil ? 'expanded' : ''}`}>
                      <div className="perfil-card-header" onClick={() => setPerfilSelecionado(perfilSelecionado === perfil ? null : perfil)}>
                        <span className="perfil-nome">{perfil}</span>
                        <span className={`perfil-arrow ${perfilSelecionado === perfil ? 'open' : ''}`}>›</span>
                      </div>
                      {perfilSelecionado === perfil && (
                        <div className="perfil-card-body">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Item do Menu</th>
                                <th style={{ width: 160 }}>Acesso</th>
                              </tr>
                            </thead>
                            <tbody>
                              {RECURSOS.map(r => {
                                const p = perfilPermissoes.find(pp => pp.perfil === perfil && pp.recurso === r.id)
                                const atual = p ? p.permissao : 'nenhum'
                                return (
                                  <tr key={r.id}>
                                    <td>{r.nome}</td>
                                    <td>
                                      <label className="switch-label">
                                        <input
                                          type="checkbox"
                                          checked={atual === 'visualizar'}
                                          onChange={(e) => salvarPermissaoPerfil(perfil, r.id, e.target.checked ? 'visualizar' : 'nenhum')}
                                        />
                                        <span className="switch-text">{atual === 'visualizar' ? 'Visualizar' : 'Não visualizar'}</span>
                                      </label>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {usuarioAdmin && tabAtiva === 'config' && (
              <div className="tab-section">
                <div className="tab-header">
                  <h2>Configurações do Sistema</h2>
                </div>
                <div className="config-grid">
                  <div className="config-card">
                    <h3>Sistema</h3>
                    <div className="config-item">
                      <label>Nome da empresa</label>
                      <input type="text" defaultValue="CRM WA" className="config-input" readOnly />
                    </div>
                    <div className="config-item">
                      <label>Versão</label>
                      <input type="text" defaultValue="1.0.0" className="config-input" readOnly />
                    </div>
                  </div>
                  <div className="config-card">
                    <h3>Notificações</h3>
                    <div className="config-item">
                      <label>Notificações por e-mail</label>
                      <select className="config-input" defaultValue="sim">
                        <option value="sim">Ativado</option>
                        <option value="nao">Desativado</option>
                      </select>
                    </div>
                    <div className="config-item">
                      <label>Alertas de proposta</label>
                      <select className="config-input" defaultValue="sim">
                        <option value="sim">Ativado</option>
                        <option value="nao">Desativado</option>
                      </select>
                    </div>
                  </div>
                  <div className="config-card">
                    <h3>Segurança</h3>
                    <div className="config-item">
                      <label>Exigir senha forte</label>
                      <select className="config-input" defaultValue="nao">
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    </div>
                    <div className="config-item">
                      <label>Sessão expirar em</label>
                      <select className="config-input" defaultValue="24h">
                        <option value="1h">1 hora</option>
                        <option value="8h">8 horas</option>
                        <option value="24h">24 horas</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!usuarioAdmin && tabAtiva === 'info' && (
              <div className="tab-section">
                <div className="tab-header"><h2>Informações Pessoais</h2></div>
                <div className="profile-sections">
                  <div className="profile-section">
                    <h3>Informações Pessoais</h3>
                    <div className="info-grid">
                      <div className="info-item"><label>Nome</label><span>{usuarioNome}</span></div>
                      <div className="info-item"><label>E-mail</label><span>{formUsuario.email || '-'}</span></div>
                      <div className="info-item"><label>Telefone</label><span>-</span></div>
                      <div className="info-item"><label>Data de Nascimento</label><span>-</span></div>
                      <div className="info-item"><label>CPF</label><span>-</span></div>
                    </div>
                  </div>
                  <div className="profile-section">
                    <h3>Endereço</h3>
                    <div className="info-grid">
                      <div className="info-item"><label>CEP</label><span>-</span></div>
                      <div className="info-item"><label>Logradouro</label><span>-</span></div>
                      <div className="info-item"><label>Número</label><span>-</span></div>
                      <div className="info-item"><label>Bairro</label><span>-</span></div>
                      <div className="info-item"><label>Cidade / UF</label><span>-</span></div>
                    </div>
                  </div>
                  <div className="profile-section">
                    <h3>Contatos de Emergência</h3>
                    <div className="info-grid">
                      <div className="info-item"><label>Nome</label><span>-</span></div>
                      <div className="info-item"><label>Telefone</label><span>-</span></div>
                      <div className="info-item"><label>Parentesco</label><span>-</span></div>
                    </div>
                  </div>
                  <div className="profile-section">
                    <h3>Dados Financeiros</h3>
                    <div className="info-grid">
                      <div className="info-item"><label>Banco</label><span>-</span></div>
                      <div className="info-item"><label>Agência</label><span>-</span></div>
                      <div className="info-item"><label>Conta</label><span>-</span></div>
                      <div className="info-item"><label>Tipo</label><span>-</span></div>
                    </div>
                  </div>
                  <div className="profile-section">
                    <h3>Dados Profissionais</h3>
                    <div className="info-grid">
                      <div className="info-item"><label>Empresa</label><span>-</span></div>
                      <div className="info-item"><label>Cargo</label><span>-</span></div>
                      <div className="info-item"><label>Renda</label><span>-</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!usuarioAdmin && tabAtiva === 'metas' && (
              <div className="tab-section">
                <div className="tab-header"><h2>Metas</h2></div>
                <div className="card-body" style={{ padding: 24, color: '#999', fontStyle: 'italic', textAlign: 'center' }}>
                  Nenhuma meta definida.
                </div>
              </div>
            )}

            {tabAtiva === 'horarios' && (
              <>
                {usuarioAdmin && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button className="btn-primary" onClick={() => setModalImportarPonto(true)}>Importar Ponto</button>
                  </div>
                )}
                <HorariosList
                  usuarioId={usuarioId}
                  isAdmin={usuarioAdmin}
                  usuarios={usuarios}
                />
              </>
            )}

            {!usuarioAdmin && tabAtiva === 'senhas' && <SenhaSection usuarioLogado={usuarioLogado} />}
          </>
        )}
      </div>

      {modalUsuarioAberto && (
        <div className="modal-overlay" onClick={() => setModalUsuarioAberto(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">{editandoUsuario ? 'Editar Usuário' : 'Novo Usuário'}</div>
            <div className="modal-body" style={{ padding: 20, maxHeight: '70vh', overflowY: 'auto' }}>
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

      {modalImportarPonto && (
        <ModalImportarPonto onClose={() => setModalImportarPonto(false)} />
      )}
    </div>
  )
}
