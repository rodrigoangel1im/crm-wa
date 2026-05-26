import { searchRelevantContext } from './rag'

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2'

export async function sendChatMessage(messages) {
  const model = DEFAULT_MODEL
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')

  let systemContent = 'Você é a Alezinha, assistente virtual da Wa Promotora, uma empresa de crédito e financiamento. Seu papel é ajudar os colaboradores internos com dúvidas sobre simulações, propostas, contratos e processos do CRM. Seja direta e objetiva — responda em poucas frases, vá direto ao ponto, sem rodeios. Sempre em português brasileiro. Você tem que responder apenas com a sua base de conhecimento (roteiros operacionais) '

  if (lastUserMsg) {
    const context = await searchRelevantContext(lastUserMsg.text)
    if (context) {
      systemContent += `\n\nUse as informações abaixo como base de conhecimento para responder a pergunta do usuário:\n\n${context}\n\nSe a informação não estiver na base de conhecimento, responda com base no seu conhecimento geral mesmo assim.`
    }
  }

  const formattedMessages = [
    { role: 'system', content: systemContent },
    ...messages.map(m => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text
    }))
  ]

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: formattedMessages, stream: false })
  })

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.message.content
}
