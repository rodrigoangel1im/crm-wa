import { supabase } from './supabase'
import { extrairTextoPDF } from './pdfParser'

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
const MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2'

function getUserId() {
  return parseInt(localStorage.getItem('usuario_id_crmwa')) || null
}

async function generateEmbedding(text) {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt: text }),
  })
  if (!response.ok) throw new Error(`Embedding error: ${response.status}`)
  const data = await response.json()
  return data.embedding
}

function chunkText(text, maxLen = 500, overlap = 80) {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const chunks = []
  let buffer = ''

  for (const p of paragraphs) {
    const trimmed = p.trim()
    if (buffer.length + trimmed.length < maxLen) {
      buffer += (buffer ? '\n\n' : '') + trimmed
    } else {
      if (buffer) chunks.push(buffer.trim())
      const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed]
      buffer = ''
      for (const s of sentences) {
        if (buffer.length + s.length < maxLen) {
          buffer += (buffer ? ' ' : '') + s.trim()
        } else {
          if (buffer) chunks.push(buffer.trim())
          buffer = s.trim()
        }
      }
    }
  }
  if (buffer) chunks.push(buffer.trim())

  if (overlap > 0 && chunks.length > 1) {
    for (let i = 1; i < chunks.length; i++) {
      const prevWords = chunks[i - 1].split(/\s+/)
      const overlapWords = prevWords.slice(-Math.floor(overlap / 5)).join(' ')
      chunks[i] = overlapWords + ' ' + chunks[i]
    }
  }

  return chunks
}

export async function getDocuments() {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function addDocument(file, onProgress) {
  onProgress?.('Enviando PDF para o Storage...')
  const filePath = `${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('base-conhecimento')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  onProgress?.('Extraindo texto do PDF...')
  const text = await extrairTextoPDF(file)

  onProgress?.('Dividindo em chunks...')
  const chunks = chunkText(text)

  onProgress?.('Inserindo documento...')
  const { data: doc, error: docError } = await supabase
    .from('knowledge_documents')
    .insert({ name: file.name, file_path: filePath, created_by: getUserId() })
    .select()
    .single()

  if (docError) {
    await supabase.storage.from('base-conhecimento').remove([filePath])
    throw docError
  }

  const chunkRows = []
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(`Gerando embedding ${i + 1} de ${chunks.length}...`)
    const embedding = await generateEmbedding(chunks[i])
    chunkRows.push({ document_id: doc.id, chunk_text: chunks[i], embedding })
  }

  onProgress?.('Salvando chunks no banco...')
  const { error: chunkError } = await supabase
    .from('knowledge_chunks')
    .insert(chunkRows)

  if (chunkError) {
    await supabase.from('knowledge_documents').delete().eq('id', doc.id)
    await supabase.storage.from('base-conhecimento').remove([filePath])
    throw chunkError
  }

  return doc
}

export async function removeDocument(id) {
  const { data: doc } = await supabase
    .from('knowledge_documents')
    .select('file_path')
    .eq('id', id)
    .single()

  if (doc?.file_path) {
    await supabase.storage.from('base-conhecimento').remove([doc.file_path])
  }

  const { error } = await supabase
    .from('knowledge_documents')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function searchRelevantContext(query, topK = 3) {
  try {
    const queryEmbedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('search_knowledge', {
      query_embedding: queryEmbedding,
      match_count: topK,
      min_similarity: 0.3,
    })

    if (error) throw error
    if (!data || data.length === 0) return ''

    return data
      .map(r => `[Fonte: ${r.doc_name}]\n${r.chunk_text}`)
      .join('\n\n---\n\n')
  } catch (err) {
    console.error('Erro na busca RAG:', err)
    return ''
  }
}
