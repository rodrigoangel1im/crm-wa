import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login/Login'
import Inicio from './pages/Inicio/Inicio'
import AdicionarContrato from './pages/AdicionarContrato/AdicionarContrato'
import Simulacoes from './pages/Simulacoes/Simulacoes'
import EsteiraProposta from './pages/EsteiraProposta/EsteiraProposta'
import PagasCanceladas from './pages/PagasCanceladas/PagasCanceladas'
import EsteiraSimulacoes from './pages/EsteiraSimulacoes/EsteiraSimulacoes'
import DetalheSimulacao from './pages/DetalheSimulacao/DetalheSimulacao.jsx'
import DetalheProposta from './pages/DetalheProposta/DetalheProposta.jsx'
import StatusProposta from './pages/DetalheProposta/StatusProposta.jsx'
import CriarCampanha from './pages/Campanhas/CriarCampanha.jsx'
import AcompanhamentoCampanha from './pages/Campanhas/AcompanhamentoCampanha.jsx'
import RelatoriosCampanhas from './pages/Campanhas/RelatoriosCampanhas.jsx'
import Perfil from './pages/Perfil/Perfil.jsx'
import ConfiguracoesSistema from './pages/ConfiguracoesSistema/ConfiguracoesSistema.jsx'
import AnexarDocumento from './pages/AnexarDocumento/AnexarDocumento.jsx'
import Financeiro from './pages/Financeiro/Financeiro.jsx'
import StatusFinanceiro from './pages/Financeiro/StatusFinanceiro/StatusFinanceiro.jsx'
import BaseConhecimento from './pages/BaseConhecimento/BaseConhecimento.jsx'
import Sidebar from './components/Sidebar/Sidebar.jsx'
import LoadingBars from './components/LoadingBars/LoadingBars.jsx'
import ChatBot from './components/ChatBot/ChatBot.jsx'
import './App.css'

export default function App() {
  const [paginaAtual, setPaginaAtualState] = useState('login')
  const [transitioning, setTransitioning] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const perfil = localStorage.getItem('usuario_perfil_crmwa') || ''
  const transTimer = useRef(null)

  const setPaginaAtual = useCallback((pagina) => {
    if (transTimer.current) clearTimeout(transTimer.current)
    setTransitioning(true)
    setPaginaAtualState(pagina)
    transTimer.current = setTimeout(() => setTransitioning(false), 400)
  }, [])

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
    <>
      <div style={{ display: 'flex' }}>
        <Sidebar paginaAtual={paginaAtual} setPaginaAtual={setPaginaAtual} />
        <main style={{ marginLeft: '50px', marginRight: '-20px', padding: '20px', width: '100%' }}>
          {paginaAtual === 'inicio' && <Inicio />}
          {paginaAtual === 'adicionar-contrato' && <AdicionarContrato setPaginaAtual={setPaginaAtual} />}
          {paginaAtual === 'anexar-documento' && <AnexarDocumento setPaginaAtual={setPaginaAtual} />}
          {paginaAtual === 'simulacoes' && <Simulacoes />}
          {paginaAtual === 'esteira-proposta' && <EsteiraProposta setPaginaAtual={setPaginaAtual} />}
          {paginaAtual === 'esteira-pagas-canceladas' && <PagasCanceladas setPaginaAtual={setPaginaAtual} />}
          {paginaAtual === 'esteira-simulacoes' && <EsteiraSimulacoes setPaginaAtual={setPaginaAtual} />}
          {paginaAtual === 'detalhe-simulacao' && <DetalheSimulacao setPaginaAtual={setPaginaAtual} />}
          {paginaAtual === 'detalhe-proposta' && <DetalheProposta setPaginaAtual={setPaginaAtual} />}
          {paginaAtual === 'status-proposta' && (perfil === 'Operacional' || perfil === 'Administrador') && <StatusProposta setPaginaAtual={setPaginaAtual} />}
          {paginaAtual === 'criar-campanha' && <CriarCampanha />}
          {paginaAtual === 'acompanhamento-campanha' && <AcompanhamentoCampanha setPaginaAtual={setPaginaAtual} />}
          {paginaAtual === 'relatorios-campanhas' && <RelatoriosCampanhas />}
          {paginaAtual === 'perfil' && <Perfil />}
          {paginaAtual === 'configuracoes-sistema' && <ConfiguracoesSistema />}
          {paginaAtual === 'financeiro' && <Financeiro setPaginaAtual={setPaginaAtual} />}
          {paginaAtual === 'status-financeiro' && <StatusFinanceiro setPaginaAtual={setPaginaAtual} />}
          {paginaAtual === 'base-conhecimento' && <BaseConhecimento />}
        </main>
      </div>
      <ChatBot />
      {transitioning && <LoadingBars />}
    </>
  )
}
