import React, { useState, useEffect } from 'react'
import './ModalDetalheProposta.css'
import { supabase } from '../../lib/supabase'

export default function ModalDetalheProposta({ isOpen, onClose, propostaId }) {
  const [dados, setDados] = useState(null)
  const [historico, setHistorico] = useState([])
  const [listaStatus, setListaStatus] = useState([])
  const [listaDetalhes, setListaDetalhes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !propostaId) return
    async function carregar() {
      setLoading(true)
      try {
        const [propostaRes, historicoRes, statusRes, detalhesRes] = await Promise.all([
          supabase
            .from('proposta')
            .select(`
              id,
              numero_proposta_banco,
              valor_liberado,
              valor_parcela,
              numero_parcelas,
              taxa_juros,
              tps,
              codigo_tabela,
              criado_em,
              proposta_status_id,
              proposta_status:proposta_status_id (nome, cor, historico),
              matricula (
                numero_matricula,
                cliente (nome_completo, cpf, data_nascimento),
                convenio (nome)
              ),
              banco_credor:banco_credor_id (nome),
              tipo_operacao:tipo_operacao_id (nome),
              tipo_produto:tipo_produto_id (nome)
            `)
            .eq('id', propostaId)
            .single(),
          supabase
            .from('proposta_historico')
            .select('*')
            .eq('proposta_id', propostaId)
            .order('criado_em', { ascending: false }),
          supabase
            .from('proposta_status')
            .select('id, nome'),
          supabase
            .from('detalhe_status')
            .select('id, nome')
        ])

        if (propostaRes.error) throw propostaRes.error
        if (historicoRes.error) throw historicoRes.error

        setDados(propostaRes.data)
        setHistorico(historicoRes.data || [])
        setListaStatus(statusRes.data || [])
        setListaDetalhes(detalhesRes.data || [])
      } catch (error) {
        console.error('Erro ao carregar detalhes da proposta:', error)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [isOpen, propostaId])

  if (!isOpen) return null

  const formatarValor = (val) => {
    if (val === null || val === undefined) return ''
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatarData = (val) => {
    if (!val) return ''
    const d = new Date(val)
    return d.toLocaleDateString('pt-BR')
  }

  const formatarDataHora = (val) => {
    if (!val) return ''
    const d = new Date(val)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusNome = (id) => {
    const s = listaStatus.find(st => String(st.id) === String(id))
    return s ? s.nome : id || ''
  }

  const getDetalheStatusNome = (id) => {
    const d = listaDetalhes.find(dt => String(dt.id) === String(id))
    return d ? d.nome : id || ''
  }

  return (
    <div className="modal-overlay modal-detalhe-proposta" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          Histórico Proposta
        </div>

        <div className="modal-body">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '30px' }}>Carregando...</p>
          ) : (
            <>
              <div className="grid-row">
                <div className="campo col-3">
                  <label>Cpf/Cnpj:</label>
                  <input type="text" value={dados?.matricula?.cliente?.cpf || ''} readOnly />
                </div>
                <div className="campo col-6">
                  <label>Nome do Cliente:</label>
                  <input type="text" value={dados?.matricula?.cliente?.nome_completo || ''} readOnly />
                </div>
                <div className="campo col-3">
                  <label>Data Nascimento:</label>
                  <input type="text" value={formatarData(dados?.matricula?.cliente?.data_nascimento)} readOnly />
                </div>
              </div>

              <div className="grid-row">
                <div className="campo col-5">
                  <label>Origem:</label>
                  <input type="text" value={dados?.matricula?.convenio?.nome || ''} readOnly />
                </div>
                <div className="campo col-5">
                  <label>Produto:</label>
                  <input type="text" value={dados?.tipo_produto?.nome || ''} readOnly />
                </div>
                <div className="campo col-2">
                  <label>Tabela Finan.:</label>
                  <input type="text" value={dados?.codigo_tabela || ''} readOnly />
                </div>
              </div>

              <div className="grid-row">
                <div className="campo col-2">
                  <label>Data Base:</label>
                  <input type="text" value={formatarData(dados?.criado_em)} readOnly />
                </div>
                <div className="campo col-2">
                  <label>1º Vcto:</label>
                  <input type="text" value="" readOnly />
                </div>
                <div className="campo col-2">
                  <label>Qtd. Parc:</label>
                  <input type="text" value={dados?.numero_parcelas || ''} readOnly />
                </div>
                <div className="campo col-2">
                  <label>Vlr Prestação:</label>
                  <input type="text" value={dados?.valor_parcela ? formatarValor(dados.valor_parcela) : ''} readOnly />
                </div>
                <div className="campo col-2">
                  <label>Vlr Solicitado:</label>
                  <input type="text" value={dados?.valor_liberado ? formatarValor(dados.valor_liberado) : ''} readOnly />
                </div>
              </div>

              <div className="divisor-atividades">Atividades Executadas</div>

              <div className="section-header">Observações</div>
              <div className="observacoes-box">
                {historico.length === 0 ? (
                  <div style={{ color: '#666', fontStyle: 'italic' }}>Nenhum histórico registrado.</div>
                ) : (
                  historico.map((entry, index) => {
                    const d = entry.dados
                    return (
                      <div key={entry.id} style={{ marginBottom: '10px', borderBottom: '1px solid #aaa', paddingBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#3f3b6c', marginBottom: '4px' }}>
                          {formatarDataHora(entry.criado_em)} ({index + 1}º)
                          {d.usuario_nome && <span style={{ fontWeight: 'normal', color: '#666' }}> — {d.usuario_nome}</span>}
                        </div>
                        <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                          {d.codigo_tabela && <div>Cód. Tabela: {d.codigo_tabela}</div>}
                          {d.valor_parcela && <div>Valor Parcela: {d.valor_parcela}</div>}
                          {d.valor_liberado && <div>Valor Liberado: {d.valor_liberado}</div>}
                          {d.tps && <div>TPS: {d.tps}</div>}
                          {d.proposta_status_id && <div>Status: {getStatusNome(d.proposta_status_id)}</div>}
                          {d.detalhe_status_id && <div>Detalhe: {getDetalheStatusNome(d.detalhe_status_id)}</div>}
                          {d.ade_banco && <div>ADE Banco: {d.ade_banco}</div>}
                          {d.descricao && <div>Descrição: {d.descricao}</div>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="footer-actions">
                <button className="btn-fechar" onClick={onClose}>Fechar</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
