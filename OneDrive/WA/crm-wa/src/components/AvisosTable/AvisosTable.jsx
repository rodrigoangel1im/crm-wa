import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import ModalAviso from '../ModalAviso/ModalAviso'
import './AvisosTable.css'

export default function AvisosTable() {
  const [avisos, setAvisos] = useState([])
  const [usuarioAdmin, setUsuarioAdmin] = useState(false)
  const [usuarioId, setUsuarioId] = useState(null)
  const [usuarioPerfil, setUsuarioPerfil] = useState('')
  const [modalAberto, setModalAberto] = useState(false)

  useEffect(() => {
    const admin = localStorage.getItem('usuario_admin_crmwa') === 'true'
    setUsuarioAdmin(admin)
    carregarAvisos()
  }, [])

  async function carregarAvisos() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usuario } = await supabase
        .from('usuario')
        .select('id, perfil')
        .eq('auth_user_id', user.id)
        .single()
      if (!usuario) return
      setUsuarioId(usuario.id)
      setUsuarioPerfil(usuario.perfil || '')

      const { data } = await supabase
        .from('aviso')
        .select('*, responsavel:responsavel_id(nome)')
        .order('criado_em', { ascending: false })

      if (data) {
        const filtrados = data.filter(a =>
          a.tipo === 'todos' ||
          (a.tipo === 'selecionados' && a.usuarios_alvo?.includes(usuario.id)) ||
          (a.tipo === 'perfil' && a.perfis_alvo?.includes(usuario.perfil))
        )
        setAvisos(filtrados)
      }
    } catch (err) {
      console.error('Erro ao carregar avisos:', err)
    }
  }

  async function removerAviso(id) {
    if (!confirm('Tem certeza que deseja remover este aviso?')) return
    try {
      const { error } = await supabase.from('aviso').delete().eq('id', id)
      if (error) throw error
      carregarAvisos()
    } catch (err) {
      console.error('Erro ao remover aviso:', err)
      alert('Erro ao remover aviso: ' + err.message)
    }
  }

  return (
    <div className="avisos-section">
      <div className="avisos-title-bar">
        <span>Avisos</span>
        {usuarioAdmin && (
          <button className="btn-adicionar-aviso" onClick={() => setModalAberto(true)}>
            + Adicionar aviso
          </button>
        )}
      </div>
      <table className="avisos-table">
        <thead>
          <tr>
            <th style={{ width: '55%' }}>Aviso</th>
            <th style={{ width: '15%' }}>Responsavel</th>
            <th style={{ width: '15%' }}>Data da publicação</th>
            {usuarioAdmin && <th style={{ width: '15%' }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {avisos.length === 0 ? (
              <tr className="empty-row">
              <td colSpan={usuarioAdmin ? 4 : 3}>Nenhum aviso publicado.</td>
            </tr>
          ) : (
            avisos.map(a => (
              <tr key={a.id}>
                <td>
                  <strong>{a.titulo}</strong>
                  <br />
                  <span className="aviso-mensagem">{a.mensagem}</span>
                  {a.imagem_url && (
                    <div className="aviso-imagem-wrapper">
                      <img src={a.imagem_url} alt={a.titulo} className="aviso-imagem" />
                    </div>
                  )}
                </td>
                <td>{a.responsavel?.nome || '—'}</td>
                <td>{new Date(a.criado_em).toLocaleDateString('pt-BR')}</td>
                {usuarioAdmin && (
                  <td>
                    <button className="btn-remover-aviso" onClick={() => removerAviso(a.id)}>Remover</button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <ModalAviso
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSalvo={carregarAvisos}
      />
    </div>
  )
}
