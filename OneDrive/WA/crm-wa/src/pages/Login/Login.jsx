import React, { useState } from 'react'
import './Login.css'

export default function Login({ setPaginaAtual }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    // Aceita qualquer login por enquanto para fins de demonstração
    setPaginaAtual('inicio')
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>
      
      <div className="login-card">
        <div className="login-header">
          <h1>CRM WA</h1>
          <p>Sistema de Gestão</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="usuario">Usuário</label>
            <input
              type="text"
              id="usuario"
              placeholder="Digite seu usuário"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          
          <button type="submit" className="btn-login">
            ENTRAR
          </button>
        </form>
      </div>
    </div>
  )
}
