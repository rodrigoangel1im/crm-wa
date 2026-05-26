import React, { useState, useEffect, useCallback } from 'react'
import { Upload, Trash2, FileText, Database, CheckCircle, Loader } from 'lucide-react'
import { getDocuments, addDocument, removeDocument } from '../../lib/rag'
import './BaseConhecimento.css'

export default function BaseConhecimento() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getDocuments()
      setDocs(data)
    } catch (err) {
      console.error('Erro ao carregar documentos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setStatus('')
    try {
      await addDocument(file, (msg) => setStatus(msg))
      await refresh()
      setStatus('Documento adicionado com sucesso!')
    } catch (err) {
      setStatus(`Erro: ${err.message || 'Falha ao processar documento'}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemove = async (id) => {
    try {
      await removeDocument(id)
      await refresh()
    } catch (err) {
      console.error('Erro ao remover:', err)
    }
  }

  return (
    <div className="form-container">
      <header className="form-header">
        <h1>Base de Conhecimento</h1>
        <p className="header-subtitle">
          Faça upload de PDFs com manuais, políticas e procedimentos para a Alezinha consultar
        </p>
      </header>

      <div className="form-content">
        <div className="bc-upload-area">
          <label className={`bc-upload-btn ${uploading ? 'disabled' : ''}`}>
            <Upload size={18} />
            {uploading ? 'Processando...' : 'Upload PDF'}
            <input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading} hidden />
          </label>
          {uploading && (
            <div className="bc-status">
              <Loader size={16} className="spinner" />
              <span>{status}</span>
            </div>
          )}
          {!uploading && status && (
            <div className="bc-status success">
              <CheckCircle size={16} />
              <span>{status}</span>
            </div>
          )}
        </div>

        {docs.length > 0 && (
          <div className="bc-summary">
            <FileText size={16} />
            <span>{docs.length} documento(s) indexados</span>
          </div>
        )}

        <div className="bc-list">
          {loading ? (
            <div className="bc-empty">
              <Loader size={24} className="spinner" />
              <p>Carregando...</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="bc-empty">
              <Database size={40} />
              <p>Nenhum documento cadastrado. Faça upload de PDFs para começar.</p>
            </div>
          ) : (
            docs.map(doc => (
              <div key={doc.id} className="bc-item">
                <div className="bc-item-icon">
                  <FileText size={20} />
                </div>
                <div className="bc-item-info">
                  <span className="bc-item-name">{doc.name}</span>
                  <span className="bc-item-meta">
                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <button className="bc-item-remove" onClick={() => handleRemove(doc.id)} title="Remover">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
