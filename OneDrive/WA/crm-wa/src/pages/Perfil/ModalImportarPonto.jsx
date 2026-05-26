import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'

export default function ModalImportarPonto({ onClose }) {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(false)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState('')

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setResultado('')
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })

        const dataInicioRaw = data[1]?.[0] || ''
        const dataInicioMatch = dataInicioRaw.match(/(\d{2})\/(\d{2})\/(\d{4})/)
        let dataInicio = ''
        let dataFim = ''
        if (dataInicioMatch) {
          dataInicio = `${dataInicioMatch[3]}-${dataInicioMatch[2]}-${dataInicioMatch[1]}`
          const dataFimMatch = dataInicioRaw.match(/~(\d{2})\/(\d{2})\/(\d{4})/)
          if (dataFimMatch) {
            dataFim = `${dataFimMatch[3]}-${dataFimMatch[2]}-${dataFimMatch[1]}`
          }
        }

        const funcionarios = []
        for (let r = 4; r < data.length; r++) {
          const row = data[r]
          const id = row[0]
          if (!id || isNaN(Number(id))) continue
          const nome = String(row[1] || '').trim()
          const departamento = String(row[2] || '').trim()
          const dias = []
          for (let d = 0; d < 25; d++) {
            const turno = row[3 + d]
            if (turno !== undefined && turno !== '' && turno !== null) {
              dias.push({ dia: d + 1, turno: Number(turno) })
            }
          }
          funcionarios.push({ id: Number(id), nome, departamento, dias, dataInicio, dataFim })
        }

        setDados({ funcionarios, dataInicio, dataFim })
        setLoading(false)
      } catch (err) {
        setResultado('Erro ao ler arquivo: ' + err.message)
        setLoading(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImportar() {
    if (!dados || dados.funcionarios.length === 0) return
    setImportando(true)
    setResultado('')
    try {
      for (const func of dados.funcionarios) {
        const { data: pontoInserido, error: erroPonto } = await supabase
          .from('ponto')
          .insert([{
            usuario_ponto_id: func.id,
            funcionario_nome: func.nome,
            funcionario_departamento: func.departamento,
            data_inicio: dados.dataInicio || null,
            data_fim: dados.dataFim || null
          }])
          .select()
          .single()

        if (erroPonto) throw erroPonto

        if (func.dias.length > 0) {
          const registros = func.dias.map(d => ({
            ponto_id: pontoInserido.id,
            usuario_ponto_id: func.id,
            data: `${dados.dataInicio.slice(0, 7)}-${String(d.dia).padStart(2, '0')}`,
            turno_id: d.turno || null
          }))
          const { error: erroRegistros } = await supabase
            .from('ponto_registro')
            .insert(registros)
          if (erroRegistros) throw erroRegistros
        }
      }
      setResultado(`${dados.funcionarios.length} funcionários importados com sucesso!`)
      setImportando(false)
    } catch (err) {
      setResultado('Erro ao importar: ' + err.message)
      setImportando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="modal-header">Importar Ponto (RelatórioPresença.xls)</div>
        <div className="modal-body" style={{ padding: 20, maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Selecione o arquivo</label>
              <input type="file" accept=".xls,.xlsx" onChange={handleFile} />
            </div>
          </div>

          {loading && <p style={{ color: '#888', fontSize: 13 }}>Lendo arquivo...</p>}

          {dados && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, color: '#3f3b6c', fontWeight: 700 }}>
                Período: {dados.dataInicio} ~ {dados.dataFim} | {dados.funcionarios.length} funcionários
              </p>
              <div className="table-wrapper" style={{ marginTop: 8 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Departamento</th>
                      <th>Dias com registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.funcionarios.slice(0, 10).map((f, i) => (
                      <tr key={i}>
                        <td>{f.id}</td>
                        <td>{f.nome}</td>
                        <td>{f.departamento}</td>
                        <td>{f.dias.length}/25</td>
                      </tr>
                    ))}
                    {dados.funcionarios.length > 10 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999', fontStyle: 'italic' }}>... mais {dados.funcionarios.length - 10} funcionários</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {resultado && (
            <p style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, fontSize: 13, backgroundColor: resultado.includes('sucesso') ? '#e6f7e6' : '#fdf0ef', color: resultado.includes('sucesso') ? '#2e7d32' : '#c62828' }}>
              {resultado}
            </p>
          )}
        </div>
        <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-cancel" onClick={onClose}>Fechar</button>
          {dados && (
            <button className="btn-primary" onClick={handleImportar} disabled={importando}>
              {importando ? 'IMPORTANDO...' : 'IMPORTAR'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
