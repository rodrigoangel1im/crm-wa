import React, { useState, useEffect } from 'react'
import Login from './pages/Login/Login'
import Inicio from './pages/Inicio/Inicio'
import AdicionarContrato from './pages/AdicionarContrato/AdicionarContrato'
import Simulacoes from './pages/Simulacoes/Simulacoes'
import EsteiraProposta from './pages/EsteiraProposta/EsteiraProposta'
import EsteiraSimulacoes from './pages/EsteiraSimulacoes/EsteiraSimulacoes'
import DetalheProposta from './pages/DetalheProposta/DetalheProposta'
import StatusProposta from './pages/DetalheProposta/StatusProposta'
import Perfil from './pages/Perfil/Perfil'
import AnexarDocumento from './pages/AnexarDocumento/AnexarDocumento'
import Sidebar from './components/Sidebar/Sidebar'
import './App.css'

export default function App() {
  const [paginaAtual, setPaginaAtual] = useState(() => {
    const saved = localStorage.getItem('paginaAtual_crmwa')
    return saved || 'inicio'
  })

  useEffect(() => {
    localStorage.setItem('paginaAtual_crmwa', paginaAtual)
  }, [paginaAtual])

  if (paginaAtual === 'login') {
    return <Login setPaginaAtual={setPaginaAtual} />
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar paginaAtual={paginaAtual} setPaginaAtual={setPaginaAtual} />
      <main style={{ marginLeft: '70px', padding: '20px', width: '100%' }}>
        {paginaAtual === 'inicio' && <Inicio />}
        {paginaAtual === 'adicionar-contrato' && <AdicionarContrato setPaginaAtual={setPaginaAtual} />}
        {paginaAtual === 'anexar-documento' && <AnexarDocumento setPaginaAtual={setPaginaAtual} />}
        {paginaAtual === 'simulacoes' && <Simulacoes />}
        {paginaAtual === 'esteira-proposta' && <EsteiraProposta setPaginaAtual={setPaginaAtual} />}
        {paginaAtual === 'esteira-simulacoes' && <EsteiraSimulacoes />}
        {paginaAtual === 'detalhe-proposta' && <DetalheProposta setPaginaAtual={setPaginaAtual} />}
        {paginaAtual === 'status-proposta' && <StatusProposta setPaginaAtual={setPaginaAtual} />}
        {paginaAtual === 'perfil' && <Perfil />}
      </main>
    </div>
  )
}

