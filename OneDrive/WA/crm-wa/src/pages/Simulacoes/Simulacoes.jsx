import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { IMaskInput } from 'react-imask'
import { Upload, File, X, CheckCircle, Loader, User, Hash, FileText, Edit3 } from 'lucide-react'
import LoadingBars from '../../components/LoadingBars/LoadingBars'
import { extrairDadosCompletos, extrairTextoPDFDebug } from '../../lib/pdfParser'
import './Simulacoes.css'

const formatBRL = (val) => {
  if (val === null || val === undefined || val === '') return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

const parseBRL = (str) => {
  if (!str) return null
  const cleaned = str.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned) || null
}

const formatCPF = (val) => {
  if (!val) return ''
  const digits = val.replace(/\D/g, '')
  if (digits.length !== 11) return val
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export default function Simulacoes() {
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [convenios, setConvenios] = useState([])
  const [convenio, setConvenio] = useState('')
  const [inssId, setInssId] = useState(null)
  const [siapeServidorId, setSiapeServidorId] = useState(null)
  const [siapePensionistaId, setSiapePensionistaId] = useState(null)
  const [cpf, setCpf] = useState('')
  const [ddd, setDdd] = useState('')
  const [telefone, setTelefone] = useState('')
  const [arquivosPorTipo, setArquivosPorTipo] = useState({})
  const [extraindo, setExtraindo] = useState(false)
  const [dadosCliente, setDadosCliente] = useState(null)
  const [cpfDivergente, setCpfDivergente] = useState(false)
  const [matriculaInvalida, setMatriculaInvalida] = useState(false)
  const fileRefs = useRef({})

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('convenio')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome')
      if (data) {
        const filtrados = data.filter(c => c.nome.toUpperCase() !== 'CLT')
        setConvenios(filtrados)
        for (const c of filtrados) {
          const nome = c.nome.toUpperCase()
          if (nome.includes('INSS')) setInssId(String(c.id))
          if (nome.includes('SERVIDOR')) setSiapeServidorId(String(c.id))
          if (nome.includes('PENSIONISTA')) setSiapePensionistaId(String(c.id))
        }
      }
      setLoading(false)
    }
    carregar()
  }, [])

  function tiposArquivoPorConvenio() {
    if (convenio === siapeServidorId || convenio === siapePensionistaId) {
      return [
        { id: 'extrato_consignacao', label: 'Extrato de Consignação' },
        { id: 'contracheque', label: 'Contracheque' },
      ]
    }
    if (convenio === inssId) {
      return [
        { id: 'historico_emprestimo', label: 'Histórico de Empréstimo - Hiscon' },
      ]
    }
    return []
  }

  const tipos = tiposArquivoPorConvenio()
  const temArquivos = tipos.length > 0
  const cpfCompleto = cpf.replace(/\D/g, '').length === 11
  const dddCompleto = ddd.length === 2
  const telCompleto = telefone.replace(/\D/g, '').length === 9
  const arquivosPreenchidos = !temArquivos || tipos.filter(t => t.id !== 'contracheque').every(t => (arquivosPorTipo[t.id] || []).length > 0)

  const cpfDisabled = !convenio
  const dddDisabled = !convenio || !cpfCompleto
  const telDisabled = !convenio || !cpfCompleto || !dddCompleto
  const arquivosDisabled = !convenio || !cpfCompleto || !dddCompleto || !telCompleto

  const podeCadastrar = convenio && cpfCompleto && dddCompleto && telCompleto && arquivosPreenchidos && !cpfDivergente && !matriculaInvalida

  function handleFileSelect(tipo, e) {
    const files = Array.from(e.target.files)
    setArquivosPorTipo(prev => ({
      ...prev,
      [tipo]: files,
    }))
    e.target.value = ''

    const todosArquivos = Object.values({ ...arquivosPorTipo, [tipo]: files }).flat()
    if (todosArquivos.length > 0 && convenio) {
      extrairDados(todosArquivos)
    }
  }

  async function extrairDados(arquivos) {
    if (!convenio) return
    setExtraindo(true)
    try {
      const dados = await extrairDadosCompletos(arquivos, convenio, inssId)
      const temDados = dados.informacoesPessoais.nome
        || dados.matriculas.length > 0
        || dados.contratos.length > 0
      if (!temDados && arquivos.length > 0) {
        const texto = await extrairTextoPDFDebug(arquivos[0])
        alert(
          'Não foi possível extrair dados automaticamente deste PDF.\n\n'
          + 'O texto detectado foi:\n\n'
          + texto.slice(0, 1500)
          + '\n\n(ver console para texto completo)'
        )
      }
      const cpfDigitado = cpf.replace(/\D/g, '')
      const cpfExtraido = (dados.informacoesPessoais.cpf || '').replace(/\D/g, '')
      if (cpfDigitado && cpfExtraido && cpfDigitado !== cpfExtraido) {
        setCpfDivergente(true)
        setArquivosPorTipo({})
        setDadosCliente(null)
        return
      }
      setCpfDivergente(false)

      const ehSiape = convenio === siapeServidorId || convenio === siapePensionistaId
      const ehInss = convenio === inssId
      const ehPensionista = convenio === siapePensionistaId
      const maxDigitos = ehInss ? 10 : ehPensionista ? 8 : 7
      const matriculas = dados.matriculas || []
      let matriculaErro = false
      for (const mat of matriculas) {
        if (!mat.matricula) continue
        const digits = mat.matricula.replace(/\D/g, '')
        if (digits.length > maxDigitos) {
          matriculaErro = true
          break
        }
        if ((ehSiape || ehInss) && digits.length > 0) {
          mat.matricula = digits.padStart(maxDigitos, '0')
        }
      }
      if (matriculaErro) {
        setMatriculaInvalida(true)
        setArquivosPorTipo({})
        setDadosCliente(null)
        return
      }
      setMatriculaInvalida(false)
      setDadosCliente(dados)
    } catch (err) {
      console.error('Erro ao extrair dados:', err)
      alert('Erro ao ler o PDF: ' + err.message)
    } finally {
      setExtraindo(false)
    }
  }

  function removerArquivo(tipo, index) {
    const novosArquivos = (arquivosPorTipo[tipo] || []).filter((_, i) => i !== index)
    const arquivosAtualizados = { ...arquivosPorTipo, [tipo]: novosArquivos }
    setArquivosPorTipo(arquivosAtualizados)

    const todosArquivos = Object.values(arquivosAtualizados).flat()
    if (todosArquivos.length > 0 && convenio) {
      extrairDados(todosArquivos)
    } else {
      setDadosCliente(null)
      setCpfDivergente(false)
      setMatriculaInvalida(false)
    }
  }

  function formatarTamanho(bytes) {
    if (!bytes) return '-'
    const kb = bytes / 1024
    if (kb < 1024) return kb.toFixed(1) + ' KB'
    return (kb / 1024).toFixed(1) + ' MB'
  }

  async function handleCadastrar() {
    if (!podeCadastrar) return
    setSalvando(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: usuario } = await supabase
        .from('usuario')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      if (!usuario) throw new Error('Usuário não encontrado')

      const cpfLimpo = cpf.replace(/\D/g, '')

      const { data: solicitacao, error: errInsert } = await supabase
        .from('solicitacao_simulacao')
        .insert([{
          usuario_id: usuario.id,
          convenio_id: Number(convenio),
          cpf: cpfLimpo,
          ddd,
          telefone: telefone.replace(/\D/g, ''),
          status_id: 3,
        }])
        .select()
        .single()

      if (errInsert) throw errInsert

      for (const tipo of tipos) {
        const arquivos = arquivosPorTipo[tipo.id] || []
        for (const file of arquivos) {
          const ext = file.name.split('.').pop()
          const storagePath = `simulacao/${solicitacao.id}/${tipo.id}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('simulacoes-arquivos')
            .upload(storagePath, file)

          if (uploadError) throw uploadError

          const { error: dbError } = await supabase
            .from('solicitacao_simulacao_arquivo')
            .insert([{
              solicitacao_id: solicitacao.id,
              tipo: tipo.id,
              nome_arquivo: file.name,
              storage_path: storagePath,
              tamanho_bytes: file.size,
              mime_type: file.type,
            }])

          if (dbError) throw dbError
        }
      }

      if (dadosCliente) {
        const telefoneCompleto = ddd && telefone
          ? `(${ddd}) ${telefone.replace(/\D/g, '').slice(0, 5)}-${telefone.replace(/\D/g, '').slice(5)}`
          : null

        let primeiraMatriculaId = null

        for (const mat of dadosCliente.matriculas) {
          if (!mat.matricula && !mat.orgao) continue

          const { data: matInsert, error: matErr } = await supabase
            .from('matricula_simulacao')
            .insert([{
              solicitacao_id: solicitacao.id,
              matricula: mat.matricula,
              margem: mat.margem,
              orgao: mat.orgao,
              situacao: mat.situacao,
            }])
            .select()
            .single()

          if (matErr) throw matErr

          if (primeiraMatriculaId === null) {
            primeiraMatriculaId = matInsert.id
          }

          if (dadosCliente.informacoesPessoais.nome || dadosCliente.informacoesPessoais.cpf) {
            const { error: infoErr } = await supabase
              .from('informacoes_pessoais_simulacao')
              .insert([{
                matricula_simulacao_id: matInsert.id,
                solicitacao_id: solicitacao.id,
                nome: dadosCliente.informacoesPessoais.nome,
                cpf: dadosCliente.informacoesPessoais.cpf || cpfLimpo,
                telefone: telefoneCompleto,
              }])

            if (infoErr) throw infoErr
          }
        }

        if (primeiraMatriculaId) {
          for (const ct of dadosCliente.contratos) {
            if (ct.valor_parcela || ct.linha_emprestimo) {
              const { error: ctErr } = await supabase
                .from('contratos_simulacao')
                .insert([{
                  matricula_simulacao_id: primeiraMatriculaId,
                  solicitacao_id: solicitacao.id,
                  linha_emprestimo: ct.linha_emprestimo || null,
                  valor_parcela: ct.valor_parcela,
                  prazo_restante: ct.prazo_restante,
                }])

              if (ctErr) throw ctErr
            }
          }
        }
      }

      setConcluido(true)
    } catch (err) {
      console.error('Erro ao cadastrar simulação:', err)
      alert('Erro ao cadastrar: ' + err.message)
    } finally {
      setSalvando(false)
    }
  }

  function resetarFormulario() {
    setConvenio('')
    setCpf('')
    setDdd('')
    setTelefone('')
    setArquivosPorTipo({})
    setDadosCliente(null)
    setCpfDivergente(false)
    setMatriculaInvalida(false)
    setConcluido(false)
  }

  if (loading) return <LoadingBars />

  if (concluido) {
    return (
      <div className="form-container">
        <header className="form-header">
          <h1>Simulações</h1>
          <p className="header-subtitle">Simulação de propostas</p>
        </header>
        <div className="form-content" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <CheckCircle size={64} style={{ color: '#166534', marginBottom: 20 }} />
          <h2 style={{ color: '#166534', margin: '0 0 8px' }}>Solicitação enviada com sucesso!</h2>
          <p style={{ color: '#64748b', margin: '0 0 32px' }}>Sua simulação foi cadastrada e será analisada.</p>
          <button className="btn-puxar" onClick={resetarFormulario} style={{ marginTop: 0, padding: '10px 32px' }}>
            Nova Simulação
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="form-container">
      <header className="form-header">
        <h1>Simulações</h1>
        <p className="header-subtitle">Simulação de propostas</p>
      </header>

      <div className="form-content">
        <section className="form-section">
          <div className="section-title">Informações do Cliente</div>

          <div className="grid-row">
            <div className="field-group">
              <label>CONVÊNIO:<span className="required-asterisk">*</span></label>
              <select
                value={convenio}
                onChange={(e) => {
                  setConvenio(e.target.value)
                  setArquivosPorTipo({})
                  setDadosCliente(null)
                }}
                className="input-estilizado"
              >
                <option value="">Selecione o convênio</option>
                {convenios.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label>CPF:<span className="required-asterisk">*</span></label>
              <IMaskInput
                mask="000.000.000-00"
                value={cpf}
                onAccept={(value) => {
                  setCpf(value)
                  setCpfDivergente(false)
                  setMatriculaInvalida(false)
                }}
                placeholder="000.000.000-00"
                className="imask-input"
                disabled={cpfDisabled}
              />
            </div>
            <div className="field-group">
              <label>DDD:<span className="required-asterisk">*</span></label>
              <input
                type="text"
                placeholder="DDD"
                value={ddd}
                onChange={(e) => setDdd(e.target.value.replace(/\D/g, '').slice(0, 2))}
                className="input-estilizado"
                disabled={dddDisabled}
              />
            </div>
            <div className="field-group">
              <label>TELEFONE:<span className="required-asterisk">*</span></label>
              <IMaskInput
                mask="00000-0000"
                value={telefone}
                onAccept={(value) => setTelefone(value)}
                placeholder="00000-0000"
                className="imask-input"
                disabled={telDisabled}
              />
            </div>
          </div>
        </section>

        {temArquivos && (
          <section className="form-section">
            <div className="section-title">
              Arquivos de Simulação <span className="required-asterisk">*</span>
              {extraindo && <Loader size={14} className="spin" style={{ marginLeft: 8, color: '#3b82f6' }} />}
            </div>

            <div className="simulacao-tipos-container">
              {tipos.map(tipo => {
                const arquivos = arquivosPorTipo[tipo.id] || []
                return (
                  <div key={tipo.id} className="simulacao-tipo-bloco">
                    <div className="simulacao-tipo-header">
                      <span className="simulacao-tipo-label">{tipo.label}</span>
                      <input
                        type="file"
                        ref={el => fileRefs.current[tipo.id] = el}
                        onChange={(e) => handleFileSelect(tipo.id, e)}
                        style={{ display: 'none' }}
                      />
                      <button
                        className="btn-puxar"
                        onClick={() => fileRefs.current[tipo.id]?.click()}
                        disabled={arquivosDisabled}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 0, fontSize: 11, padding: '6px 14px', opacity: arquivosDisabled ? 0.5 : 1, cursor: arquivosDisabled ? 'not-allowed' : 'pointer' }}
                      >
                        <Upload size={13} />
                        Adicionar
                      </button>
                    </div>
                    {arquivos.length > 0 && (
                      <div className="simulacao-arquivos-lista" style={{ marginTop: 8 }}>
                        {arquivos.map((file, index) => (
                          <div key={index} className="simulacao-arquivo-item">
                            <File size={14} />
                            <span className="simulacao-arquivo-nome">{file.name}</span>
                            <span className="simulacao-arquivo-tamanho">{formatarTamanho(file.size)}</span>
                            <button
                              className="simulacao-arquivo-remover"
                              onClick={() => removerArquivo(tipo.id, index)}
                              title="Remover"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {arquivos.length === 0 && (
                      <p className="simulacao-tipo-vazio">{arquivosDisabled ? 'Preencha os campos anteriores primeiro.' : 'Nenhum arquivo anexado.'}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {(cpfDivergente || matriculaInvalida) && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
              {cpfDivergente ? 'CPF digitado não é o mesmo do extrato' : `Matrícula inválida — deve ter no máximo ${convenio === siapePensionistaId ? '8' : convenio === inssId ? '10' : '7'} dígitos`}
            </span>
          </div>
        )}

        {dadosCliente && (
          <section className="form-section">
            <div className="section-title">
              Dados do Cliente
              <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b', marginLeft: 8 }}>
                (extraído dos documentos)
              </span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={15} /> Informações Pessoais
              </div>
              <div className="grid-row">
                <div className="field-group">
                  <label>NOME:</label>
                  <input
                    type="text"
                    value={dadosCliente.informacoesPessoais.nome || ''}
                    className="input-estilizado"
                    disabled
                  />
                </div>
                <div className="field-group">
                  <label>CPF:</label>
                  <input
                    type="text"
                    value={formatCPF(dadosCliente.informacoesPessoais.cpf)}
                    className="input-estilizado"
                    disabled
                  />
                </div>
              </div>
            </div>

            {dadosCliente.matriculas.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Hash size={15} /> Matrículas / Margem
                </div>
                {dadosCliente.matriculas.map((mat, idx) => (
                  <div key={idx} className="grid-row" style={{ marginBottom: 8, padding: 8, background: '#f8fafc', borderRadius: 6 }}>
                    <div className="field-group">
                      <label>MATRÍCULA:</label>
                      <input type="text" value={mat.matricula || ''} className="input-estilizado" disabled />
                    </div>
                      <div className="field-group">
                        <label>MARGEM (R$):</label>
                        <input type="text" value={mat.margem != null ? formatBRL(mat.margem) : ''} className="input-estilizado" disabled />
                      </div>
                    <div className="field-group">
                      <label>{convenio === inssId ? 'BENEFÍCIO:' : 'ÓRGÃO:'}</label>
                      <input type="text" value={mat.orgao || ''} className="input-estilizado" disabled />
                    </div>
                    <div className="field-group">
                      <label>SITUAÇÃO:</label>
                      <input type="text" value={mat.situacao || ''} className="input-estilizado" disabled />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {dadosCliente.contratos.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={15} /> Contratos / Empréstimos
                </div>
                  {dadosCliente.contratos.map((ct, idx) => (
                    <div key={idx} className="grid-row" style={{ marginBottom: 8, padding: 8, background: '#f8fafc', borderRadius: 6 }}>
                      <div className="field-group" style={{ flex: 2, minWidth: 300 }}>
                        {idx === 0 && <label>LINHA EMPRÉSTIMO:</label>}
                        <input type="text" value={ct.linha_emprestimo || ''} className="input-estilizado" disabled />
                      </div>
                    <div className="field-group">
                      {idx === 0 && <label>VALOR PARCELA (R$):</label>}
                      <input type="text" value={ct.valor_parcela != null ? formatBRL(ct.valor_parcela) : ''} className="input-estilizado" disabled />
                    </div>
                    <div className="field-group" style={{ flex: 0.5, minWidth: 80 }}>
                      {idx === 0 && <label>PRAZO RES.:</label>}
                      <input type="text" value={ct.prazo_restante ?? ''} className="input-estilizado" disabled />
                    </div>
                    <div className="field-group" style={{ flex: 0.5, minWidth: 80 }}>
                      {idx === 0 && <label>PRAZO ORI.:</label>}
                      <input type="text" value={ct.prazo_original ?? ''} className="input-estilizado" disabled />
                    </div>
                    <div className="field-group" style={{ flex: 0.8, minWidth: 100 }}>
                      {idx === 0 && <label>OBS:</label>}
                      <input type="text" value={ct.obs || ''} className="input-estilizado" disabled />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="form-actions" style={{ marginTop: 32 }}>
          <button
            className="btn-primary"
            onClick={handleCadastrar}
            disabled={!podeCadastrar || salvando || extraindo}
            style={{ padding: '12px 48px', fontSize: 15 }}
          >
            {salvando ? 'Salvando...' : extraindo ? 'Extraindo dados...' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
