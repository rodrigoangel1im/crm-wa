import './EsteiraSimulacoes.css'

export default function EsteiraSimulacoes() {
  return (
    <div className="esteira-container">
      <h1 className="titulo-pagina">Esteira de Simulações</h1>

      <div className="main-card">
        <div className="status-badge">Simulações em Andamento</div>

        <div className="empty-state">
          <p>Em desenvolvimento...</p>
        </div>
      </div>
    </div>
  )
}
