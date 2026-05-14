import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Home, FileText, Calculator, ClipboardList, User, LogOut, Settings } from 'lucide-react'
import './Sidebar.css'

export default function Sidebar({ paginaAtual, setPaginaAtual, collapsed, onToggleCollapse }) {
  const [hovered, setHovered] = useState(false)
  const [esteiraOpen, setEsteiraOpen] = useState(false)
  const perfil = localStorage.getItem('usuario_perfil_crmwa') || ''
  const isVendedor = perfil === 'Vendedor'
  const isAdmin = localStorage.getItem('usuario_admin_crmwa') === 'true'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setPaginaAtual('login')
  }

  const isExpanded = hovered

  return (
    <aside
      className={`sidebar ${!isExpanded ? 'collapsed' : 'expanded'}`}
      style={{ width: isExpanded ? 260 : 70, zIndex: isExpanded ? 1001 : 1000 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="sidebar-header">
        <img src="/circulo_apenas_logo.jpg" alt="Logo" className="sidebar-logo" />
      </div>

      <nav className="sidebar-nav">
        <a
          href="#"
          className={paginaAtual === 'inicio' ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); setPaginaAtual('inicio') }}
        >
          <Home size={20} className="icon" />
          <span className="nav-text">Inicio</span>
        </a>
        <a
          href="#"
          className={paginaAtual === 'adicionar-contrato' ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); setPaginaAtual('adicionar-contrato') }}
        >
          <FileText size={20} className="icon" />
          <span className="nav-text">Contratos</span>
        </a>
        {!isVendedor && (
          <a
            href="#"
            className={paginaAtual === 'simulacoes' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setPaginaAtual('simulacoes') }}
          >
            <Calculator size={20} className="icon" />
            <span className="nav-text">Simulações</span>
          </a>
        )}

        <div className="nav-group">
          <a
            href="#"
            className={`${paginaAtual === 'esteira-proposta' || paginaAtual === 'esteira-pagas-canceladas' || paginaAtual === 'esteira-simulacoes' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              setEsteiraOpen(!esteiraOpen)
            }}
          >
            <ClipboardList size={20} className="icon" />
            <span className="nav-text">Esteira</span>
            <span className={`arrow ${esteiraOpen ? 'open' : ''}`}>›</span>
          </a>
          {isExpanded && esteiraOpen && (
            <div className="submenu">
              <a
                href="#"
                className={paginaAtual === 'esteira-proposta' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setPaginaAtual('esteira-proposta') }}
              >
                <span className="nav-text">Propostas</span>
              </a>
              <a
                href="#"
                className={paginaAtual === 'esteira-pagas-canceladas' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setPaginaAtual('esteira-pagas-canceladas') }}
              >
                <span className="nav-text">Pagas / Canceladas</span>
              </a>
            </div>
          )}
        </div>

        {isAdmin && (
          <a
            href="#"
            className={paginaAtual === 'configuracoes-sistema' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setPaginaAtual('configuracoes-sistema') }}
          >
            <Settings size={20} className="icon" />
            <span className="nav-text">Configurações</span>
          </a>
        )}
      </nav>

      <div className="sidebar-footer">
        <a
          href="#"
          className={`${paginaAtual === 'perfil' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            setPaginaAtual('perfil')
          }}
        >
          <User size={20} className="icon" />
          {isExpanded && <span className="nav-text">Perfil</span>}
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogout() }} className="logout-link">
          <LogOut size={20} className="icon" />
          {isExpanded && <span className="nav-text">Sair</span>}
        </a>
      </div>
    </aside>
  )
}
