import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login/Login'
import Inicio from './pages/Inicio/Inicio'
import AdicionarContrato from './pages/AdicionarContrato/AdicionarContrato'
import Simulacoes from './pages/Simulacoes/Simulacoes'
import EsteiraProposta from './pages/EsteiraProposta/EsteiraProposta'
import PagasCanceladas from './pages/PagasCanceladas/PagasCanceladas'
import EsteiraSimulacoes from './pages/EsteiraSimulacoes/EsteiraSimulacoes'
import DetalheProposta from './pages/DetalheProposta/DetalheProposta'
import StatusProposta from './pages/DetalheProposta/StatusProposta'
import CriarCampanha from './pages/Campanhas/CriarCampanha'
import AcompanhamentoCampanha from './pages/Campanhas/AcompanhamentoCampanha'
import RelatoriosCampanhas from './pages/Campanhas/RelatoriosCampanhas'
import Perfil from './pages/Perfil/Perfil'
import ConfiguracoesSistema from './pages/ConfiguracoesSistema/ConfiguracoesSistema'
import AnexarDocumento from './pages/AnexarDocumento/AnexarDocumento'
import Sidebar from './components/Sidebar/Sidebar'
import './App.css'

export default function App() {
  const [paginaAtual, setPaginaAtual] = useState('login')
  const [authChecked, setAuthChecked] = useState(false)
  const perfil = localStorage.getItem('usuario_perfil_crmwa') || ''

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const saved = localStorage.getItem('paginaAtual_crmwa')
        setPaginaAtual(saved || 'inicio')
      }
      setAuthChecked(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setPaginaAtual('login')
        localStorage.removeItem('paginaAtual_crmwa')
        localStorage.removeItem('usuario_id_crmwa')
        localStorage.removeItem('usuario_nome_crmwa')
        localStorage.removeItem('usuario_admin_crmwa')
        localStorage.removeItem('usuario_perfil_crmwa')
        localStorage.removeItem('propostaSelecionada_crmwa')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (paginaAtual !== 'login') {
      localStorage.setItem('paginaAtual_crmwa', paginaAtual)
    }
  }, [paginaAtual])

  if (!authChecked) return null

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
        {paginaAtual === 'esteira-pagas-canceladas' && <PagasCanceladas setPaginaAtual={setPaginaAtual} />}
        {paginaAtual === 'esteira-simulacoes' && <EsteiraSimulacoes />}
        {paginaAtual === 'detalhe-proposta' && <DetalheProposta setPaginaAtual={setPaginaAtual} />}
        {paginaAtual === 'status-proposta' && (perfil === 'Operacional' || perfil === 'Administrador') && <StatusProposta setPaginaAtual={setPaginaAtual} />}
        {paginaAtual === 'criar-campanha' && <CriarCampanha />}
        {paginaAtual === 'acompanhamento-campanha' && <AcompanhamentoCampanha setPaginaAtual={setPaginaAtual} />}
        {paginaAtual === 'relatorios-campanhas' && <RelatoriosCampanhas />}
        {paginaAtual === 'perfil' && <Perfil />}
        {paginaAtual === 'configuracoes-sistema' && <ConfiguracoesSistema />}
      </main>
    </div>
  )
}
