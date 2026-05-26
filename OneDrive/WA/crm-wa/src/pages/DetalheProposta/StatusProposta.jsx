import React, { useState, useEffect } from 'react'
import LoadingBars from '../../components/LoadingBars/LoadingBars'
import './StatusProposta.css'
import { IMaskInput } from 'react-imask'
import ModalOrgao from '../../components/ModalOrgao/ModalOrgao'
import ModalConvenio from '../../components/ModalConvenio/ModalConvenio'
import ModalBanco from '../../components/ModalBanco/ModalBanco'
import ModalBancoRecebimento from '../../components/ModalBancoRecebimento/ModalBancoRecebimento'
import ModalAnexarDocumento from '../AnexarDocumento/ModalAnexarDocumento'
import { supabase } from '../../lib/supabase'

const LOCK_TIMEOUT_MS = 5 * 60 * 1000

export default function StatusProposta({ setPaginaAtual }) {
  const [tipoOperacao, setTipoOperacao] = useState('')
  const [banco, setBanco] = useState('')
  const [tipoProduto, setTipoProduto] = useState('')
  const [tipoConvenio, setTipoConvenio] = useState('')
  const [orgao, setOrgao] = useState('')

  const [modalOrgaosAberto, setModalOrgaosAberto] = useState(false)
  const [orgaosDisponiveis, setOrgaosDisponiveis] = useState([])
  const [modalConveniosAberto, setModalConveniosAberto] = useState(false)
  const [conveniosDisponiveis, setConveniosDisponiveis] = useState([])
  const [modalBancosAberto, setModalBancosAberto] = useState(false)
  const [bancosDisponiveis, setBancosDisponiveis] = useState([])
  const [modalBancosRecebimentoAberto, setModalBancosRecebimentoAberto] = useState(false)
  const [bancosRecebimentoDisponiveis, setBancosRecebimentoDisponiveis] = useState([])
  const [tiposOperacao, setTiposOperacao] = useState([])
  const [tiposProduto, setTiposProduto] = useState([])
  const [vinculosConvenio, setVinculosConvenio] = useState([])
  const [operacoesPermitidas, setOperacoesPermitidas] = useState([])

  const [cpf, setCpf] = useState('')
  const [cpfValido, setCpfValido] = useState(null)
  const [matricula, setMatricula] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [ddd, setDdd] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cep, setCep] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [sexo, setSexo] = useState('')
  const [numDocumento, setNumDocumento] = useState('')
  const [margemCliente, setMargemCliente] = useState('')
  const [alfabetizado, setAlfabetizado] = useState('')
  const [nomeMae, setNomeMae] = useState('')
  const [email, setEmail] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [ufNaturalidade, setUfNaturalidade] = useState('')
  const [matriculaInstituidor, setMatriculaInstituidor] = useState('')
  const [matriculaValida, setMatriculaValida] = useState(null)
  const [inssId, setInssId] = useState(null)
  const [siapeServidorId, setSiapeServidorId] = useState(null)
  const [siapePensionistaId, setSiapePensionistaId] = useState(null)

  const [parcelas, setParcelas] = useState([{ id: 1, valor: '', numero: '', bancoOrigem: '', numeroContratoOrigem: '', saldoDevedor: '' }])

  const adicionarParcela = () => {
    const newId = parcelas.length > 0 ? Math.max(...parcelas.map(p => p.id)) + 1 : 1
    setParcelas([...parcelas, { id: newId, valor: '', numero: '', bancoOrigem: '', numeroContratoOrigem: '', saldoDevedor: '' }])
  }
  const removerParcela = (id) => {
    if (parcelas.length > 1) {
      setParcelas(parcelas.filter(p => p.id !== id))
    }
  }

  const [tps, setTps] = useState('')
  const [seguro, setSeguro] = useState('')
  const [valorLiberado, setValorLiberado] = useState('')
  const [valorParcelaFinal, setValorParcelaFinal] = useState('')
  const [unificarParcela, setUnificarParcela] = useState('')
  const [agregarMargem, setAgregarMargem] = useState('')
  const [valorMargemAgregada, setValorMargemAgregada] = useState('')
  const [cartaoComPlastico, setCartaoComPlastico] = useState(false)
  const [prazo, setPrazo] = useState('')
  const [margemAgregada, setMargemAgregada] = useState('')
  const [valorParcela, setValorParcela] = useState('')
  const [taxaJuros, setTaxaJuros] = useState('')
  const [codigoTabela, setCodigoTabela] = useState('')
  const [codigoTabelaOriginal, setCodigoTabelaOriginal] = useState('')
  const [naoTemCodigoTabela, setNaoTemCodigoTabela] = useState(false)
  const [tpsCorrigida, setTpsCorrigida] = useState('')
  const [descricao, setDescricao] = useState('')

  const [dadosBancarios, setDadosBancarios] = useState({
    banco: '',
    agencia: '',
    numeroConta: '',
    digitoVerificador: '',
    tipoConta: ''
  })

  const [cadastroPuxado, setCadastroPuxado] = useState(false)
  const [loadingCadastro, setLoadingCadastro] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' })
  const [usuarioId, setUsuarioId] = useState(null)

  const [parcelasRefin, setParcelasRefin] = useState([{ id: 1, valor: '' }])
  const [valorLiberadoRefin, setValorLiberadoRefin] = useState('')
  const [numParcelasRefin, setNumParcelasRefin] = useState('')
  const [taxaJurosRefin, setTaxaJurosRefin] = useState('')
  const [tpsRefin, setTpsRefin] = useState('')
  const [seguroRefin, setSeguroRefin] = useState('')
  const [parcelaFinal, setParcelaFinal] = useState('')

  const [valorRealLiberado, setValorRealLiberado] = useState('')
  const [numeroParcelasReal, setNumeroParcelasReal] = useState('')
  const [parcelaReal, setParcelaReal] = useState('')
  const [propostaStatusId, setPropostaStatusId] = useState('')
  const [propostaStatusIdOriginal, setPropostaStatusIdOriginal] = useState('')
  const [listaStatus, setListaStatus] = useState([])
  const [adeBanco, setAdeBanco] = useState('')
  const [adeBancoOriginal, setAdeBancoOriginal] = useState('')
  const [naoTemAde, setNaoTemAde] = useState(false)
  const [modalRedigitarAberto, setModalRedigitarAberto] = useState(false)
  const [bancoRedigitar, setBancoRedigitar] = useState('')
  const [modalRedigirSucesso, setModalRedigirSucesso] = useState(false)
  const [detalheStatusId, setDetalheStatusId] = useState('')
  const [detalhesStatus, setDetalhesStatus] = useState([])

  const [abaAtiva, setAbaAtiva] = useState('dados')
  const [documentos, setDocumentos] = useState([])
  const [modalAnexarOpen, setModalAnexarOpen] = useState(false)
  const [documentoSelecionado, setDocumentoSelecionado] = useState(null)
  const [modalConfirmarDelete, setModalConfirmarDelete] = useState(false)
  const [modalSucesso, setModalSucesso] = useState(false)
  const [lockError, setLockError] = useState('')

  const TIPOS_DOCUMENTO = [
    { id: 'identidade', label: 'Documento de identidade' },
    { id: 'comprovante_residencia', label: 'Comprovante de residência' },
    { id: 'comprovante_renda', label: 'Contracheque' },
    { id: 'extrato_inss', label: 'Extrato consignado - Hiscon INSS' },
    { id: 'contrato', label: 'Contrato' },
    { id: 'contrato_assinado', label: 'Contrato assinado' },
    { id: 'recalculo', label: 'Recalculo' },
  ]
  const [tipoDocSelecionado, setTipoDocSelecionado] = useState('')

  const [prazoRestPosPort, setPrazoRestPosPort] = useState('')
  const [valorParcelaPosPort, setValorParcelaPosPort] = useState('')
  const [margemLiberadaPosPort, setMargemLiberadaPosPort] = useState('')
  const [saldoDevedorPosPort, setSaldoDevedorPosPort] = useState('')
  const [margemLiberadaRealPosPort, setMargemLiberadaRealPosPort] = useState('')
  const [parcelasPrePort, setParcelasPrePort] = useState([{ id: 1, codBanco: '', nomeBanco: '', numeroContrato: '', prazoRest: '', valorParcela: '', saldoDevedor: '' }])

  const adicionarParcelaRefin = () => {
    const newId = parcelasRefin.length > 0 ? Math.max(...parcelasRefin.map(p => p.id)) + 1 : 1
    setParcelasRefin([...parcelasRefin, { id: newId, valor: '' }])
  }
  const removerParcelaRefin = (id) => {
    if (parcelasRefin.length > 1) {
      setParcelasRefin(parcelasRefin.filter(p => p.id !== id))
    }
  }
  const atualizarParcelaRefin = (id, valor) => {
    setParcelasRefin(parcelasRefin.map(p => p.id === id ? { ...p, valor } : p))
  }

  const adicionarParcelaPrePort = () => {
    const newId = parcelasPrePort.length > 0 ? Math.max(...parcelasPrePort.map(p => p.id)) + 1 : 1
    setParcelasPrePort([...parcelasPrePort, { id: newId, codBanco: '', nomeBanco: '', numeroContrato: '', prazoRest: '', valorParcela: '', saldoDevedor: '' }])
  }
  const removerParcelaPrePort = (id) => {
    if (parcelasPrePort.length > 1) {
      setParcelasPrePort(parcelasPrePort.filter(p => p.id !== id))
    }
  }
  const atualizarParcelaPrePort = (id, campo, valor) => {
    setParcelasPrePort(parcelasPrePort.map(p => p.id === id ? { ...p, [campo]: valor } : p))
  }

  const [saldoDevedorRefin, setSaldoDevedorRefin] = useState('')
  const [valorNovoEmprestimo, setValorNovoEmprestimo] = useState('')
  const [motivoRefin, setMotivoRefin] = useState('')
  const [cartaoComCompras, setCartaoComCompras] = useState(false)
  const [valorComprasCartao, setValorComprasCartao] = useState('')
  const [valorSaqueCartao, setValorSaqueCartao] = useState('')

  async function adquirirLock(propostaId) {
    const usuarioId = localStorage.getItem('usuario_id_crmwa')
    if (!usuarioId) return false

    const { data: lockExistente } = await supabase
      .from('proposta_lock')
      .select('*')
      .eq('proposta_id', propostaId)
      .single()

    if (lockExistente) {
      const lockAge = new Date() - new Date(lockExistente.locked_at)
      if (lockExistente.usuario_id !== parseInt(usuarioId) && lockAge < LOCK_TIMEOUT_MS) {
        const { data: usuario } = await supabase
          .from('usuario')
          .select('nome')
          .eq('id', lockExistente.usuario_id)
          .single()
        setLockError(`Proposta sendo editada por ${usuario?.nome || 'outro usuário'}`)
        return false
      }
    }

    const { error } = await supabase
      .from('proposta_lock')
      .upsert(
        { proposta_id: propostaId, usuario_id: usuarioId },
        { onConflict: 'proposta_id' }
      )

    return !error
  }

  async function liberarLock(propostaId) {
    const usuarioId = localStorage.getItem('usuario_id_crmwa')
    if (!usuarioId) return
    await supabase
      .from('proposta_lock')
      .delete()
      .eq('proposta_id', propostaId)
      .eq('usuario_id', usuarioId)
  }

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        const [bancosRes, bancosRecebimentoRes, conveniosRes, operacoesRes, produtosRes, usuarioRes, statusRes] = await Promise.all([
          supabase.from('banco_operacao').select('id, codigo, nome').eq('ativo', true).order('nome'),
          supabase.from('banco_recebimento').select('id, codigo, nome').eq('ativo', true).order('codigo'),
          supabase.from('convenio').select('id, nome').eq('ativo', true).order('nome'),
          supabase.from('tipo_operacao').select('id, nome').eq('ativo', true).order('nome'),
          supabase.from('tipo_produto').select('id, nome, tipo_operacao_id').eq('ativo', true),
          supabase.from('usuario').select('id').limit(1),
          supabase.from('proposta_status').select('id, nome, historico').order('id')
        ])

        if (bancosRes.data) setBancosDisponiveis(bancosRes.data)
        if (bancosRecebimentoRes.data) setBancosRecebimentoDisponiveis(bancosRecebimentoRes.data)
        if (conveniosRes.data) {
          setConveniosDisponiveis(conveniosRes.data)
          for (const c of conveniosRes.data) {
            const nome = c.nome.toUpperCase()
            if (nome.includes('INSS')) setInssId(String(c.id))
            if (nome.includes('SERVIDOR')) setSiapeServidorId(String(c.id))
            if (nome.includes('PENSIONISTA')) setSiapePensionistaId(String(c.id))
          }
        }
        if (operacoesRes.data) setTiposOperacao(operacoesRes.data)
        if (produtosRes.data) setTiposProduto(produtosRes.data)
        if (usuarioRes.data && usuarioRes.data.length > 0) setUsuarioId(usuarioRes.data[0].id)
        if (statusRes.data) setListaStatus(statusRes.data)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }
    carregarDadosIniciais()
  }, [])

  useEffect(() => {
    async function carregarOperacoesPermitidas() {
      if (!banco) {
        setOperacoesPermitidas([])
        return
      }
      try {
        const { data: bancoData, error: bancoError } = await supabase
          .from('banco_operacao')
          .select('id')
          .eq('id', banco)
          .single()

        if (bancoError || !bancoData) {
          setOperacoesPermitidas([])
          return
        }

        const { data: permissoes, error: permissoesError } = await supabase
          .from('banco_tipo_operacao')
          .select('tipo_operacao_id')
          .eq('banco_id', bancoData.id)

        if (permissoesError) {
          setOperacoesPermitidas([])
          return
        }

        if (!permissoes || permissoes.length === 0) {
          setOperacoesPermitidas([])
          return
        }

        const allowedIds = permissoes.map(p => p.tipo_operacao_id)
        const operacoesFiltradas = tiposOperacao.filter(op => allowedIds.includes(op.id))

        const ordemNomes = ['EMPRESTIMO NOVO', 'REFINANCIAMENTO', 'PORTABILIDADE', 'CARTÃO NOVO', 'SAQUE COMPLEMENTAR']
        const ordenadas = ordemNomes
          .map(nome => operacoesFiltradas.find(op => op.nome.toUpperCase() === nome.toUpperCase()))
          .filter(Boolean)

        setOperacoesPermitidas(ordenadas)
      } catch (error) {
        console.error('Erro ao carregar operações permitidas:', error)
        setOperacoesPermitidas([])
      }
    }
    carregarOperacoesPermitidas()
  }, [banco, tiposOperacao])

  useEffect(() => {
    async function carregarVinculos() {
      if (!tipoConvenio) {
        setVinculosConvenio([])
        return
      }
      try {
        const { data, error } = await supabase
          .from('vinculo_convenio')
          .select('id, codigo, nome')
          .eq('convenio_id', parseInt(tipoConvenio))
          .eq('ativo', true)
          .order('nome')

        if (error) {
          setVinculosConvenio([])
          return
        }

        if (data) setVinculosConvenio(data)
      } catch (error) {
        setVinculosConvenio([])
      }
    }
    carregarVinculos()
  }, [tipoConvenio])

  useEffect(() => {
    if (tipoConvenio !== siapePensionistaId) {
      setMatriculaInstituidor('')
    }
  }, [tipoConvenio])

  useEffect(() => {
    const totalParcelas = parcelas.reduce((soma, p) => {
      const val = parseFloat(p.valor?.toString().replace(/\./g, '').replace(',', '.')) || 0
      return soma + val
    }, 0)
    const marg = parseFloat(margemAgregada?.toString().replace(/\./g, '').replace(',', '.')) || 0
    const margemPort = agregarMargem === 'sim' ? (parseFloat(valorMargemAgregada?.toString().replace(/\./g, '').replace(',', '.')) || 0) : 0
    const total = totalParcelas + marg + margemPort
    setValorParcelaFinal(total > 0 ? total.toFixed(2).replace('.', ',') : '')
  }, [parcelas, margemAgregada, valorMargemAgregada, agregarMargem])

  useEffect(() => {
    try {
      const somaParcelas = parcelasRefin.reduce((acc, parcela) => {
        if (!parcela.valor || parcela.valor === '') return acc
        const numValor = typeof parcela.valor === 'number' ? parcela.valor : parseFloat(parcela.valor.replace(/[^\d,]/g, '').replace(',', '.'))
        return acc + (isNaN(numValor) ? 0 : numValor)
      }, 0)

      let numMargem = 0
      if (valorMargemAgregada && typeof valorMargemAgregada === 'number') {
        numMargem = valorMargemAgregada
      } else if (typeof valorMargemAgregada === 'string') {
        numMargem = parseFloat(valorMargemAgregada.replace(/[^\d,]/g, '').replace(',', '.'))
        if (isNaN(numMargem)) numMargem = 0
      }

      const total = somaParcelas + numMargem
      if (total > 0) {
        setParcelaFinal(total.toFixed(2).replace('.', ','))
      } else {
        setParcelaFinal('')
      }
    } catch (e) {
      console.error('Erro ao calcular parcela final:', e)
      setParcelaFinal('')
    }
  }, [parcelasRefin, valorMargemAgregada])

  useEffect(() => {
    if (!propostaStatusId) { setDetalhesStatus([]); return }
    supabase
      .from('detalhe_status')
      .select('*')
      .eq('proposta_status_id', parseInt(propostaStatusId))
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => setDetalhesStatus(data || []))
  }, [propostaStatusId])

  async function carregarValoresReais() {
    setValorRealLiberado('')
    setNumeroParcelasReal('')
    setParcelaReal('')
  }

  const salvarValoresReais = async () => {
    try {
      if (!codigoTabela && !naoTemCodigoTabela) {
        setMensagem({ tipo: 'erro', texto: 'Informe o CÓDIGO DA TABELA ou marque "Não tem Código da Tabela".' })
        return
      }
      if (!adeBanco && !naoTemAde) {
        setMensagem({ tipo: 'erro', texto: 'Informe o ADE BANCO ou marque "Não tem ADE".' })
        return
      }
      const propostaStr = localStorage.getItem('propostaSelecionada_crmwa')
      if (!propostaStr) return
      const proposta = JSON.parse(propostaStr)
      if (!proposta.id) return

      const nomeUsuario = localStorage.getItem('usuario_nome_crmwa') || ''
      const dadosHistorico = {
        codigo_tabela: codigoTabela || null,
        valor_parcela: parcelaReal || null,
        valor_liberado: valorRealLiberado || null,
        tps: tpsCorrigida || null,
        proposta_status_id: propostaStatusId ? parseInt(propostaStatusId) : null,
        ade_banco: adeBanco || null,
        descricao: descricao || null,
        detalhe_status_id: detalheStatusId ? parseInt(detalheStatusId) : null,
        usuario_nome: nomeUsuario
      }

      const { error: insertError } = await supabase
        .from('proposta_historico')
        .insert({ proposta_id: proposta.id, dados: dadosHistorico })

      if (insertError) throw insertError

      const { data: propostaAtual } = await supabase
        .from('proposta')
        .select('dados_simulacao')
        .eq('id', proposta.id)
        .single()

      const existing = propostaAtual?.dados_simulacao || {}
      const { error } = await supabase
        .from('proposta')
        .update({
          valor_liberado: valorRealLiberado ? parseFloat(valorRealLiberado.replace(/[^\d,]/g, '').replace(',', '.')) : undefined,
          numero_parcelas: numeroParcelasReal ? parseInt(numeroParcelasReal) : undefined,
          valor_parcela: parcelaReal ? parseFloat(parcelaReal.replace(/[^\d,]/g, '').replace(',', '.')) : undefined,
          tps: tpsCorrigida ? parseFloat(tpsCorrigida.replace(/[^\d,]/g, '').replace(',', '.')) : undefined,
          codigo_tabela: codigoTabela || null,
          numero_proposta_banco: adeBanco || null,
          proposta_status_id: propostaStatusId ? parseInt(propostaStatusId) : null,
          dados_simulacao: { ...existing, descricao_sidebar: descricao || null }
        })
        .eq('id', proposta.id)
      if (error) throw error

      if (valorRealLiberado) {
        const vl = parseFloat(valorRealLiberado.replace(/[^\d,]/g, '').replace(',', '.'))
        if (vl > 0) {
          const { data: parcelas } = await supabase
            .from('proposta_parcela')
            .select('id')
            .eq('proposta_id', proposta.id)
          if (parcelas && parcelas.length > 0) {
            const trocoPorParcela = vl / parcelas.length
            for (const p of parcelas) {
              await supabase
                .from('proposta_parcela')
                .update({ troco: trocoPorParcela })
                .eq('id', p.id)
            }
          }
        }
      }

      setPropostaStatusIdOriginal(propostaStatusId)
      if (tpsCorrigida) {
        setTps(tpsCorrigida)
        setTpsCorrigida('')
      }
      setModalSucesso(true)
      liberarLock(proposta.id)
    } catch (error) {
      console.error('Erro ao salvar Valores Reais:', error)
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar: ' + error.message })
    }
  }

  async function carregarPropostaCompleta(propostaId) {
    try {
      setLoadingData(true)

      const { data: proposta, error: erroProposta } = await supabase
        .from('proposta')
        .select('*')
        .eq('id', propostaId)
        .single()

      if (erroProposta) throw erroProposta
      if (!proposta) return

      const { data: parcelasDb } = await supabase
        .from('proposta_parcela')
        .select('*')
        .eq('proposta_id', propostaId)
        .order('indice', { ascending: true })

      setBanco(String(proposta.banco_credor_id))
      setTipoOperacao(String(proposta.tipo_operacao_id))
      setTipoProduto(String(proposta.tipo_produto_id))

      if (proposta.dados_bancarios_id) {
        const { data: db } = await supabase
          .from('dados_bancarios')
          .select('*')
          .eq('id', proposta.dados_bancarios_id)
          .single()

        if (db) {
          setDadosBancarios({
            banco: String(db.banco_recebimento_id || ''),
            agencia: db.agencia || '',
            numeroConta: db.numero_conta || '',
            digitoVerificador: db.digito || '',
            tipoConta: db.tipo_conta || ''
          })
        }
      }

      if (proposta.matricula_id) {
        const { data: mat } = await supabase
          .from('matricula')
          .select('*, cliente (*)')
          .eq('id', proposta.matricula_id)
          .single()

        if (mat) {
          setMatricula(mat.numero_matricula || '')
          setMargemCliente(mat.margem_disponivel?.toFixed(2).replace('.', ',') || '')
          setMatriculaInstituidor(mat.matricula_instituidor || '')
          if (mat.convenio_id) setTipoConvenio(String(mat.convenio_id))
          if (mat.vinculo_convenio_id) setOrgao(String(mat.vinculo_convenio_id))

          const cli = mat.cliente
          if (cli) {
            setNomeCompleto(cli.nome_completo || '')
            setCpf(cli.cpf || '')
            setCpfValido(cli.cpf ? validarCPF(cli.cpf) : null)
            setSexo(cli.sexo || '')
            setDataNascimento(cli.data_nascimento || '')
            setNomeMae(cli.nome_mae || '')
            setUfNaturalidade(cli.uf_nae || '')
            setNumDocumento(cli.numero_documento || '')
            setAlfabetizado(cli.cliente_alfabetizado ? 'sim' : 'nao')
            setDdd(cli.ddd || '')
            setTelefone(cli.telefone || '')
            setEmail(cli.email || '')
          }

          if (mat.cliente_id) {
            const { data: enderecos } = await supabase
              .from('endereco')
              .select('*')
              .eq('cliente_id', mat.cliente_id)
              .limit(1)

            if (enderecos && enderecos[0]) {
              const end = enderecos[0]
              setCep(end.cep || '')
              setLogradouro(end.logradouro || '')
              setNumero(end.numero || '')
              setComplemento(end.complemento || '')
              setBairro(end.bairro || '')
              setCidade(end.cidade || '')
              setEstado(end.estado || '')
            }
          }
        }
      }

      setCadastroPuxado(true)

      if (proposta.valor_parcela) {
        setValorParcela(proposta.valor_parcela.toFixed(2).replace('.', ','))
      }
      if (proposta.numero_parcelas) {
        const num = proposta.numero_parcelas.toString()
        setPrazo(num)
        setNumParcelasRefin(num)
      }
      if (proposta.taxa_juros) {
        setTaxaJuros(proposta.taxa_juros.toFixed(2).replace('.', ','))
        setTaxaJurosRefin(proposta.taxa_juros.toFixed(2).replace('.', ','))
      }
      if (proposta.tps) {
        setTps(proposta.tps.toFixed(2).replace('.', ','))
        setTpsRefin(proposta.tps.toFixed(2).replace('.', ','))
      }
      setSeguro(proposta.seguro > 0 ? 'sim' : 'nao')
      setSeguroRefin(proposta.seguro > 0 ? 'sim' : 'nao')
      if (proposta.valor_liberado) {
        setValorLiberado(proposta.valor_liberado.toFixed(2).replace('.', ','))
        setValorLiberadoRefin(proposta.valor_liberado.toFixed(2).replace('.', ','))
      }
      if (proposta.codigo_tabela) { setCodigoTabela(proposta.codigo_tabela); setCodigoTabelaOriginal(proposta.codigo_tabela) } else { setNaoTemCodigoTabela(true) }
      if (proposta.numero_proposta_banco) { setAdeBanco(proposta.numero_proposta_banco); setAdeBancoOriginal(proposta.numero_proposta_banco) } else { setNaoTemAde(true) }

      if (parcelasDb && parcelasDb.length > 0) {
        const arr = parcelasDb.map(p => ({
          id: p.indice + 1,
          valor: p.valor ? p.valor.toFixed(2).replace('.', ',') : '',
          numero: p.prazo_restante ? p.prazo_restante + 'x' : '',
          bancoOrigem: p.banco_codigo || '',
          numeroContratoOrigem: p.numero_contrato || '',
          saldoDevedor: p.saldo_devedor ? p.saldo_devedor.toFixed(2).replace('.', ',') : '',
          troco: p.troco ? p.troco.toFixed(2).replace('.', ',') : ''
        }))
        setParcelas(arr)
        setParcelasRefin(arr.map(p => ({ id: p.id, valor: p.valor })))

        if (String(proposta.tipo_operacao_id) === '3') {
          setParcelasPrePort(arr.map(p => ({
            id: p.id,
            codBanco: p.bancoOrigem,
            nomeBanco: '',
            numeroContrato: p.numeroContratoOrigem,
            prazoRest: p.numero.replace('x', ''),
            valorParcela: p.valor,
            saldoDevedor: p.saldoDevedor
          })))
        }
      }

      const ds = proposta.dados_simulacao
      if (ds && String(proposta.tipo_operacao_id) === '2') {
        if (ds.saldo_devedor_refin) setSaldoDevedorRefin(ds.saldo_devedor_refin.toFixed(2).replace('.', ','))
        if (ds.valor_novo_emprestimo) setValorNovoEmprestimo(ds.valor_novo_emprestimo.toFixed(2).replace('.', ','))
        if (ds.motivo_refin) setMotivoRefin(ds.motivo_refin)
        if (ds.valor_margem_agregada) setValorMargemAgregada(ds.valor_margem_agregada.toFixed(2).replace('.', ','))
        if (ds.parcela_final) setParcelaFinal(ds.parcela_final.toFixed(2).replace('.', ','))
        if (ds.margem_agregada) setMargemAgregada(ds.margem_agregada.toFixed(2).replace('.', ','))
        if (ds.unificar_parcela) setUnificarParcela(ds.unificar_parcela ? 'sim' : '')
        if (ds.agregar_margem) setAgregarMargem(ds.agregar_margem ? 'sim' : '')
      }

      if (proposta.proposta_status_id) { setPropostaStatusId(String(proposta.proposta_status_id)); setPropostaStatusIdOriginal(String(proposta.proposta_status_id)) }
      setDetalheStatusId('')

      await carregarValoresReais()
    } catch (error) {
      console.error('Erro ao carregar proposta:', error)
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar proposta: ' + error.message })
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    const propostaStr = localStorage.getItem('propostaSelecionada_crmwa')
    if (propostaStr) {
      const dados = JSON.parse(propostaStr)
      if (dados.id) {
        carregarPropostaCompleta(dados.id)
        adquirirLock(dados.id)
      } else {
        setMensagem({ tipo: 'erro', texto: 'ID da proposta não encontrado' })
        setLoadingData(false)
      }
    } else {
      setMensagem({ tipo: 'erro', texto: 'Nenhuma proposta selecionada' })
      setLoadingData(false)
    }

    return () => {
      const propostaStr = localStorage.getItem('propostaSelecionada_crmwa')
      if (propostaStr) {
        const dados = JSON.parse(propostaStr)
        if (dados.id) liberarLock(dados.id)
      }
    }
  }, [])

  async function carregarDocumentos(propostaId) {
    try {
      const { data, error } = await supabase
        .from('documento_proposta')
        .select('*')
        .eq('proposta_id', propostaId)
        .order('criado_em', { ascending: false })
      if (error) throw error
      setDocumentos(data || [])
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    }
  }

  async function redigitarProposta() {
    try {
      if (!bancoRedigitar) {
        setMensagem({ tipo: 'erro', texto: 'Selecione um banco para redigitar.' })
        return
      }

      const propostaStr = localStorage.getItem('propostaSelecionada_crmwa')
      if (!propostaStr) { setMensagem({ tipo: 'erro', texto: 'Proposta não encontrada.' }); return }
      const proposta = JSON.parse(propostaStr)
      if (!proposta.id) { setMensagem({ tipo: 'erro', texto: 'ID da proposta não encontrado.' }); return }

      setMensagem({ tipo: 'sucesso', texto: 'Redigitando proposta...' })

      const normalizar = (nome) => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      const statusAguardando = listaStatus.find(s => normalizar(s.nome).includes('aguardando digitacao'))

      if (!statusAguardando) {
        setMensagem({ tipo: 'erro', texto: 'Status "Aguardando Digitação" não encontrado.' })
        return
      }

      // 1. Buscar dados da original
      const { data: original } = await supabase
        .from('proposta')
        .select('*')
        .eq('id', proposta.id)
        .single()

      if (!original) return

      const { data: parcelasOrig } = await supabase
        .from('proposta_parcela')
        .select('*')
        .eq('proposta_id', proposta.id)

      // 3. Criar nova proposta clonada
      const novaProposta = {
        banco_credor_id: parseInt(bancoRedigitar),
        dados_bancarios_id: original.dados_bancarios_id,
        matricula_id: original.matricula_id,
        tipo_operacao_id: original.tipo_operacao_id,
        tipo_produto_id: original.tipo_produto_id,
        usuario_digitador_id: original.usuario_digitador_id,
        proposta_status_id: statusAguardando.id,
        valor_parcela: original.valor_parcela,
        numero_parcelas: original.numero_parcelas,
        taxa_juros: original.taxa_juros,
        tps: original.tps,
        seguro: original.seguro,
        valor_liberado: original.valor_liberado,
        codigo_tabela: original.codigo_tabela,
        numero_proposta_banco: null,
        dados_simulacao: original.dados_simulacao
      }

      const { data: inserida, error } = await supabase
        .from('proposta')
        .insert([novaProposta])
        .select()
        .single()

      if (error) throw error

      // Registrar log na nova proposta
      const nomeUsuarioRedig = localStorage.getItem('usuario_nome_crmwa') || ''
      await supabase.from('proposta_historico').insert({
        proposta_id: inserida.id,
        dados: { acao: `Proposta clonada da ID WA: ${proposta.id}`, banco_redigitado: parseInt(bancoRedigitar), proposta_status_id: statusAguardando.id, usuario_nome: nomeUsuarioRedig }
      })

      if (parcelasOrig && parcelasOrig.length > 0) {
        const novasParcelas = parcelasOrig.map(p => ({
          proposta_id: inserida.id,
          tipo: p.tipo,
          indice: p.indice,
          valor: p.valor,
          saldo_devedor: p.saldo_devedor,
          prazo_restante: p.prazo_restante,
          banco_codigo: p.banco_codigo,
          banco_nome: p.banco_nome,
          numero_contrato: p.numero_contrato,
          troco: p.troco
        }))
        const { error: erroParcelas } = await supabase
          .from('proposta_parcela')
          .insert(novasParcelas)
        if (erroParcelas) throw erroParcelas
      }

      setModalRedigitarAberto(false)
      setBancoRedigitar('')
      setModalRedigirSucesso(true)
    } catch (error) {
      console.error('Erro ao redigitar:', error)
      setMensagem({ tipo: 'erro', texto: 'Erro ao redigitar: ' + error.message })
    }
  }

  function validarCPF(cpfComMascara) {
    const cpf = cpfComMascara.replace(/[^\d]+/g, '')
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
    let soma = 0
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i)
    let resto = 11 - (soma % 11)
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(cpf.charAt(9))) return false
    soma = 0
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i)
    resto = 11 - (soma % 11)
    if (resto === 10 || resto === 11) resto = 0
    return resto === parseInt(cpf.charAt(10))
  }

  const isReprovado = String(propostaStatusIdOriginal) === '3'

  async function apagarProposta() {
    try {
      const propostaStr = localStorage.getItem('propostaSelecionada_crmwa')
      if (!propostaStr) return
      const proposta = JSON.parse(propostaStr)
      if (!proposta.id) return

      for (const tabela of ['proposta_historico', 'proposta_parcela', 'documento_proposta']) {
        const { error: err } = await supabase
          .from(tabela)
          .delete()
          .eq('proposta_id', proposta.id)
        if (err) console.error(`Erro ao deletar ${tabela}:`, err)
      }

      const { error } = await supabase
        .from('proposta')
        .delete()
        .eq('id', proposta.id)

      if (error) throw error

      setModalConfirmarDelete(false)
      setPaginaAtual('esteira-proposta')
    } catch (error) {
      console.error('Erro ao apagar proposta:', error)
      alert('Erro ao apagar: ' + error.message)
    }
  }

  if (loadingData) {
    return <LoadingBars />
  }

  return (
    <>
      <div className="form-container">
        <header className="form-header">
          <h1>Status da Proposta</h1>
          <p className="header-subtitle">Descrição da página</p>
        </header>

        <div className="main-layout">
          <div className="form-principal">
            <div className="tab-bar">
              <button className={`tab-btn ${abaAtiva === 'dados' ? 'tab-ativa' : ''}`} onClick={() => setAbaAtiva('dados')}>Dados</button>
              <button className={`tab-btn ${abaAtiva === 'documentos' ? 'tab-ativa' : ''}`} onClick={() => { setAbaAtiva('documentos'); carregarDocumentos(JSON.parse(localStorage.getItem('propostaSelecionada_crmwa'))?.id) }}>Documentos</button>
              {localStorage.getItem('usuario_admin_crmwa') === 'true' && (
                <button className={`tab-btn ${abaAtiva === 'config' ? 'tab-ativa' : ''}`} onClick={() => setAbaAtiva('config')}>Configuração</button>
              )}
            </div>

            {abaAtiva === 'dados' && (
            <div className="dados-content">
              <section className="secao-container">
            <header className="secao-header">Operação</header>
            <div className="grid-row">
              <div className="field-group">
                <label>BANCO:</label>
                <div className="input-with-button">
                  <select value={banco} disabled>
                    <option value="">Selecione o banco</option>
                    {bancosDisponiveis.map((item) => (
                      <option key={item.id} value={item.id}>{item.nome}</option>
                    ))}
                  </select>
                  <button className="btn-modal" disabled>...</button>
                </div>
              </div>
              <div className="field-group">
                <label>TIPO DE OPERAÇÃO:</label>
                <select value={tipoOperacao} disabled>
                  <option value="">Selecione o tipo de operação</option>
                  {operacoesPermitidas.map((item) => (
                    <option key={item.id} value={item.id}>{item.nome}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>TIPO DE PRODUTO:</label>
                <select value={tipoProduto} disabled>
                  <option value="">Selecione o tipo do produto</option>
                  {tiposProduto
                    .filter(p => String(p.tipo_operacao_id) === String(tipoOperacao))
                    .map((item) => (
                      <option key={item.id} value={item.id}>{item.nome}</option>
                    ))}
                </select>
              </div>
            </div>
            <div className="grid-row">
              <div className="field-group">
                <label>TIPO DE CONVÊNIO:</label>
                <div className="input-with-button">
                  <select value={tipoConvenio} disabled>
                    <option value="">Selecione o convênio</option>
                    {conveniosDisponiveis.map((item) => (
                      <option key={item.id} value={item.id}>{item.nome}</option>
                    ))}
                  </select>
                  <button className="btn-modal" disabled>...</button>
                </div>
              </div>
              <div className="field-group">
                <label>ORGÃO:</label>
                <div className="input-with-button">
                  <select value={orgao} disabled>
                    <option value="">Selecione o orgão</option>
                    {vinculosConvenio.map((item) => (
                      <option key={item.id} value={item.id}>{item.nome}</option>
                    ))}
                  </select>
                  <button className="btn-modal" disabled>...</button>
                </div>
              </div>
            </div>
          </section>

          <section className="secao-container">
            <header className="secao-header">Cliente</header>
            <div className="grid-row">
              <div className="field-group" style={{position: 'relative', flex: 2}}>
                <label>CPF:</label>
                <div style={{display: 'flex', gap: '5px', width: '100%', alignItems: 'stretch'}}>
                  <IMaskInput
                    mask="000.000.000-00"
                    value={cpf}
                    placeholder="000.000.000-00"
                    className={`imask-input ${cpfValido === false ? 'input-error' : ''}`}
                    style={{flex: 1}}
                    disabled
                  />
                  <button className="btn-puxar" style={{marginTop: 0, height: '30px', whiteSpace: 'nowrap'}} disabled>PUXAR CADASTRO</button>
                </div>
                {cpfValido === false && <span className="error-msg" style={{position: 'absolute', bottom: '-16px', left: '0'}}>CPF inválido</span>}
              </div>
              <div className="field-group" style={{position: 'relative'}}>
                <label>MATRÍCULA:</label>
                <input type="text" placeholder="Digite a matrícula" value={matricula} disabled />
              </div>
              {tipoConvenio === siapePensionistaId && (
                <div className="field-group" style={{position: 'relative'}}>
                  <label>MATRÍCULA INSTITUIDOR:</label>
                  <input type="text" placeholder="Digite a matrícula do instituidor (7 dígitos)" value={matriculaInstituidor} disabled required />
                </div>
              )}
              <div className="field-group">
                <label>DATA DE NASCIMENTO:</label>
                <input type="date" value={dataNascimento} disabled />
              </div>
            </div>
            <div style={{display: 'flex', gap: '15px', width: '100%', alignItems: 'flex-end'}}>
              <div className="field-group" style={{marginBottom: 0, flex: '0 0 20%'}}>
                <label>MARGEM:</label>
                <IMaskInput
                  mask={Number}
                  value={margemCliente}
                  placeholder="R$ 0,00"
                  className="imask-input"
                  scale={2}
                  radix=","
                  prefix="R$ "
                  thousandsSeparator="."
                  style={{backgroundColor: '#d5d5d5'}}
                  readOnly
                />
              </div>
              <div className="field-group" style={{marginBottom: 0, flex: 1}}>
                <label>RESTRIÇÃO:</label>
                <div className="msg-bar" style={{backgroundColor: '#d5d5d5', opacity: 0.5, height: '30px', minHeight: '30px'}}></div>
              </div>
            </div>
          </section>

          <section className="secao-container">
            <header className="secao-header">Dados Pessoais</header>
            <div className="grid-row">
              <div className="field-group full-width">
                <label>NOME COMPLETO:</label>
                <input type="text" placeholder="Digite o nome completo" value={nomeCompleto} disabled />
              </div>
            </div>
            <div className="grid-row">
              <div className="field-group">
                <label>SEXO:</label>
                <select value={sexo} disabled>
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="field-group">
                <label>NÚMERO DO DOCUMENTO:</label>
                <input type="text" placeholder="Número do RG" value={numDocumento} disabled />
              </div>
              <div className="field-group">
                <label>CLIENTE ALFABETIZADO:</label>
                <select value={alfabetizado} disabled>
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>
            </div>
            <div className="grid-row">
              <div className="field-group" style={{flex: 3}}>
                <label>NOME DA MÃE:</label>
                <input type="text" placeholder="Digite o nome da mãe" value={nomeMae} disabled />
              </div>
              <div className="field-group small">
                <label>UF NAT:</label>
                <select value={ufNaturalidade} disabled>
                  <option value="">UF</option>
                  <option>AC</option><option>AL</option><option>AP</option>
                  <option>AM</option><option>BA</option><option>CE</option>
                  <option>DF</option><option>ES</option><option>GO</option>
                  <option>MA</option><option>MT</option><option>MS</option>
                  <option>MG</option><option>PA</option><option>PB</option>
                  <option>PR</option><option>PE</option><option>PI</option>
                  <option>RJ</option><option>RN</option><option>RS</option>
                  <option>RO</option><option>RR</option><option>SC</option>
                  <option>SP</option><option>SE</option><option>TO</option>
                </select>
              </div>
            </div>
            <div className="grid-row">
              <div className="field-group small">
                <label>DDD:</label>
                <IMaskInput mask="00" value={ddd} placeholder="00" className="imask-input" disabled />
              </div>
              <div className="field-group">
                <label>TELEFONE:</label>
                <IMaskInput mask="00000-0000" value={telefone} placeholder="00000-0000" className="imask-input" disabled />
              </div>
              <div className="field-group">
                <label>EMAIL:</label>
                <input type="email" placeholder="email@exemplo.com" value={email} disabled />
              </div>
            </div>
          </section>

          <section className="secao-container">
            <header className="secao-header">Endereço</header>
            <div className="grid-row address-row-1">
              <div className="field-group xsmall">
                <label>CEP:</label>
                <IMaskInput mask="00000-000" value={cep} placeholder="00000-000" className="imask-input" disabled />
              </div>
              <div className="field-group button-align">
                <button className="btn-cep" disabled>BUSCAR CEP</button>
              </div>
              <div className="field-group large">
                <label>LOGRADOURO:</label>
                <input type="text" placeholder="Rua, Avenida, etc." value={logradouro} disabled />
              </div>
              <div className="field-group xsmall">
                <label>NÚMERO:</label>
                <input type="text" placeholder="000" value={numero} disabled />
              </div>
              <div className="field-group">
                <label>COMPLEMENTO:</label>
                <input type="text" placeholder="Apto, Bloco, etc." value={complemento} disabled />
              </div>
              <div className="field-group small">
                <label>ESTADO:</label>
                <select value={estado} disabled>
                  <option value="">UF</option>
                  <option>AC</option><option>AL</option><option>AP</option>
                  <option>AM</option><option>BA</option><option>CE</option>
                  <option>DF</option><option>ES</option><option>GO</option>
                  <option>MA</option><option>MT</option><option>MS</option>
                  <option>MG</option><option>PA</option><option>PB</option>
                  <option>PR</option><option>PE</option><option>PI</option>
                  <option>RJ</option><option>RN</option><option>RS</option>
                  <option>RO</option><option>RR</option><option>SC</option>
                  <option>SP</option><option>SE</option><option>TO</option>
                </select>
              </div>
            </div>
            <div className="grid-row">
              <div className="field-group">
                <label>BAIRRO:</label>
                <input type="text" placeholder="Digite o bairro" value={bairro} disabled />
              </div>
              <div className="field-group">
                <label>CIDADE:</label>
                <input type="text" placeholder="Digite a cidade" value={cidade} disabled />
              </div>
            </div>
          </section>

          {(String(tipoOperacao) === '1' || String(tipoOperacao) === '4' || String(tipoOperacao) === '5') && (
            <section className="secao-container">
              <header className="secao-header">Dados da Simulação</header>
              {String(tipoOperacao) === '4' && (
                <div style={{background: '#3f3b6c', color: 'white', padding: '10px 20px', borderRadius: '6px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <input type="checkbox" id="cartaoPlastico" checked={cartaoComPlastico} disabled style={{width: '20px', height: '20px', accentColor: '#9b98c6'}} />
                  <label htmlFor="cartaoPlastico" style={{cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', margin: 0, letterSpacing: '1px'}}>CARTÃO COM PLÁSTICO</label>
                </div>
              )}
              <div className="grid-row">
                <div className="field-group">
                  <label>VALOR DE PARCELA:</label>
                  <IMaskInput mask={Number} value={valorParcela} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled />
                </div>
                <div className="field-group">
                  <label>TAXA DE JUROS:</label>
                  <IMaskInput mask={Number} value={taxaJuros} placeholder="0,00%" className="imask-input" scale={2} radix="," suffix="%" thousandsSeparator="." disabled />
                </div>
                <div className="field-group">
                  <label>PRAZO:</label>
                  <select value={prazo} disabled>
                    <option value="">Selecione</option>
                    <option value="108">108</option>
                    <option value="96">96</option>
                    <option value="84">84</option>
                    <option value="72">72</option>
                    <option value="60">60</option>
                  </select>
                </div>
              </div>
              <div className="grid-row">
                <div className="field-group">
                  <label>VALOR LIBERADO:</label>
                  <IMaskInput mask={Number} value={valorLiberado} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled />
                </div>
                <div className="field-group">
                  <label>TPS:</label>
                  <IMaskInput mask={Number} value={tps} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled />
                </div>
                <div className="field-group">
                  <label>SEGURO:</label>
                  <select value={seguro} disabled>
                    <option value="">Selecione</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {String(tipoOperacao) === '2' && (
            <section className="secao-container">
              <header className="secao-header">Dados da Simulação</header>
              <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
                <div style={{flex: 1}}>
                  <div className="subsection-title" style={{marginBottom: '15px'}}>Parcelas</div>
                  {parcelas.map((parcela, index) => (
                    <div key={parcela.id} style={{display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'nowrap', marginBottom: '10px'}}>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>VALOR DE PARCELA:</label>
                        <IMaskInput mask={Number} value={parcela.valor} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled />
                      </div>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>PARCELAS RESTANTES:</label>
                        <select value={parcela.numero} disabled>
                          <option value="">Selecione</option>
                          {Array.from({ length: 96 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num + 'x'}>{num}x</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  <div style={{display: 'flex', justifyContent: 'flex-start', marginTop: '10px', alignItems: 'center', gap: '15px'}}>
                    <button type="button" disabled style={{padding: '5px 15px', backgroundColor: '#4a4a7d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px'}}>Adicionar</button>
                    <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#999'}}>
                      <input type="checkbox" checked={unificarParcela === 'sim'} disabled style={{width: '18px', height: '18px', accentColor: '#3f3b6c'}} />
                      UNIFICAR PARCELA
                    </label>
                  </div>
                </div>
                <div style={{flex: 1}}>
                  <div className="subsection-title">Operação</div>
                  <div className="grid-row">
                    <div className="field-group">
                      <label>VALOR LIBERADO:</label>
                      <IMaskInput mask={Number} value={valorLiberado} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled />
                    </div>
                    <div className="field-group">
                      <label>PRAZO:</label>
                      <select value={prazo} disabled>
                        <option value="">Selecione</option>
                        <option value="108">108</option>
                        <option value="96">96</option>
                        <option value="84">84</option>
                        <option value="72">72</option>
                        <option value="60">60</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label>TPS:</label>
                      <IMaskInput mask={Number} value={tps} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled />
                    </div>
                    <div className="field-group">
                      <label>SEGURO:</label>
                      <select value={seguro} disabled>
                        <option value="">Selecione</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    </div>
                    {String(tipoProduto) === '3' && (
                      <div className="field-group">
                        <label>MARGEM AGREGADA:</label>
                        <IMaskInput mask={Number} value={margemAgregada} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled />
                      </div>
                    )}
                    {unificarParcela === 'sim' && (
                      <div className="field-group">
                        <label>VALOR FINAL DE PARCELA:</label>
                        <IMaskInput mask={Number} value={valorParcelaFinal} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {String(tipoOperacao) === '3' && (
            <section className="secao-container">
              <header className="secao-header">Dados da Simulação</header>
              <div style={{display: 'flex', gap: '20px', marginBottom: '20px', flexDirection: 'column'}}>
                <div style={{flex: 1}}>
                  <div className="subsection-title" style={{marginBottom: '15px'}}>Parcelas</div>
                  {parcelas.map((parcela, index) => (
                    <div key={parcela.id} style={{display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'nowrap', marginBottom: '10px'}}>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>BANCO:</label>
                        <select value={parcela.bancoOrigem} disabled>
                          <option value="">Selecione</option>
                          {bancosDisponiveis.map((item) => (
                            <option key={item.codigo} value={item.codigo}>{item.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>Nº CONTRATO:</label>
                        <input type="text" placeholder="Nº contrato" value={parcela.numeroContratoOrigem} disabled />
                      </div>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>SALDO DEVEDOR:</label>
                        <IMaskInput mask={Number} value={parcela.saldoDevedor} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled />
                      </div>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>VALOR DE PARCELA:</label>
                        <IMaskInput mask={Number} value={parcela.valor} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled />
                      </div>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>PARCELAS RESTANTES:</label>
                        <select value={parcela.numero} disabled>
                          <option value="">Selecione</option>
                          {Array.from({ length: 96 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num + 'x'}>{num}x</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{flex: 1}}>
                  <div className="subsection-title">OPERAÇÃO</div>
                  <div className="grid-row">
                    <div className="field-group">
                      <label>VALOR LIBERADO:</label>
                      <IMaskInput mask={Number} value={valorLiberado} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled />
                    </div>
                    <div className="field-group">
                      <label>PRAZO:</label>
                      <select value={prazo} disabled>
                        <option value="">Selecione</option>
                        <option value="108">108</option>
                        <option value="96">96</option>
                        <option value="84">84</option>
                        <option value="72">72</option>
                        <option value="60">60</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label>TPS:</label>
                      <IMaskInput mask={Number} value={tps} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled />
                    </div>
                    <div className="field-group">
                      <label>SEGURO:</label>
                      <select value={seguro} disabled>
                        <option value="">Selecione</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="secao-container">
            <header className="secao-header">Dados Bancários</header>
            <div className="grid-row">
              <div className="field-group">
                <label>BANCO:</label>
                <div className="input-with-button">
                  <select value={dadosBancarios.banco} disabled>
                    <option value="">Selecione o banco</option>
                    {bancosRecebimentoDisponiveis.map((item) => (
                      <option key={item.id} value={item.id}>{item.nome}</option>
                    ))}
                  </select>
                  <button className="btn-modal" disabled>...</button>
                </div>
              </div>
              <div className="field-group">
                <label>AGÊNCIA:</label>
                <IMaskInput mask="0000" value={dadosBancarios.agencia} placeholder="0000" className="imask-input" disabled />
              </div>
              <div className="field-group">
                <label>NÚMERO DA CONTA:</label>
                <input type="text" placeholder="00000" value={dadosBancarios.numeroConta} disabled />
              </div>
              <div className="field-group xsmall">
                <label>DV:</label>
                <IMaskInput mask="0" value={dadosBancarios.digitoVerificador} placeholder="0" className="imask-input" disabled />
              </div>
              <div className="field-group">
                <label>TIPO DE CONTA:</label>
                <select value={dadosBancarios.tipoConta} disabled>
                  <option value="">Selecione</option>
                  <option value="corrente">Conta Corrente</option>
                  <option value="poupanca">Conta Poupança</option>
                  <option value="salario">Conta Salário</option>
                </select>
              </div>
            </div>
          </section>

          <div className="form-actions">
            {mensagem.texto && (
              <div className={`mensagem ${mensagem.tipo}`} style={{ width: '100%', textAlign: 'center', marginBottom: '15px' }}>
                {mensagem.texto}
              </div>
            )}
              <button className="btn-main" onClick={() => setPaginaAtual('esteira-proposta')}>Voltar</button>
            </div>
            </div>
            )}
          {abaAtiva === 'documentos' && (
            <div className="documentos-tab">
            <section className="secao-container">
              <header className="secao-header">Documentos</header>
              <div style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
                  <select value={tipoDocSelecionado} onChange={(e) => setTipoDocSelecionado(e.target.value)} style={{ flex: 1, height: '28px', fontSize: '12px', padding: '0 6px' }}>
                    <option value="">Selecione o tipo de documento</option>
                    {TIPOS_DOCUMENTO.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                    ))}
                  </select>
                  <button
                    className="btn-anexar-tipo"
                    disabled={!tipoDocSelecionado}
                    onClick={() => {
                      const tipo = TIPOS_DOCUMENTO.find(t => t.id === tipoDocSelecionado)
                      if (tipo) {
                        setDocumentoSelecionado(tipo)
                        setModalAnexarOpen(true)
                      }
                    }}
                  >
                    Anexar
                  </button>
                </div>
                {documentos.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Nenhum documento anexado.</p>
                ) : (
                  <table className="tabela-documentos">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Arquivo</th>
                        <th>Data</th>
                        <th>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentos.map(doc => {
                        const { data: { publicUrl } } = supabase.storage.from('documentos-proposta').getPublicUrl(doc.storage_path)
                        return (
                          <tr key={doc.id}>
                            <td>{doc.tipo_documento}</td>
                            <td>{doc.nome_arquivo}</td>
                            <td>{new Date(doc.criado_em).toLocaleDateString('pt-BR')}</td>
                            <td><a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn-visualizar">Visualizar</a></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
            )}
          {abaAtiva === 'config' && (
            <div className="config-tab">
              <section className="secao-container">
                <header className="secao-header">Configuração</header>
                <div style={{ padding: '15px' }}>
                  {localStorage.getItem('usuario_admin_crmwa') === 'true' && (
                    <button
                      className="btn-deletar-proposta"
                      onClick={() => setModalConfirmarDelete(true)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Apagar Proposta
                    </button>
                  )}
                </div>
              </section>
            </div>
          )}
          </div>
          <aside className="painel-mudancas">
            <header className="secao-header-lateral">
              Mudanças operacionais
            </header>
            <div className="conteudo-lateral">
              <div className="campo-lateral">
                <label>CÓDIGO DA TABELA DIGITADA: <span className="required">*</span></label>
                <div className="input-with-checkbox">
                  <input type="text" value={codigoTabela} onChange={(e) => setCodigoTabela(e.target.value)} className="input-estilizado" disabled={isReprovado || !!codigoTabelaOriginal || naoTemCodigoTabela} />
                  <label className="checkbox-label-lateral">
                    <input type="checkbox" checked={naoTemCodigoTabela} onChange={(e) => { setNaoTemCodigoTabela(e.target.checked); if (e.target.checked) setCodigoTabela('') }} disabled={isReprovado || !!codigoTabelaOriginal} />
                    Não tem Código da Tabela
                  </label>
                </div>
              </div>
              <div className="campo-lateral">
                <label>VALOR REAL DA PARCELA:</label>
                <IMaskInput mask={Number} value={parcelaReal} onAccept={(v) => setParcelaReal(v)} className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled={isReprovado} />
              </div>
              <div className="campo-lateral">
                <label>PRAZO REAL:</label>
                <input type="text" value={numeroParcelasReal} onChange={(e) => setNumeroParcelasReal(e.target.value)} className="input-estilizado" disabled={isReprovado} />
              </div>
              <div className="campo-lateral">
                <label>VALOR REAL LIBERADO:</label>
                <IMaskInput mask={Number} value={valorRealLiberado} onAccept={(v) => setValorRealLiberado(v)} className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled={isReprovado} />
              </div>
              <div className="campo-lateral">
                <label>TPS CORRIGIDA:</label>
                <IMaskInput mask={Number} value={tpsCorrigida} onAccept={(v) => setTpsCorrigida(v)} className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." disabled={isReprovado} />
              </div>
              <div className="campo-lateral">
                <label>STATUS PROPOSTA:</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select value={propostaStatusId} onChange={(e) => { setPropostaStatusId(e.target.value); setDetalheStatusId('') }} style={{ flex: 1 }} disabled={isReprovado}>
                    <option value="">Selecione</option>
                    {listaStatus.map((s) => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                  {propostaStatusId && (
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#3f3b6c', textTransform: 'uppercase' }}>
                      {listaStatus.find(s => String(s.id) === String(propostaStatusId))?.historico || ''}
                    </span>
                  )}
                </div>
              </div>
              {!['1', '2', '6'].includes(String(propostaStatusId)) && (
              <div className="campo-lateral">
                <label>{String(propostaStatusId) === '3' ? 'MOTIVO DA REPROVA:' : String(propostaStatusId) === '5' ? 'MOTIVO DA PENDÊNCIA:' : String(propostaStatusId) === '7' ? 'LINK:' : 'DESCRIÇÃO:'}</label>
                {detalhesStatus.length > 0 ? (
                  <select value={detalheStatusId} onChange={(e) => setDetalheStatusId(e.target.value)} disabled={isReprovado}>
                    <option value="">Selecione</option>
                    {detalhesStatus.map((d) => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="input-estilizado" disabled={isReprovado} />
                )}
              </div>
              )}
              <div className="campo-lateral">
                <label>ADE BANCO: <span className="required">*</span></label>
                <div className="input-with-checkbox">
                  <input type="text" value={adeBanco} onChange={(e) => setAdeBanco(e.target.value)} className="input-estilizado" disabled={isReprovado || !!adeBancoOriginal || naoTemAde} />
                  <label className="checkbox-label-lateral">
                    <input type="checkbox" checked={naoTemAde} onChange={(e) => { setNaoTemAde(e.target.checked); if (e.target.checked) setAdeBanco('') }} disabled={isReprovado || !!adeBancoOriginal} />
                    Não tem ADE
                  </label>
                </div>
              </div>
              {lockError && <div className="lock-warning" style={{ color: '#d32f2f', fontSize: '13px', marginBottom: '8px', textAlign: 'center' }}>{lockError}</div>}
              <button className="btn-salvar-lateral" onClick={salvarValoresReais} disabled={!!lockError}>Salvar</button>
              {String(propostaStatusId) === '3' && (
                <button className="btn-redigitar" onClick={() => setModalRedigitarAberto(true)}>REDIGITAR</button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {modalRedigirSucesso && (
        <div className="success-modal-overlay" onClick={() => { setModalRedigirSucesso(false); setPaginaAtual('esteira-proposta') }}>
          <div className="success-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal-icon">✓</div>
            <h3>Proposta recadastrada com sucesso!</h3>
            <p>A nova proposta foi criada e a original cancelada.</p>
            <button className="success-modal-btn" onClick={() => { setModalRedigirSucesso(false); setPaginaAtual('esteira-proposta') }}>OK</button>
          </div>
        </div>
      )}

      {modalRedigitarAberto && (
        <div className="success-modal-overlay" onClick={() => setModalRedigitarAberto(false)}>
          <div className="success-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="success-modal-icon" style={{ fontSize: '24px' }}>🔄</div>
            <h3>Redigitar Proposta</h3>
            <p>Selecione o banco para redigitar a proposta:</p>
            {bancosDisponiveis.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center' }}>Nenhum banco disponível.</p>
            ) : (
            <select value={bancoRedigitar} onChange={(e) => setBancoRedigitar(e.target.value)} style={{ width: '100%', height: '36px', marginBottom: '20px', padding: '5px', fontSize: '13px' }}>
              <option value="">Selecione um banco</option>
              {bancosDisponiveis.map((b) => (
                <option key={b.id} value={b.id}>{b.nome}</option>
              ))}
            </select>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="success-modal-btn" onClick={redigitarProposta}>CONFIRMAR</button>
              <button className="success-modal-btn" onClick={() => setModalRedigitarAberto(false)} style={{ backgroundColor: '#999' }}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {modalSucesso && (
        <div className="success-modal-overlay" onClick={() => { setModalSucesso(false); setPaginaAtual('esteira-proposta') }}>
          <div className="success-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal-icon">✓</div>
            <h3>Dados salvos com sucesso!</h3>
            <p>Os dados foram salvos.</p>
            <button className="success-modal-btn" onClick={() => { setModalSucesso(false); setPaginaAtual('esteira-proposta') }}>OK</button>
          </div>
        </div>
      )}

      {modalConfirmarDelete && (
        <div className="success-modal-overlay" onClick={() => setModalConfirmarDelete(false)}>
          <div className="success-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="success-modal-icon" style={{ fontSize: '24px' }}>⚠️</div>
            <h3>Apagar Proposta</h3>
            <p>Tem certeza que deseja apagar esta proposta? Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
              <button className="success-modal-btn" onClick={apagarProposta} style={{ backgroundColor: '#dc3545' }}>APAGAR</button>
              <button className="success-modal-btn" onClick={() => setModalConfirmarDelete(false)} style={{ backgroundColor: '#999' }}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {modalAnexarOpen && documentoSelecionado && (
        <ModalAnexarDocumento
          key={documentoSelecionado.id}
          isOpen={modalAnexarOpen}
          onClose={() => setModalAnexarOpen(false)}
          propostaId={JSON.parse(localStorage.getItem('propostaSelecionada_crmwa') || '{}')?.id}
          tipoDocumento={documentoSelecionado.id}
          tipoLabel={documentoSelecionado.label}
          onAnexar={() => {
            const pid = JSON.parse(localStorage.getItem('propostaSelecionada_crmwa') || '{}')?.id
            if (pid) carregarDocumentos(pid)
            setModalAnexarOpen(false)
          }}
          anexosExistentes={documentos.filter(d => d.tipo_documento === documentoSelecionado.id)}
        />
      )}
    </>
  )
}
