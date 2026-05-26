import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import './Login.css'

export default function Login({ setPaginaAtual }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) throw error
      if (data.user) {
        const { data: usuario } = await supabase
          .from('usuario')
          .select('*')
          .eq('auth_user_id', data.user.id)
          .single()
        if (usuario) {
          localStorage.setItem('usuario_id_crmwa', usuario.id)
          localStorage.setItem('usuario_nome_crmwa', usuario.nome || usuario.login || email)
          localStorage.setItem('usuario_admin_crmwa', usuario.admin ? 'true' : 'false')
          localStorage.setItem('usuario_perfil_crmwa', usuario.perfil || '')
        }
        setPaginaAtual('inicio')
      }
    } catch (err) {
      setErro(err.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-bg">
        <div className="bg-circle circle-1" />
        <div className="bg-circle circle-2" />
        <div className="bg-circle circle-3" />
        <div className="bg-grid" />
      </div>

      <div className="login-container">
        <div className="login-brand">
          <div className="brand-icon">
            <img src="/logo_transparente.png" alt="WA Promotora" className="brand-logo" />
          </div>
          <span className="brand-name">WA Promotora</span>
        </div>

        <div className="login-card">
          <div className="card-header">
            <h1>Bem-vindo de volta</h1>
            <p>Entre na sua conta para continuar.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="field-group">
              <label htmlFor="email">E-mail</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <div className="label-row">
                <label htmlFor="senha">Senha</label>
              </div>
              <div className="input-wrapper">
                <input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {erro && <div className="login-error">{erro}</div>}

            <button type="submit" className="btn-entrar" disabled={loading}>
              <span>{loading ? 'ENTRANDO...' : 'ENTRAR'}</span>
              <ArrowRight size={16} className="btn-arrow" />
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
