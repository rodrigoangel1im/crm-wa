import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, User } from 'lucide-react'
import { sendChatMessage } from '../../lib/ollama'
import './ChatBot.css'

const initialMessages = [
  {
    id: 1,
    role: 'bot',
    text: 'Olá, sou Alezinha! Como posso ajudar você hoje?'
  }
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = { id: Date.now(), role: 'user', text: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const reply = await sendChatMessage([...messages, userMsg])
      const botMsg = { id: Date.now() + 1, role: 'bot', text: reply }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      console.error('Erro ao conectar com Ollama:', err)
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        text: 'Desculpe, não consegui me conectar ao assistente agora. Verifique se o Ollama está rodando.'
      }
      setMessages(prev => [...prev, botMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <img src="/alezinha rosto.png" alt="Alezinha" className="chat-header-avatar" />
            <span>Alezinha</span>
            <button className="chat-close-btn" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chat-msg ${msg.role}`}>
                <div className="msg-avatar">
                  {msg.role === 'bot' ? <img src="/alezinha rosto.png" alt="Alezinha" className="msg-avatar-img" /> : <User size={16} />}
                </div>
                <div className="msg-bubble">{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg bot">
                <div className="msg-avatar">
                  <img src="/alezinha rosto.png" alt="Alezinha" className="msg-avatar-img" />
                </div>
                <div className="msg-bubble typing-indicator">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={loading}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button
        className="chat-fab"
        onClick={() => setOpen(prev => !prev)}
        title="Abrir chat"
      >
        {open ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </>
  )
}
