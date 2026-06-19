import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import LoadingBars from '../../../components/LoadingBars/LoadingBars'
import { IMaskInput } from 'react-imask'
import './StatusFinanceiro.css'

export default function StatusFinanceiro({ setPaginaAtual }) {
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [proposta, setProposta] = useState(null)
  const [promotoras, setPromotoras] = useState([])
  const [form, setForm] = useState({
    tabelaBanco: '',
    comissao: '',
    tps: '',
    meta: '',
    promotora_id: '',
  })

  const valorLiberado = proposta
    ? Number(proposta.valorLiberadoReal ?? proposta.valorLiberado) || 0
    : 0
  const comissaoNum = Number(form.comissao || 0)
  const tpsNum = Number(form.tps || 0)
  const valorMeta = (comissaoNum + tpsNum) * 10
  const percentualRecebido = valorLiberado > 0
    ? Math.min(((comissaoNum + tpsNum) / valorLiberado * 100), 15).toFixed(2)
    : ''

  useEffect(() => {
    const stored = localStorage.getItem('propostaSelecionada_crmwa')
    if (!stored) {
      setPaginaAtual('financeiro')
      return
    }
    const item = JSON.parse(stored || '{}')
    setProposta(item)
    setForm({
      tabelaBanco: item.tabelaBanco || '',
      comissao: String(item.comissao ?? ''),
      tps: String(item.tps ?? ''),
      meta: item.meta || '',
      promotora_id: item.promotora_id ?? '',
    })
    ;(async () => {
      const { data } = await supabase.from('promotora').select('id, nome').eq('ativo', true).order('nome')
      setPromotoras(data || [])
    })()
    setLoading(false)
  }, [setPaginaAtual])

  async function salvar() {
    setSalvando(true)
    setMensagem('')
    try {
      const parseVal = (v) => v ? parseFloat(String(v).replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.')) || 0 : 0

      const { error } = await supabase
        .from('proposta')
        .update({
          codigo_tabela: form.tabelaBanco,
          comissao: form.comissao ? parseVal(form.comissao) : null,
          tps_feita: form.tps ? parseVal(form.tps) : null,
          promotora_id: form.promotora_id ? Number(form.promotora_id) : null,
          percentual_recebido: percentualRecebido ? Number(percentualRecebido) : null,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', proposta.id)

      if (error) throw error
      setMensagem('ok')
    } catch (err) {
      setMensagem('erro: ' + err.message)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <LoadingBars />

  return (
    <div className="form-container">
      <header className="form-header">
        <h1>Financeiro - Detalhes</h1>
        <p className="header-subtitle">Configuração financeira da proposta</p>
      </header>

      <div className="status-financeiro-card">
        <div className="status-financeiro-header">
          <div className="status-financeiro-avatar">
            {proposta.nomeCliente?.charAt(0) || '?'}
          </div>
          <div>
            <h2>{proposta.nomeCliente}</h2>
            <p>CPF: {proposta.cpf} | Proposta: {proposta.propostaBanco}</p>
            <span className="config-status ativo">{proposta.status}</span>
          </div>
        </div>

        <div className="status-financeiro-body">
          <div className="grid-row">
            <div className="field-group">
              <label>Comissão (R$)</label>
              <IMaskInput
                mask={Number}
                value={form.comissao}
                onAccept={value => setForm({ ...form, comissao: value })}
                placeholder="R$ 0,00"
                className="input-estilizado"
                scale={2}
                radix=","
                prefix="R$ "
                thousandsSeparator="."
                prepare={(str) => str.replace(/\./g, '')}
              />
            </div>
            <div className="field-group">
              <label>TPS</label>
              <IMaskInput
                mask={Number}
                value={form.tps}
                onAccept={value => setForm({ ...form, tps: value })}
                placeholder="R$ 0,00"
                className="input-estilizado"
                scale={2}
                radix=","
                prefix="R$ "
                thousandsSeparator="."
                prepare={(str) => str.replace(/\./g, '')}
              />
            </div>
            <div className="field-group">
              <label>Meta (R$)</label>
              <input
                type="text"
                className="input-estilizado"
                value={valorMeta > 0
                  ? 'R$ ' + valorMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : ''}
                disabled
                placeholder="R$ 0,00"
              />
            </div>
            <div className="field-group">
              <label>% Recebido</label>
              <input
                type="text"
                className="input-estilizado"
                value={percentualRecebido ? `${percentualRecebido}%` : ''}
                disabled
                placeholder="0%"
              />
            </div>
          </div>

          <div className="grid-row">
            <div className="field-group">
              <label>Valor Liberado</label>
              <input
                type="text"
                className="input-estilizado"
                value={proposta.valorLiberadoReal || proposta.valorLiberado
                  ? Number(proposta.valorLiberadoReal ?? proposta.valorLiberado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : '-'}
                disabled
              />
            </div>
            <div className="field-group">
              <label>Tabela Banco</label>
              <input
                type="text"
                className="input-estilizado"
                value={form.tabelaBanco}
                disabled
                placeholder="Tabela do banco"
              />
            </div>
            <div className="field-group">
              <label>Banco</label>
              <input
                type="text"
                className="input-estilizado"
                value={proposta.banco}
                disabled
              />
            </div>
          </div>

          <div className="grid-row">
            <div className="field-group">
              <label>Promotora</label>
              <select
                className="input-estilizado"
                value={form.promotora_id}
                onChange={e => setForm({ ...form, promotora_id: e.target.value })}
              >
                <option value="">Selecione uma promotora</option>
                {promotoras.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="status-financeiro-actions">
          <button className="btn-cancel" onClick={() => setPaginaAtual('financeiro')}>
            Voltar
          </button>
          <button className="btn-primary" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          {mensagem === 'ok' && <span className="config-toast success">Salvo com sucesso!</span>}
          {mensagem.startsWith('erro') && <span className="config-toast error">{mensagem.replace('erro: ', '')}</span>}
        </div>
      </div>
    </div>
  )
}
