import React, { useState, useEffect } from 'react'
import './AnexarDocumento.css'
import ModalAnexarDocumento from './ModalAnexarDocumento'
import LoadingBars from '../../components/LoadingBars/LoadingBars'
import { supabase } from '../../lib/supabase'

const TIPOS_DOCUMENTO = [
  { id: 'identidade', label: 'Documento de identidade' },
  { id: 'comprovante_residencia', label: 'Comprovante de residência' },
  { id: 'comprovante_renda', label: 'Contracheque' },
  { id: 'extrato_inss', label: 'Extrato consignado - Hiscon INSS' },
]

const AnexarDocumento = ({ setPaginaAtual }) => {
  const [propostaIds, setPropostaIds] = useState([])
  const [anexos, setAnexos] = useState({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [hoveredDoc, setHoveredDoc] = useState(null)
  const [modalAnexarOpen, setModalAnexarOpen] = useState(false)
  const [documentoSelecionado, setDocumentoSelecionado] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('propostaAnexar_crmwa')
    if (stored) {
      const p = JSON.parse(stored)
      const ids = Array.isArray(p.ids) ? p.ids : p.id ? [p.id] : []
      setPropostaIds(ids)
      if (ids.length > 0) carregarDocumentos(ids)
    } else {
      setLoading(false)
    }
  }, [])

  async function carregarDocumentos(ids) {
    try {
      const { data, error } = await supabase
        .from('documento_proposta')
        .select('*')
        .in('proposta_id', ids)

      if (error) throw error

      const agrupados = {}
      for (const doc of data || []) {
        const tipo = doc.tipo_documento
        if (!agrupados[tipo]) agrupados[tipo] = []
        agrupados[tipo].push(doc)
      }
      setAnexos(agrupados)
    } catch (err) {
      console.error('Erro ao carregar documentos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnexar = (id) => {
    const doc = TIPOS_DOCUMENTO.find(d => d.id === id)
    setDocumentoSelecionado(doc)
    setModalAnexarOpen(true)
  }

  const getAnexosDoDocumento = (id) => {
    return anexos[id] || []
  }

  const handleAnexarDocumento = (id, documentosAnexados) => {
    setAnexos(prev => ({ ...prev, [id]: documentosAnexados }))
  }

  const handleRemover = async (tipoDocumento) => {
    if (propostaIds.length === 0) return
    try {
      const docs = anexos[tipoDocumento] || []
      const paths = docs.map(d => d.storage_path)

      if (paths.length > 0) {
        await supabase.storage.from('documentos-proposta').remove(paths)
      }

      const { error } = await supabase
        .from('documento_proposta')
        .delete()
        .in('proposta_id', propostaIds)
        .eq('tipo_documento', tipoDocumento)

      if (error) throw error

      setAnexos(prev => {
        const newAnexos = { ...prev }
        delete newAnexos[tipoDocumento]
        return newAnexos
      })
    } catch (err) {
      console.error('Erro ao remover documento:', err)
      alert('Erro ao remover documento: ' + err.message)
    }
  }

  const handleVoltar = () => {
    setPaginaAtual('adicionar-contrato')
  }

  const handleFinalizar = async () => {
    try {
      if (propostaIds.length > 0) {
        for (const pid of propostaIds) {
          const { data: docs, error } = await supabase
            .from('documento_proposta')
            .select('id')
            .eq('proposta_id', pid)

          if (error) throw error

          if (!docs || docs.length === 0) {
            await supabase.from('proposta').update({ proposta_status_id: 10 }).eq('id', pid)
          }
        }
      }
    } catch (err) {
      console.error('Erro ao finalizar:', err)
    }

    localStorage.removeItem('propostaAnexar_crmwa')
    setPaginaAtual('esteira-proposta')
  }

  if (loading) {
    return <LoadingBars />
  }

  if (propostaIds.length === 0) {
    return (
      <div className="pageContainer">
        <header className="mainHeader">
          <h1>Anexo de documentos</h1>
          <p className="header-subtitle">Descrição da página</p>
        </header>
        <main className="documentCard">
          <p style={{ textAlign: 'center', padding: '40px' }}>Nenhuma proposta selecionada.</p>
          <div className="actionButtons">
            <button className="btnAction" onClick={() => setPaginaAtual('adicionar-contrato')}>VOLTAR</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="pageContainer">
        <header className="mainHeader">
          <h1>Anexo de documentos</h1>
          <p className="header-subtitle">
            {propostaIds.length > 1
              ? `${propostaIds.length} propostas vinculadas — os documentos serão anexados a todas`
              : `Proposta ${propostaIds[0]} — Anexo de documentos`}
          </p>
        </header>

      <main className="documentCard">
        <div className="cardInternalTitle">
          <h2>
            {propostaIds.length > 1
              ? `${propostaIds.length} propostas — Anexo de documentos`
              : `Proposta ${propostaIds[0]} — Anexo de documentos`}
          </h2>
        </div>

        <div className="docList">
          {TIPOS_DOCUMENTO.map(doc => (
            <div
              className="checkboxItem"
              key={doc.id}
              onMouseEnter={() => setHoveredDoc(doc.id)}
              onMouseLeave={() => setHoveredDoc(null)}
              onClick={() => handleAnexar(doc.id)}
            >
              <input
                type="checkbox"
                className="customCheckbox"
                id={doc.id}
                checked={!!anexos[doc.id]}
                disabled
                onClick={(e) => e.stopPropagation()}
              />
              <label
                htmlFor={doc.id}
                className="docLabel"
                onClick={(e) => e.stopPropagation()}
              >
                {doc.label}
                {anexos[doc.id] && anexos[doc.id].length > 0 && (
                  <span className="fileAttached"> - {anexos[doc.id].length} arquivo(s) anexado(s)</span>
                )}
              </label>

              {hoveredDoc === doc.id && (
                <div className="hoverActions">
                  <button
                    className="hoverBtn"
                    onClick={(e) => { e.stopPropagation(); handleAnexar(doc.id) }}
                  >
                    Anexar Documento
                  </button>
                  {anexos[doc.id] && (
                    <button
                      className="hoverBtn removeBtn"
                      onClick={(e) => { e.stopPropagation(); handleRemover(doc.id) }}
                    >
                      Remover Documento
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="actionButtons">
          <button className="btnAction" onClick={handleFinalizar} disabled={uploading}>
            FINALIZAR
          </button>
        </div>
      </main>

      <ModalAnexarDocumento
        key={documentoSelecionado?.id}
        isOpen={modalAnexarOpen}
        onClose={() => setModalAnexarOpen(false)}
        propostaIds={propostaIds}
        tipoDocumento={documentoSelecionado?.id}
        tipoLabel={documentoSelecionado?.label}
        onAnexar={handleAnexarDocumento}
        anexosExistentes={documentoSelecionado ? getAnexosDoDocumento(documentoSelecionado.id) : []}
      />
    </div>
  )
}

export default AnexarDocumento
