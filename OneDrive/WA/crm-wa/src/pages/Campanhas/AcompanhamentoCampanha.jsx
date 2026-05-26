import React from 'react'
import LoadingBars from '../../components/LoadingBars/LoadingBars'
import './AcompanhamentoCampanha.css'
import { supabase } from '../../lib/supabase'
import { useState, useEffect } from 'react'

function parseCSV(texto) {
  const linhas = texto.split('\n').map(l => l.trim()).filter(Boolean)
  if (linhas.length === 0) return { headers: [], rows: [] }
  const headers = linhas[0].split(';').map(h => h.replace(/^["']|["']$/g, '').trim())
  const rows = linhas.slice(1).map(linha => {
    const valores = linha.split(';').map(v => v.replace(/^["']|["']$/g, '').trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = valores[i] || '' })
    return obj
  })
  return { headers, rows }
}

function formatEficiencia(val) {
  if (val === null || val === undefined || val === '') return '-'
  const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val
  if (isNaN(num)) return '-'
  return num.toFixed(2) + '%'
}

export default function AcompanhamentoCampanha({ setPaginaAtual }) {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroCampo, setFiltroCampo] = useState('idLote')
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [csvDados, setCsvDados] = useState(null)
  const [csvNome, setCsvNome] = useState('')
  const [importando, setImportando] = useState(false)

  useEffect(() => {
    carregarLotes()
  }, [])

  async function carregarLotes() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('campanha_lote')
        .select('*')
        .in('tipo_campanha_id', [1, 5])
        .order('data_criacao', { ascending: false })

      if (error) {
        console.error('Erro ao carregar lotes:', error)
        return
      }

      const lotesFormatados = (data || []).map(item => ({
        id: item.id,
        idLoteWa: item.id_lote_wa || '-',
        idLote: item.id_lote || '-',
        convenioLote: item.convenio_lote || '-',
        origemLote: item.origem_lote || '-',
        telefoniaLote: item.telefonia_lote || '-',
        status: item.status || '-',
        eficiencia: item.eficiencia,
        dataCriacao: item.data_criacao ? item.data_criacao.split('T')[0] : '-',
      }))

      setLotes(lotesFormatados)
    } catch (error) {
      console.error('Erro ao carregar lotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const lotesFiltrados = lotes.filter(item => {
    if (!filtroTexto) return true
    const termo = filtroTexto.toLowerCase()
    switch (filtroCampo) {
      case 'idLote': return item.idLote.toLowerCase().includes(termo)
      case 'idLoteWa': return item.idLoteWa.toLowerCase().includes(termo)
      case 'convenio': return item.convenioLote.toLowerCase().includes(termo)
      case 'status': return item.status.toLowerCase().includes(termo)
      default: return true
    }
  })

  const colunas = [
    { key: 'idLoteWa', label: 'ID Lote WA' },
    { key: 'idLote', label: 'ID Lote' },
    { key: 'convenioLote', label: 'Convênio' },
    { key: 'origemLote', label: 'Origem' },
    { key: 'telefoniaLote', label: 'Telefonia' },
    { key: 'status', label: 'Status' },
    { key: 'eficiencia', label: 'Eficiência' },
    { key: 'dataCriacao', label: 'Data Criação' },
  ]

  function renderCell(item, key) {
    switch (key) {
      case 'eficiencia':
        return <td style={{ fontWeight: 'bold', color: '#41457a' }}>{formatEficiencia(item.eficiencia)}</td>
      case 'status':
        return (
          <td>
            <span className={`status-tag status-lote-${(item.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
              {item.status}
            </span>
          </td>
        )
      default:
        return <td>{item[key]}</td>
    }
  }

  function handleCsvFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvNome(file.name)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const texto = evt.target.result
      const { headers, rows } = parseCSV(texto)
      setCsvDados({ headers, rows })
    }
    reader.readAsText(file)
  }

  async function confirmarImportacao() {
    if (!csvDados || csvDados.rows.length === 0) return
    setImportando(true)
    try {
      const registros = csvDados.rows.map(row => ({
        id_lote_wa: row.id_lote_wa || row['ID Lote WA'] || '',
        id_lote: row.id_lote || row['ID Lote'] || '',
        convenio_lote: row.convenio_lote || row.Convênio || row.Convenio || '',
        origem_lote: row.origem_lote || row.Origem || '',
        telefonia_lote: row.telefonia_lote || row.Telefonia || '',
        status: row.status || row.Status || '',
        eficiencia: row.eficiencia || row.Eficiência || row.Eficiencia || null,
        data_criacao: row.data_criacao || row['Data Criação'] || null,
        tipo_campanha_id: 1,
      }))

      const { error } = await supabase.from('campanha_lote').insert(registros)
      if (error) throw error

      setCsvModalOpen(false)
      setCsvDados(null)
      setCsvNome('')
      carregarLotes()
    } catch (error) {
      console.error('Erro ao importar:', error)
      alert('Erro ao importar: ' + error.message)
    } finally {
      setImportando(false)
    }
  }

  if (loading) {
    return <LoadingBars />
  }

  return (
    <div className="form-container">
      <header className="form-header">
        <h1>Acompanhamento de Campanha</h1>
      </header>

      <div className="form-content" style={{ width: '95%', maxWidth: '1500px' }}>
        <div className="campanhas-header">
          <span className="status-badge">Discadora / URA</span>
        </div>

        <div className="filtros-wrapper">
          <div className="campo-grupo">
            <label>Pesquisar por:</label>
            <select
              className="input-estilizado"
              style={{ width: '200px' }}
              value={filtroCampo}
              onChange={e => setFiltroCampo(e.target.value)}
            >
              <option value="idLote">ID Lote</option>
              <option value="idLoteWa">ID Lote WA</option>
              <option value="convenio">Convênio</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="campo-grupo" style={{ flexGrow: 1 }}>
            <label>Pesquisar:</label>
            <input
              type="text"
              className="input-estilizado"
              placeholder="Digite para pesquisar..."
              value={filtroTexto}
              onChange={e => setFiltroTexto(e.target.value)}
            />
          </div>

          <button className="btn-pesquisar" onClick={() => { setFiltroTexto(''); carregarLotes() }}>Atualizar</button>
          <button className="btn-importar-csv" onClick={() => setCsvModalOpen(true)}>Importar Base CSV</button>
        </div>

        <div className="tabela-container">
          <table className="tabela-propostas">
            <thead>
              <tr>
                {colunas.map(col => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lotesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={colunas.length} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    Nenhum lote encontrado
                  </td>
                </tr>
              ) : (
                lotesFiltrados.map(item => (
                  <tr key={item.id}>
                    {colunas.map(col => (
                      <React.Fragment key={col.key}>
                        {renderCell(item, col.key)}
                      </React.Fragment>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {csvModalOpen && (
        <div className="modal-overlay" onClick={() => { if (!importando) { setCsvModalOpen(false); setCsvDados(null); setCsvNome('') } }}>
          <div className="csv-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Importar Base CSV - Discadora / URA</h3>
              <button className="modal-close" disabled={importando} onClick={() => { setCsvModalOpen(false); setCsvDados(null); setCsvNome('') }}>&times;</button>
            </div>
            <div className="csv-modal-body">
              {!csvDados ? (
                <div className="csv-upload-area">
                  <label className="csv-file-label">
                    <input type="file" accept=".csv" onChange={handleCsvFile} style={{ display: 'none' }} />
                    <span className="csv-file-btn">Selecionar arquivo CSV</span>
                  </label>
                  <p className="csv-hint">Selecione um arquivo .csv separado por ponto e vírgula (;)</p>
                  <div className="csv-columns-hint">
                    <p>Colunas esperadas:</p>
                    <code>id_lote_wa; id_lote; convenio_lote; origem_lote; telefonia_lote; status; eficiencia; data_criacao</code>
                  </div>
                </div>
              ) : (
                <div className="csv-preview">
                  <div className="csv-preview-header">
                    <span className="csv-preview-title">{csvNome}</span>
                    <span className="csv-preview-count">{csvDados.rows.length} registro(s)</span>
                  </div>
                  <div className="csv-tabela-container">
                    <table className="csv-tabela">
                      <thead>
                        <tr>
                          {csvDados.headers.map(h => <th key={h}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {csvDados.rows.slice(0, 100).map((row, i) => (
                          <tr key={i}>
                            {csvDados.headers.map(h => <td key={h}>{row[h]}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvDados.rows.length > 100 && (
                    <p className="csv-more">Mostrando 100 de {csvDados.rows.length} registros</p>
                  )}
                  <div className="csv-actions">
                    <button className="btn-pesquisar" onClick={() => { setCsvDados(null); setCsvNome('') }} disabled={importando}>Trocar arquivo</button>
                    <button className="btn-pesquisar" style={{ backgroundColor: '#28a745' }} onClick={confirmarImportacao} disabled={importando}>
                      {importando ? 'Importando...' : 'Confirmar importação'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
