import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import './ModalAviso.css'

const PERFIS = ['Vendedor', 'Operacional', 'RH', 'Marketing', 'Administrador']

export default function ModalAviso({ isOpen, onClose, onSalvo }) {
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [tipo, setTipo] = useState('todos')
  const [usuariosAlvo, setUsuariosAlvo] = useState([])
  const [perfisAlvo, setPerfisAlvo] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [imagem, setImagem] = useState(null)
  const [imagemPreview, setImagemPreview] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTitulo('')
      setMensagem('')
      setTipo('todos')
      setUsuariosAlvo([])
      setPerfisAlvo([])
      setImagem(null)
      setImagemPreview(null)
      carregarUsuarios()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => { document.body.style.overflow = 'auto' }
  }, [isOpen])

  function handleImagemChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      setImagem(file)
      setImagemPreview(URL.createObjectURL(file))
    }
  }

  async function carregarUsuarios() {
    const { data } = await supabase
      .from('usuario')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')
    if (data) setUsuarios(data)
  }

  function toggleUsuario(id) {
    setUsuariosAlvo(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function togglePerfil(p) {
    setPerfisAlvo(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  async function handleSalvar() {
    if (!titulo.trim() || !mensagem.trim()) return
    setSalvando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: usuario } = await supabase
        .from('usuario')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      if (!usuario) return

      let imagemUrl = null
      if (imagem) {
        const fileExt = imagem.name.split('.').pop()
        const fileName = `aviso_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('avisos-imagens').upload(fileName, imagem)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('avisos-imagens').getPublicUrl(fileName)
        imagemUrl = publicUrl
      }

      const payload = {
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        responsavel_id: usuario.id,
        tipo,
        usuarios_alvo: tipo === 'selecionados' ? usuariosAlvo : null,
        perfis_alvo: tipo === 'perfil' ? perfisAlvo : null,
        imagem_url: imagemUrl,
      }

      const { error } = await supabase.from('aviso').insert([payload])
      if (error) throw error
      onSalvo()
      onClose()
    } catch (err) {
      console.error('Erro ao salvar aviso:', err)
      alert('Erro ao salvar aviso: ' + err.message)
    } finally {
      setSalvando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2>Adicionar Aviso</h2>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Título</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título do aviso" />
          </div>
          <div className="form-group">
            <label>Mensagem</label>
            <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} placeholder="Escreva o aviso..." rows={4} />
          </div>
          <div className="form-group">
            <label>Imagem (opcional)</label>
            <input type="file" accept="image/*" onChange={handleImagemChange} />
            {imagemPreview && (
              <div className="imagem-preview-container">
                <img src={imagemPreview} alt="Preview" className="imagem-preview" />
                <button type="button" className="btn-remover-imagem" onClick={() => { setImagem(null); setImagemPreview(null) }}>Remover</button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Visibilidade</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="todos">Todos os usuários</option>
              <option value="perfil">Por perfil</option>
              <option value="selecionados">Usuários selecionados</option>
            </select>
          </div>
          {tipo === 'selecionados' && (
            <div className="form-group">
              <label>Selecionar usuários</label>
              <div className="usuarios-list">
                {usuarios.map(u => (
                  <label key={u.id} className="usuario-checkbox">
                    <input
                      type="checkbox"
                      checked={usuariosAlvo.includes(u.id)}
                      onChange={() => toggleUsuario(u.id)}
                    />
                    {u.nome}
                  </label>
                ))}
                {usuarios.length === 0 && <span className="empty-msg">Nenhum usuário ativo encontrado.</span>}
              </div>
            </div>
          )}
          {tipo === 'perfil' && (
            <div className="form-group">
              <label>Selecionar perfis</label>
              <div className="usuarios-list">
                {PERFIS.map(p => (
                  <label key={p} className="usuario-checkbox">
                    <input
                      type="checkbox"
                      checked={perfisAlvo.includes(p)}
                      onChange={() => togglePerfil(p)}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-voltar-modal" onClick={onClose}>CANCELAR</button>
          <button className="btn-salvar" onClick={handleSalvar} disabled={salvando || !titulo.trim() || !mensagem.trim()}>
            {salvando ? 'SALVANDO...' : 'SALVAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
