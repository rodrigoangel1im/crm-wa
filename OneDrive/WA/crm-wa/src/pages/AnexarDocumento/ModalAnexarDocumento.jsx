import React, { useState, useEffect, useRef } from 'react'
import './ModalAnexarDocumento.css'
import { supabase } from '../../lib/supabase'

const ModalAnexarDocumento = ({ isOpen, onClose, propostaIds, tipoDocumento, tipoLabel, onAnexar, anexosExistentes = [] }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [itens, setItens] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef()

  useEffect(() => {
    if (isOpen) {
      setItens(anexosExistentes)
      setSelectedFile(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleAdicionar = () => {
    if (!selectedFile) return
    setItens(prev => [...prev, {
      __local: true,
      codigo: Date.now(),
      file: selectedFile,
      nome_arquivo: selectedFile.name,
      tamanho_bytes: selectedFile.size
    }])
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoverItem = async (item) => {
    if (item.__local) {
      setItens(prev => prev.filter(i => i.codigo !== item.codigo))
    } else {
      try {
        await supabase.storage.from('documentos-proposta').remove([item.storage_path])
        await supabase.from('documento_proposta').delete().eq('storage_path', item.storage_path)
        setItens(prev => prev.filter(i => i.id !== item.id))
      } catch (err) {
        console.error('Erro ao remover:', err)
        alert('Erro ao remover: ' + err.message)
      }
    }
  }

  const handleAnexar = async () => {
    const locais = itens.filter(i => i.__local)
    if (locais.length === 0) {
      onClose()
      return
    }

    setUploading(true)
    try {
      const results = []
      for (const item of locais) {
        const ext = item.file.name.split('.').pop()
        const primeiraProposta = propostaIds?.[0]
        const storagePath = `${primeiraProposta}/${tipoDocumento}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('documentos-proposta')
          .upload(storagePath, item.file)

        if (uploadError) throw uploadError

        const inserts = (propostaIds || []).map(pid => ({
          proposta_id: pid,
          tipo_documento: tipoDocumento,
          nome_arquivo: item.nome_arquivo,
          storage_path: storagePath,
          tamanho_bytes: item.tamanho_bytes,
          mime_type: item.file.type
        }))

        const { data: inserted, error: insertError } = await supabase
          .from('documento_proposta')
          .insert(inserts)
          .select()

        if (insertError) throw insertError
        results.push(inserted?.[0] || inserted)
      }

      const atualizados = [...itens.filter(i => !i.__local), ...results]
      onAnexar(tipoDocumento, atualizados)
      onClose()
    } catch (err) {
      console.error('Erro ao anexar:', err)
      alert('Erro ao enviar documentos: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const formatarTamanho = (bytes) => {
    if (!bytes) return '-'
    const kb = bytes / 1024
    if (kb < 1024) return kb.toFixed(2) + ' KB'
    return (kb / 1024).toFixed(2) + ' MB'
  }

  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <div className="modalHeader">
          <h3>Documentos - {tipoLabel}</h3>
        </div>

        <div className="modalBody">
          <div className="uploadSection">
            <select className="selectDoc">
              <option>{tipoLabel || 'Selecione o docu..'}</option>
            </select>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button className="btnEscolher" onClick={() => fileInputRef.current?.click()}>
              ESCOLHER ARQUIVO
            </button>
            <span className="fileName">{selectedFile ? selectedFile.name : 'Nenhum arquivo selecionado'}</span>
            <button className="btnAdd" onClick={handleAdicionar} disabled={!selectedFile}>
              ADICIONAR
            </button>
          </div>

          <div className="addedDocsSection">
            <div className="addedDocsHeader">Documentos adicionados</div>
            <table className="docsTable">
              <thead>
                <tr>
                  <th>Nome do documento</th>
                  <th>Tamanho</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {itens.length > 0 ? (
                  itens.map((item, idx) => (
                    <tr key={item.id || item.codigo}>
                      <td>{item.nome_arquivo}{item.__local ? ' (local)' : ''}</td>
                      <td>{formatarTamanho(item.tamanho_bytes)}</td>
                      <td>
                        <button className="removeTableBtn" onClick={() => handleRemoverItem(item)}>
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ height: '40px', color: 'white', paddingLeft: '15px' }}>
                      Nenhum documento adicionado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modalFooter">
          <button className="btnFooter" onClick={handleAnexar} disabled={uploading}>
            {uploading ? 'ENVIANDO...' : 'ANEXAR'}
          </button>
          <button className="btnFooter" onClick={onClose}>VOLTAR</button>
        </div>
      </div>
    </div>
  )
}

export default ModalAnexarDocumento
