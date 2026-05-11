import React, { useState, useRef, useEffect } from 'react'
import './Navbar.css'

export default function Navbar({ paginaAtual, setPaginaAtual }) {
  const [perfilOpen, setPerfilOpen] = useState(false)
  const [esteiraOpen, setEsteiraOpen] = useState(false)
  const esteiraRef = useRef(null)
  const perfilRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (esteiraRef.current && !esteiraRef.current.contains(event.target)) {
        setEsteiraOpen(false)
      }
      if (perfilRef.current && !perfilRef.current.contains(event.target)) {
        setPerfilOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="navbar">
      <div className="nav-container">
        <a
          href="#"
          className={paginaAtual === 'inicio' ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); setPaginaAtual('inicio') }}
        >
          Inicio
        </a>
        <a
          href="#"
          className={paginaAtual === 'adicionar-contrato' ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); setPaginaAtual('adicionar-contrato') }}
        >
          Contratos
        </a>
        <a
          href="#"
          className={paginaAtual === 'simulacoes' ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); setPaginaAtual('simulacoes') }}
        >
          Simulações
        </a>
        <div className="nav-dropdown" ref={esteiraRef}>
          <a
            href="#"
            className={`${paginaAtual === 'esteira-proposta' || paginaAtual === 'esteira-simulacoes' ? 'active' : ''} ${esteiraOpen ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              setEsteiraOpen(!esteiraOpen)
            }}
          >
            Esteira
          </a>
          {esteiraOpen && (
            <div className="dropdown-menu">
              <a href="#" className={paginaAtual === 'esteira-simulacoes' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setPaginaAtual('esteira-simulacoes'); setEsteiraOpen(false) }}>
                Esteira de Simulações
              </a>
              <a href="#" className={paginaAtual === 'esteira-proposta' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setPaginaAtual('esteira-proposta'); setEsteiraOpen(false) }}>
                Esteira de Propostas
              </a>
            </div>
          )}
        </div>
        <div className="nav-dropdown" ref={perfilRef}>
          <a
            href="#"
            className={`perfil-link ${perfilOpen || paginaAtual === 'perfil' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              setPerfilOpen(!perfilOpen)
            }}
          >
            Perfil
          </a>
          {perfilOpen && (
            <div className="dropdown-menu">
              <a href="#" onClick={(e) => { e.preventDefault(); setPaginaAtual('perfil'); setPerfilOpen(false) }}>
                Editar perfil
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); setPaginaAtual('login'); setPerfilOpen(false) }} className="logout-link">
                Sair
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

