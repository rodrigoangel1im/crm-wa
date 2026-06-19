import React, { useState, useEffect, useRef } from 'react'
import { Bell, X, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './NotificationBell.css'

const POLL_INTERVAL = 10000
const LOOKBACK_MINUTES = 5

export default function NotificationBell({ setPaginaAtual }) {
  const [open, setOpen] = useState(false)
  const [notificacoes, setNotificacoes] = useState([])
  const [badgeCount, setBadgeCount] = useState(0)
  const panelRef = useRef(null)

  useEffect(() => {
    carregarNotificacoes()
    const interval = setInterval(carregarNotificacoes, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) && !e.target.closest('.notif-fab')) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function carregarNotificacoes() {
    try {
      const cincoMinAtras = new Date(Date.now() - LOOKBACK_MINUTES * 60 * 1000).toISOString()
      const usuarioNome = localStorage.getItem('usuario_nome_crmwa') || ''

      const isAdmin = localStorage.getItem('usuario_admin_crmwa') === 'true' || localStorage.getItem('usuario_perfil_crmwa') === 'Administrador'
      const usuarioId = parseInt(localStorage.getItem('usuario_id_crmwa') || '0')

      let query = supabase
        .from('proposta_historico')
        .select(`
          id,
          proposta_id,
          dados,
          criado_em,
          proposta!inner (
            id,
            usuario_digitador_id,
            numero_proposta_banco,
            matricula (cliente (nome_completo, cpf))
          )
        `)
        .gte('criado_em', cincoMinAtras)
        .not('dados', 'is', null)

      if (!isAdmin && usuarioId) {
        query = query.eq('proposta.usuario_digitador_id', usuarioId)
      }

      const { data } = await query.order('criado_em', { ascending: false })

      if (!data) return

      const raw = data.filter(item => {
        const d = item.dados
        if (!d || !d.proposta_status_id) return false
        if (d.usuario_nome === usuarioNome) return false
        return true
      })

      const statusIds = [...new Set(raw.map(i => i.dados.proposta_status_id).filter(id => id != null && id !== ''))]
      const statusMap = {}
      if (statusIds.length > 0) {
        const { data: statuses } = await supabase
          .from('proposta_status')
          .select('id, nome, cor')
          .in('id', statusIds)
        console.log('[Notif] statusIds enviados:', JSON.stringify(statusIds))
        console.log('[Notif] statuses retornados:', JSON.stringify(statuses))
        if (statuses) {
          statuses.forEach(s => {
            statusMap[String(s.id)] = { nome: s.nome, cor: s.cor }
            statusMap[s.id] = { nome: s.nome, cor: s.cor }
          })
        }
      }

      const filtradas = raw.map(item => {
        const statusId = item.dados.proposta_status_id
        const statusInfo = statusMap[statusId] || statusMap[String(statusId)] || {}
        return {
          id: item.id,
          propostaId: item.proposta_id,
          statusNome: statusInfo.nome || '',
          statusCor: statusInfo.cor || '#333',
          usuario: item.dados?.usuario_nome || 'Desconhecido',
          criadoEm: item.criado_em,
          nomeCliente: item.proposta?.matricula?.cliente?.nome_completo || '',
          cpf: item.proposta?.matricula?.cliente?.cpf || '',
          propostaBanco: item.proposta?.numero_proposta_banco || ''
        }
      })

      setNotificacoes(filtradas)

      const ultimoVisto = localStorage.getItem('notif_ultimo_visto')
      const novas = ultimoVisto
        ? filtradas.filter(n => new Date(n.criadoEm) > new Date(ultimoVisto)).length
        : filtradas.length
      setBadgeCount(novas)
    } catch (err) {
      console.error('Erro ao carregar notificacoes:', err)
    }
  }

  function abrirProposta(propostaId) {
    localStorage.setItem('notif_modal_proposta_id', propostaId)
    setOpen(false)
    if (setPaginaAtual) setPaginaAtual('esteira-proposta')
  }

  function aoAbrirPainel() {
    setOpen(prev => {
      if (!prev) localStorage.setItem('notif_ultimo_visto', new Date().toISOString())
      return !prev
    })
    setBadgeCount(0)
  }

  function formatarTempo(iso) {
    const d = new Date(iso)
    const agora = new Date()
    const diffMs = agora - d
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'agora'
    if (diffMin < 60) return `${diffMin}min`
    const diffH = Math.floor(diffMin / 60)
    return `${diffH}h`
  }

  return (
    <>
      {open && (
        <div className="notif-panel" ref={panelRef}>
          <div className="notif-header">
            <span>Notificações</span>
            <button className="notif-close-btn" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="notif-list">
            {notificacoes.length === 0 ? (
              <div className="notif-empty">Nenhuma notificação</div>
            ) : (
              notificacoes.map(n => (
                <div key={n.id} className="notif-item" onClick={() => abrirProposta(n.propostaId)}>
                  <div className="notif-item-header">
                    <span className="notif-user">{n.usuario}</span>
                    <span className="notif-time">{formatarTempo(n.criadoEm)}</span>
                  </div>
                  <div className="notif-text">Status alterado para <span style={{color: n.statusCor, fontWeight: 'bold'}}>{n.statusNome}</span></div>
                  <div className="notif-cliente">
                    {n.nomeCliente || n.cpf || n.propostaBanco ? (
                      <>{(n.nomeCliente || n.cpf || n.propostaBanco).substring(0, 50)}</>
                    ) : (
                      <>Proposta #{n.propostaId}</>
                    )}
                  </div>
                  <ExternalLink size={12} className="notif-link-icon" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <button className="notif-fab" onClick={aoAbrirPainel} title="Notificações">
        <Bell size={26} />
        {badgeCount > 0 && (
          <span className="notif-badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
        )}
      </button>
    </>
  )
}
