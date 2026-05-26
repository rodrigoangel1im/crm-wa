import React, { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload } from 'lucide-react'
import './HorariosList.css'

function calcMinutos(entrada, saidaAlmoco, entradaAlmoco, saida) {
  if (!entrada || !saidaAlmoco || !entradaAlmoco || !saida) return null
  const [h1, m1] = entrada.split(':').map(Number)
  const [h2, m2] = saidaAlmoco.split(':').map(Number)
  const [h3, m3] = entradaAlmoco.split(':').map(Number)
  const [h4, m4] = saida.split(':').map(Number)

  const manha = (h2 * 60 + m2) - (h1 * 60 + m1)
  const tarde = (h4 * 60 + m4) - (h3 * 60 + m3)
  const total = manha + tarde
  return total > 0 ? total : null
}

function formatHoras(min) {
  if (min == null) return '-'
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

function formatSaldo(min) {
  if (min == null) return '-'
  const abs = Math.abs(min)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const sign = min > 0 ? '+' : min < 0 ? '-' : ''
  return `${sign}${h}h${String(m).padStart(2, '0')}`
}

function formatData(dataStr) {
  const d = new Date(dataStr + 'T12:00:00')
  const diasSem = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return `${diasSem[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}`
}

function isFimSemana(dataStr) {
  const d = new Date(dataStr + 'T12:00:00')
  return d.getDay() === 0 || d.getDay() === 6
}

function gerarDias(mes, ano) {
  const total = new Date(ano, mes, 0).getDate()
  return Array.from({ length: total }, (_, i) =>
    `${ano}-${String(mes).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
  )
}

function parseCSV(texto) {
  const linhas = texto.trim().split('\n')
  if (linhas.length < 2) return { erro: 'CSV vazio ou sem dados.' }

  const cabecalho = linhas[0].toLowerCase().split(',').map(s => s.trim())
  const idxData = cabecalho.indexOf('data')
  const idxEntrada = cabecalho.indexOf('entrada')
  const idxSaidaAlmoco = cabecalho.indexOf('saida_almoco') !== -1 ? cabecalho.indexOf('saida_almoco') : cabecalho.indexOf('saída_almoco')
  const idxEntradaAlmoco = cabecalho.indexOf('entrada_almoco') !== -1 ? cabecalho.indexOf('entrada_almoco') : cabecalho.indexOf('entrada_almoco')
  const idxSaida = cabecalho.indexOf('saida') !== -1 ? cabecalho.indexOf('saida') : cabecalho.indexOf('saída')

  if (idxData === -1) return { erro: 'Coluna "data" não encontrada no CSV.' }

  const registros = []
  const erros = []

  for (let i = 1; i < linhas.length; i++) {
    const cols = linhas[i].split(',').map(s => s.trim())
    if (cols.length < 2 || !cols[idxData]) continue

    let data = cols[idxData]
    if (data.includes('/')) {
      const [d, m, a] = data.split('/')
      data = `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      erros.push(`Linha ${i + 1}: data inválida "${cols[idxData]}"`)
      continue
    }

    registros.push({
      data,
      entrada: idxEntrada !== -1 ? (cols[idxEntrada] || null) : null,
      saida_almoco: idxSaidaAlmoco !== -1 ? (cols[idxSaidaAlmoco] || null) : null,
      entrada_almoco: idxEntradaAlmoco !== -1 ? (cols[idxEntradaAlmoco] || null) : null,
      saida: idxSaida !== -1 ? (cols[idxSaida] || null) : null,
    })
  }

  return { registros, erros }
}

const JORNADA_MINUTOS = 480

export default function HorariosList({ usuarioId, isAdmin, usuarios }) {
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const [registros, setRegistros] = useState({})
  const [loading, setLoading] = useState(true)
  const [modalImportar, setModalImportar] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState(usuarioId)

  const usuarioAlvo = isAdmin ? usuarioSelecionadoId : usuarioId

  const usuarioSelecionadoNome = useMemo(() => {
    if (!isAdmin) return ''
    const u = usuarios.find(u => u.id === usuarioSelecionadoId)
    return u ? u.nome : ''
  }, [isAdmin, usuarios, usuarioSelecionadoId])

  const dias = useMemo(() => gerarDias(mes, ano), [mes, ano])

  useEffect(() => {
    if (!usuarioAlvo) return
    let cancel = false
    async function carregar() {
      setLoading(true)
      const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
      const fim = `${ano}-${String(mes).padStart(2, '0')}-${new Date(ano, mes, 0).getDate()}`

      const { data } = await supabase
        .from('usuario_horario')
        .select('*')
        .eq('usuario_id', usuarioAlvo)
        .gte('data', inicio)
        .lte('data', fim)
        .order('data')

      if (cancel) return
      const map = {}
      if (data) data.forEach(r => { map[r.data] = r })
      setRegistros(map)
      setLoading(false)
    }
    carregar()
    return () => { cancel = true }
  }, [usuarioAlvo, mes, ano, refreshKey])

  const stats = useMemo(() => {
    let totalMin = 0
    let diasCompletos = 0
    for (const data of dias) {
      const r = registros[data]
      if (r) {
        const min = calcMinutos(r.entrada, r.saida_almoco, r.entrada_almoco, r.saida)
        if (min != null) {
          totalMin += min
          diasCompletos++
        }
      }
    }
    const saldo = totalMin - (diasCompletos * JORNADA_MINUTOS)
    return { totalMin, diasCompletos, saldo }
  }, [registros, dias])

  if (!usuarioAlvo) {
    return (
      <div className="tab-section">
        <div className="horarios-empty">Nenhum usuário selecionado.</div>
      </div>
    )
  }

  return (
    <>
      <div className="tab-section">
        <div className="tab-header">
          <h2>Horários{isAdmin && usuarioSelecionadoNome ? ` — ${usuarioSelecionadoNome}` : ''}</h2>
          <div className="filtro-horarios">
            {isAdmin && (
              <>
                <select
                  className="filtro-select"
                  value={usuarioSelecionadoId}
                  onChange={(e) => setUsuarioSelecionadoId(Number(e.target.value))}
                  style={{ minWidth: 180 }}
                >
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
                <button className="btn-importar" onClick={() => setModalImportar(true)}>
                  <Upload size={16} />
                  <span>Importar</span>
                </button>
              </>
            )}
            <select
              className="filtro-select"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
            >
              {[
                { value: 1, label: 'Janeiro' },
                { value: 2, label: 'Fevereiro' },
                { value: 3, label: 'Março' },
                { value: 4, label: 'Abril' },
                { value: 5, label: 'Maio' },
                { value: 6, label: 'Junho' },
                { value: 7, label: 'Julho' },
                { value: 8, label: 'Agosto' },
                { value: 9, label: 'Setembro' },
                { value: 10, label: 'Outubro' },
                { value: 11, label: 'Novembro' },
                { value: 12, label: 'Dezembro' },
              ].map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              className="filtro-select"
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="saldo-horas-card">
          <div className="saldo-horas-item">
            <span className="saldo-label">Saldo do mês</span>
            <span className={`saldo-valor ${stats.saldo >= 0 ? 'positivo' : 'negativo'}`}>
              {formatSaldo(stats.saldo)}
            </span>
          </div>
          <div className="saldo-horas-divider" />
          <div className="saldo-horas-item">
            <span className="saldo-label">Dias registrados</span>
            <span className="saldo-valor" style={{ fontSize: 18, color: '#3f3b6c' }}>
              {stats.diasCompletos}/{dias.length}
            </span>
          </div>
        </div>

        <div className="horarios-table-wrapper">
          <table className="horarios-table">
            <thead>
              <tr>
                <th>Dia</th>
                <th>Entrada</th>
                <th>Saída Almoço</th>
                <th>Entrada Almoço</th>
                <th>Saída</th>
                <th>Horas</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {dias.map(data => {
                const reg = registros[data] || {}
                const min = calcMinutos(reg.entrada, reg.saida_almoco, reg.entrada_almoco, reg.saida)
                const fim = isFimSemana(data)

                return (
                  <tr key={data} className={fim ? 'horario-row-weekend' : ''}>
                    <td className="horario-dia">{formatData(data)}</td>
                    <td><span className="horario-valor">{reg.entrada ? reg.entrada.slice(0, 5) : '-'}</span></td>
                    <td><span className="horario-valor">{reg.saida_almoco ? reg.saida_almoco.slice(0, 5) : '-'}</span></td>
                    <td><span className="horario-valor">{reg.entrada_almoco ? reg.entrada_almoco.slice(0, 5) : '-'}</span></td>
                    <td><span className="horario-valor">{reg.saida ? reg.saida.slice(0, 5) : '-'}</span></td>
                    <td className={`horario-horas ${min != null ? 'preenchido' : ''}`}>
                      {min != null ? formatHoras(min) : '-'}
                    </td>
                    <td className={`horario-saldo ${min != null ? (min - JORNADA_MINUTOS >= 0 ? 'positivo' : 'negativo') : ''}`}>
                      {min != null ? formatSaldo(min - JORNADA_MINUTOS) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {loading && <div className="horarios-loading">Carregando...</div>}
      </div>

      {modalImportar && (
        <ModalImportarHorarios
          usuarioId={usuarioAlvo}
          isAdmin={isAdmin}
          usuarios={usuarios}
          onClose={() => setModalImportar(false)}
            onImportado={() => {
              setModalImportar(false)
              setRefreshKey(k => k + 1)
            }}
        />
      )}
    </>
  )
}

function ModalImportarHorarios({ usuarioId, isAdmin, usuarios, onClose, onImportado }) {
  const [usuarioAlvo, setUsuarioAlvo] = useState(usuarioId)
  const [textoCSV, setTextoCSV] = useState('')
  const [arquivo, setArquivo] = useState(null)
  const [modo, setModo] = useState('colar')
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const fileRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setArquivo(file)
    const reader = new FileReader()
    reader.onload = (ev) => setTextoCSV(ev.target.result)
    reader.readAsText(file)
  }

  async function handleImportar() {
    if (!textoCSV.trim()) return

    const parsed = parseCSV(textoCSV)
    if (parsed.erro) {
      setResultado({ tipo: 'erro', mensagem: parsed.erro })
      return
    }

    if (parsed.registros.length === 0) {
      setResultado({ tipo: 'erro', mensagem: 'Nenhum registro válido encontrado no CSV.' })
      return
    }

    setImportando(true)
    setResultado(null)

    const alvoId = isAdmin ? usuarioAlvo : usuarioId
    let inseridos = 0
    let atualizados = 0
    let erros = []

    for (const reg of parsed.registros) {
      const { data, entrada, saida_almoco, entrada_almoco, saida } = reg

      const { data: existente } = await supabase
        .from('usuario_horario')
        .select('id')
        .eq('usuario_id', alvoId)
        .eq('data', data)
        .maybeSingle()

      if (existente) {
        const { error } = await supabase
          .from('usuario_horario')
          .update({ entrada, saida_almoco, entrada_almoco, saida, atualizado_em: new Date().toISOString() })
          .eq('id', existente.id)
        if (error) erros.push(`${data}: ${error.message}`)
        else atualizados++
      } else {
        const { error } = await supabase
          .from('usuario_horario')
          .insert([{ usuario_id: alvoId, data, entrada, saida_almoco, entrada_almoco, saida }])
        if (error) erros.push(`${data}: ${error.message}`)
        else inseridos++
      }
    }

    setImportando(false)
    setResultado({
      tipo: erros.length > 0 && inseridos + atualizados === 0 ? 'erro' : 'sucesso',
      mensagem: `${inseridos} registros inseridos, ${atualizados} atualizados.`,
      erros: erros.length > 0 ? erros : null,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">Importar Horários</div>
        <div className="modal-body" style={{ padding: 20 }}>
          {isAdmin && (
            <div className="form-group">
              <label>Importar para</label>
              <select
                className="config-input"
                value={usuarioAlvo}
                onChange={(e) => setUsuarioAlvo(Number(e.target.value))}
              >
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Formato do CSV</label>
            <div className="csv-exemplo">
              data,entrada,saida_almoco,entrada_almoco,saida<br />
              01/01/2024,08:00,12:00,13:00,17:00<br />
              02/01/2024,08:00,12:00,13:00,18:00
            </div>
          </div>

          <div className="form-group">
            <div className="import-modos">
              <label className="checkbox-label">
                <input type="radio" name="modo" checked={modo === 'colar'} onChange={() => setModo('colar')} />
                Colar CSV
              </label>
              <label className="checkbox-label">
                <input type="radio" name="modo" checked={modo === 'arquivo'} onChange={() => setModo('arquivo')} />
                Upload arquivo
              </label>
            </div>
          </div>

          {modo === 'colar' ? (
            <div className="form-group">
              <textarea
                className="csv-textarea"
                rows={8}
                placeholder="Cole o CSV aqui..."
                value={textoCSV}
                onChange={(e) => setTextoCSV(e.target.value)}
              />
            </div>
          ) : (
            <div className="form-group">
              <input type="file" ref={fileRef} accept=".csv,.txt" onChange={handleFile} className="csv-file-input" />
              {arquivo && <div className="csv-file-name">{arquivo.name}</div>}
            </div>
          )}

          {resultado && (
            <div className={`import-resultado ${resultado.tipo}`}>
              {resultado.mensagem}
              {resultado.erros && resultado.erros.length > 0 && (
                <div className="import-erros">
                  {resultado.erros.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-cancel" onClick={onClose}>Fechar</button>
          <button className="btn-primary" onClick={handleImportar} disabled={importando || !textoCSV.trim()}>
            {importando ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  )
}
