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
      .select('id, nome, historico')

    if (!statuses) return

    const idsPorHistorico = (historico) =>
      statuses.filter(s => s.historico === historico).map(s => s.id)

    const andIds = idsPorHistorico('AND')
    const penIds = idsPorHistorico('PEN')

    const findId = (termo) => {
      const s = statuses.find(st => st.nome.toLowerCase().includes(termo))
      return s?.id
    }

    const pagosId = findId('integrado')
    const reprovadosId = findId('reprovado')

    const contarIds = async (ids) => {
      if (!ids || ids.length === 0) return { count: 0, valor: 0 }
      const { data } = await supabase
        .from('proposta')
        .select('valor_liberado')
        .in('proposta_status_id', ids)
      if (!data) return { count: 0, valor: 0 }
      return {
        count: data.length,
        valor: data.reduce((s, p) => s + (Number(p.valor_liberado) || 0), 0),
      }
    }

    const [emAnalise, pagos, pendentes, reprovados] = await Promise.all([
      contarIds(andIds),
      contarIds([pagosId].filter(Boolean)),
      contarIds(penIds),
      contarIds([reprovadosId].filter(Boolean)),
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
                <span className="card-value">{cards?.emAnalise?.count ?? '-'}</span>
                <div className="card-sub">R$ {(cards?.emAnalise?.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="card-item card-pagos">
                <span className="card-label">Pagos</span>
                <span className="card-value">{cards?.pagos?.count ?? '-'}</span>
                <div className="card-sub">R$ {(cards?.pagos?.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="card-item card-pendentes">
                <span className="card-label">Pendentes</span>
                <span className="card-value">{cards?.pendentes?.count ?? '-'}</span>
                <div className="card-sub">R$ {(cards?.pendentes?.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="card-item card-reprovados">
                <span className="card-label">Reprovados</span>
                <span className="card-value">{cards?.reprovados?.count ?? '-'}</span>
                <div className="card-sub">R$ {(cards?.reprovados?.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
