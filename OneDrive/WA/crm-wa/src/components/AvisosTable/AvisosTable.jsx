import React from 'react'
import './AvisosTable.css'

export default function AvisosTable() {
  return (
    <div className="avisos-section">
      <div className="avisos-title-bar">Avisos</div>
      <table className="avisos-table">
        <thead>
          <tr>
            <th style ={{ width: '70%' }}>Aviso</th>
            <th style ={{ width: '15%' }}>Responsavel</th>
            <th style ={{ width: '15%' }}>Data da publicação</th>
          </tr>
        </thead>
        <tbody>
          <tr className="empty-row">
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
