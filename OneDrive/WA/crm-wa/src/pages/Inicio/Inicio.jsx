import React, { useState, useEffect } from 'react'
import AvisosTable from '../../components/AvisosTable/AvisosTable'
import { supabase } from '../../lib/supabase'
import './Inicio.css'

export default function Inicio() {
  const nomeCompleto = localStorage.getItem('usuario_nome_crmwa') || ''
  const primeiroNome = nomeCompleto.split(' ')[0] || ''
  const [cards, setCards] = useState(null)

  useEffect(() => {
    carregarCards()
  }, [])

  async function carregarCards() {
    const { data: statuses } = await supabase
      .from('proposta_status')
      .select('id, nome')

    if (!statuses) return

    const findId = (termo) => {
      const s = statuses.find(st => st.nome.toLowerCase().includes(termo))
      return s?.id
    }

    const emAnaliseId = findId('análise') || findId('analise')
    const pagosId = findId('integrado')
    const pendentesId = findId('pendente')
    const reprovadosId = findId('reprovado')

    const contar = async (id) => {
      if (!id) return 0
      const { count } = await supabase
        .from('proposta')
        .select('id', { count: 'exact', head: true })
        .eq('proposta_status_id', id)
      return count || 0
    }

    const [emAnalise, pagos, pendentes, reprovados] = await Promise.all([
      contar(emAnaliseId),
      contar(pagosId),
      contar(pendentesId),
      contar(reprovadosId),
    ])

    setCards({ emAnalise, pagos, pendentes, reprovados })
  }

  return (
    <div className="inicio-layout">
      <header className="page-header">
        <h1>Seja bem-vindo, {primeiroNome}!</h1>
      </header>
      <main className="main-content">
        <div className="content-card">
          <div className="cards-section">
            <div className="cards-grid">
              <div className="card-item card-analise">
                <span className="card-label">Em análise</span>
                <span className="card-value">{cards?.emAnalise ?? '-'}</span>
              </div>
              <div className="card-item card-pagos">
                <span className="card-label">Pagos</span>
                <span className="card-value">{cards?.pagos ?? '-'}</span>
              </div>
              <div className="card-item card-pendentes">
                <span className="card-label">Pendentes</span>
                <span className="card-value">{cards?.pendentes ?? '-'}</span>
              </div>
              <div className="card-item card-reprovados">
                <span className="card-label">Reprovados</span>
                <span className="card-value">{cards?.reprovados ?? '-'}</span>
              </div>
              <div className="card-item card-meta">
                <span className="card-label">Meta</span>
                <span className="card-value">R$ 0,00</span>
              </div>
            </div>
          </div>
          <AvisosTable />
        </div>
      </main>
    </div>
  )
}
