import React from 'react'
import AvisosTable from '../../components/AvisosTable/AvisosTable'
import './Inicio.css'

export default function Inicio() {
  return (
    <div className="inicio-layout">
      <header className="page-header">
        <h1>Inicio</h1>
      </header>
      <main className="main-content">
        <div className="content-card">
          <AvisosTable />
        </div>
      </main>
    </div>
  )
}
