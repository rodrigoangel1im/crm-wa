import React, { useState, useEffect, useRef } from "react"
import "./AdicionarContrato.css"
import { IMaskInput } from "react-imask"
import ModalOrgao from "../../components/ModalOrgao/ModalOrgao"
import ModalConvenio from "../../components/ModalConvenio/ModalConvenio"
import ModalBanco from "../../components/ModalBanco/ModalBanco"
import ModalBancoRecebimento from "../../components/ModalBancoRecebimento/ModalBancoRecebimento"
import { supabase } from "../../lib/supabase"

export default function AdicionarContrato({ setPaginaAtual }) {
  const [tipoOperacao, setTipoOperacao] = useState("")
  const [banco, setBanco] = useState("")
  const [tipoProduto, setTipoProduto] = useState("")
  const [tipoConvenio, setTipoConvenio] = useState("")
  const [orgao, setOrgao] = useState("")
  
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
  const [conveniosPermitidos, setConveniosPermitidos] = useState([])
  
  const [cpf, setCpf] = useState("")
  const [cpfValido, setCpfValido] = useState(null)
  const [matricula, setMatricula] = useState("")
  const [dataNascimento, setDataNascimento] = useState("")
  const [ddd, setDdd] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cep, setCep] = useState("")
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [sexo, setSexo] = useState("")
  const [numDocumento, setNumDocumento] = useState("")
  const [margemCliente, setMargemCliente] = useState("")
  const [alfabetizado, setAlfabetizado] = useState("")
  const [nomeMae, setNomeMae] = useState("")
  const [email, setEmail] = useState("")
  const [logradouro, setLogradouro] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")
  const [ufNaturalidade, setUfNaturalidade] = useState("")
  const [matriculaInstituidor, setMatriculaInstituidor] = useState("")
  const [matriculaValida, setMatriculaValida] = useState(null)
  const [inssId, setInssId] = useState(null)
  const [siapeServidorId, setSiapeServidorId] = useState(null)
  const [siapePensionistaId, setSiapePensionistaId] = useState(null)
  
  const [parcelas, setParcelas] = useState([{ id: 1, valor: "", numero: "", bancoOrigem: "", numeroContratoOrigem: "", saldoDevedor: "", troco: "" }])

  const adicionarParcela = () => {
    const newId = parcelas.length > 0 ? Math.max(...parcelas.map(p => p.id)) + 1 : 1
    setParcelas([...parcelas, { id: newId, valor: "", numero: "", bancoOrigem: "", numeroContratoOrigem: "", saldoDevedor: "", troco: "" }])
  }
  const removerParcela = (id) => {
    if (parcelas.length > 1) {
      setParcelas(parcelas.filter(p => p.id !== id))
    }
  }
  const [tps, setTps] = useState("")
  const [seguro, setSeguro] = useState("")
  const [valorLiberado, setValorLiberado] = useState("")
  const [valorParcelaFinal, setValorParcelaFinal] = useState("")
  const [unificarParcela, setUnificarParcela] = useState("")
  const [agregarMargem, setAgregarMargem] = useState("")
  const [valorMargemAgregada, setValorMargemAgregada] = useState("")
  const [cartaoComPlastico, setCartaoComPlastico] = useState(false)
  const [prazo, setPrazo] = useState("")
  const [margemAgregada, setMargemAgregada] = useState("")
  const [valorParcela, setValorParcela] = useState("")
  const [taxaJuros, setTaxaJuros] = useState("")

  useEffect(() => {
    const totalParcelas = parcelas.reduce((soma, p) => {
      const val = parseFloat(p.valor) || 0
      return soma + val
    }, 0)
    const margem = parseFloat(margemAgregada) || 0
    const margemPort = agregarMargem === 'sim' ? (parseFloat(valorMargemAgregada) || 0) : 0
    const total = totalParcelas + margem + margemPort
    setValorParcelaFinal(total > 0 ? total.toFixed(2) : "")
  }, [parcelas, margemAgregada, valorMargemAgregada, agregarMargem])

  useEffect(() => {
    if (parcelas.length >= 2 && unificarParcela !== "sim") {
      const totalTroco = parcelas.reduce((soma, p) => {
        const val = parseFloat(p.troco) || 0
        return soma + val
      }, 0)
      setValorLiberado(totalTroco > 0 ? totalTroco.toFixed(2) : "")
    }
  }, [parcelas, unificarParcela])

  const [dadosBancarios, setDadosBancarios] = useState({
    banco: "",
    agencia: "",
    numeroConta: "",
    digitoVerificador: "",
    tipoConta: ""
  })
  
  const [cadastroPuxado, setCadastroPuxado] = useState(false)
  const [loadingCadastro, setLoadingCadastro] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [mensagem, setMensagem] = useState({ tipo: "", texto: "" })
  const [mensagemModal, setMensagemModal] = useState({ visivel: false, tipo: "", texto: "" })
  const [usuarioId, setUsuarioId] = useState(null)
  const [modalClienteAberto, setModalClienteAberto] = useState(false)
  const [resultadosCliente, setResultadosCliente] = useState([])
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [modalErroAberto, setModalErroAberto] = useState(false)
  const [erroTexto, setErroTexto] = useState('')
  const [modalAddRefin, setModalAddRefin] = useState(false)
  const [addRefinStep, setAddRefinStep] = useState('ask')
  const [addRefinValor, setAddRefinValor] = useState('')
  const [addRefinLiberado, setAddRefinLiberado] = useState('')
  const [addRefinPrazo, setAddRefinPrazo] = useState('')
  const [addRefinTps, setAddRefinTps] = useState('')
  const [addRefinSubmitting, setAddRefinSubmitting] = useState(false)
  const dadosBancariosInseridoRef = useRef(null)
  const matriculaIdRef = useRef(null)
  const propostaStatusIdRef = useRef(null)

  useEffect(() => {
    async function carregarDados() {
      try {
        const [bancosRes, bancosRecebimentoRes, conveniosRes, operacoesRes, produtosRes, usuarioRes] = await Promise.all([
          supabase.from("banco_operacao").select("id, codigo, nome").eq("ativo", true).order("nome"),
          supabase.from("banco_recebimento").select("id, codigo, nome").eq("ativo", true).order("codigo"),
          supabase.from("convenio").select("id, nome").eq("ativo", true).order("nome"),
          supabase.from("tipo_operacao").select("id, nome").eq("ativo", true).order("nome"),
          supabase.from("tipo_produto").select("id, nome, tipo_operacao_id").eq("ativo", true),
          supabase.from("usuario").select("id").limit(1)
        ])

        if (bancosRes.data) setBancosDisponiveis(bancosRes.data)
        if (bancosRecebimentoRes.data) setBancosRecebimentoDisponiveis(bancosRecebimentoRes.data)
        if (conveniosRes.data) {
          setConveniosDisponiveis(conveniosRes.data)
          for (const c of conveniosRes.data) {
            const nome = c.nome.toUpperCase()
            if (nome.includes("INSS")) setInssId(String(c.id))
            if (nome.includes("SERVIDOR")) setSiapeServidorId(String(c.id))
            if (nome.includes("PENSIONISTA")) setSiapePensionistaId(String(c.id))
          }
        }
        if (operacoesRes.data) setTiposOperacao(operacoesRes.data)
        if (produtosRes.data) setTiposProduto(produtosRes.data)
        if (usuarioRes.data && usuarioRes.data.length > 0) setUsuarioId(usuarioRes.data[0].id)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      }
    }
    carregarDados()
  }, [])

  useEffect(() => {
    async function carregarOperacoesPermitidas() {
      if (!banco) {
        setOperacoesPermitidas([])
        setConveniosPermitidos([])
        return
      }
      
      try {
        // 1. Busca o id do banco pelo codigo
        const { data: bancoData, error: bancoError } = await supabase
          .from("banco_operacao")
          .select("id")
          .eq("id", banco)
          .single()
        
        if (bancoError || !bancoData) {
          console.error("Erro ao buscar banco:", bancoError)
          setOperacoesPermitidas([])
          setConveniosPermitidos([])
          return
        }
        
        console.log("Banco selecionado - ID:", bancoData.id, "Código:", banco)
        
        // 2. Busca apenas os IDs de operações permitidas
        const { data: permissoes, error: permissoesError } = await supabase
          .from("banco_tipo_operacao")
          .select("tipo_operacao_id")
          .eq("banco_id", bancoData.id)
        
        if (permissoesError) {
          console.error("Erro ao buscar permissões:", permissoesError)
          setOperacoesPermitidas([])
          setConveniosPermitidos([])
          return
        }
        
        console.log("IDs de operações permitidas:", permissoes)
        
        if (!permissoes || permissoes.length === 0) {
          console.warn("Nenhuma operação cadastrada para este banco")
          setOperacoesPermitidas([])
          setConveniosPermitidos([])
          return
        }
        
        // 3. Filtra a lista já carregada de tipos de operação
        const allowedIds = permissoes.map(p => p.tipo_operacao_id)
        const operacoesFiltradas = tiposOperacao.filter(op => allowedIds.includes(op.id))
        
        console.log("Operações filtradas:", operacoesFiltradas)
        
        // 4. Ordena conforme solicitado
        const ordemNomes = ["EMPRESTIMO NOVO", "REFINANCIAMENTO", "PORTABILIDADE", "CARTÃO NOVO", "SAQUE COMPLEMENTAR"]
        const ordenadas = ordemNomes
          .map(nome => operacoesFiltradas.find(op => op.nome.toUpperCase() === nome.toUpperCase()))
          .filter(Boolean)
        
        console.log("Operações ordenadas:", ordenadas)
        
        setOperacoesPermitidas(ordenadas)
        
        // 5. Busca os convênios permitidos para este banco
        const { data: conveniosVinculados, error: conveniosError } = await supabase
          .from("banco_convenio")
          .select("convenio_id")
          .eq("banco_id", bancoData.id)
        
        if (!conveniosError && conveniosVinculados && conveniosVinculados.length > 0) {
          const convenioIds = conveniosVinculados.map(v => v.convenio_id)
          const filtrados = conveniosDisponiveis.filter(c => convenioIds.includes(c.id))
          setConveniosPermitidos(filtrados)
        } else {
          setConveniosPermitidos([...conveniosDisponiveis])
        }
        
      } catch (error) {
        console.error("Erro ao carregar operações permitidas:", error)
        setOperacoesPermitidas([])
        setConveniosPermitidos([])
      }
    }
    
    carregarOperacoesPermitidas()
    setTipoOperacao("")
    setTipoProduto("")
    setTipoConvenio("")
    setOrgao("")
  }, [banco, tiposOperacao, conveniosDisponiveis])

  useEffect(() => {
    async function carregarVinculos() {
      if (!tipoConvenio) {
        setVinculosConvenio([])
        return
      }
      try {
        console.log("Carregando vínculos para convenio_id:", tipoConvenio)
        
        const { data, error } = await supabase
          .from("vinculo_convenio")
          .select("id, codigo, nome")
          .eq("convenio_id", parseInt(tipoConvenio))
          .eq("ativo", true)
          .order("nome")

        if (error) {
          console.error("Erro ao carregar vínculos:", error)
          setVinculosConvenio([])
          return
        }

        console.log("Vínculos carregados:", data)
        if (data) setVinculosConvenio(data)
      } catch (error) {
        console.error("Erro ao carregar vínculos:", error)
        setVinculosConvenio([])
      }
    }
    carregarVinculos()
  }, [tipoConvenio])

  useEffect(() => {
    if (tipoConvenio !== siapePensionistaId) {
      setMatriculaInstituidor("")
    }
  }, [tipoConvenio])

  const buscarDadosCliente = async () => {
    setCadastroPuxado(true)
    setLoadingCadastro(true)
    try {
      const cpfLimpo = cpf.replace(/\D/g, "")

      const { data: clientes, error } = await supabase
        .from("cliente")
        .select(`
          id, cpf, nome_completo, sexo, data_nascimento, nome_mae, uf_nae,
          numero_documento, cliente_alfabetizado, ddd, telefone, email,
          endereco (*),
          matricula (id, numero_matricula, margem_disponivel, matricula_instituidor, convenio_id)
        `)
        .eq("cpf", cpfLimpo)

      if (error) throw error

      if (!clientes || clientes.length === 0) {
        setResultadosCliente([])
        setModalClienteAberto(true)
        return
      }

      const linhas = []
      for (const cli of clientes) {
        const mats = cli.matricula || []
        if (mats.length === 0) {
          linhas.push({
            cliente: cli,
            clienteId: cli.id,
            cpf: cli.cpf,
            nomeCompleto: cli.nome_completo,
            numeroMatricula: "",
            margemDisponivel: null,
            matriculaInstituidor: null,
            matriculaId: null
          })
        } else {
          for (const mat of mats) {
            linhas.push({
              cliente: cli,
              clienteId: cli.id,
              cpf: cli.cpf,
              nomeCompleto: cli.nome_completo,
              numeroMatricula: mat.numero_matricula,
              margemDisponivel: mat.margem_disponivel,
              matriculaInstituidor: mat.matricula_instituidor,
              matriculaId: mat.id,
              convenioId: mat.convenio_id
            })
          }
        }
      }

      setResultadosCliente(linhas)
      setModalClienteAberto(true)
    } catch (error) {
      console.error("Erro ao buscar cliente:", error)
      setMensagem({ tipo: "erro", texto: "Erro ao buscar cliente: " + error.message })
    } finally {
      setLoadingCadastro(false)
    }
  }

  const selecionarCliente = (linha) => {
    const cli = linha.cliente

    setNomeCompleto(cli.nome_completo || "")
    setSexo(cli.sexo || "")
    setNumDocumento(cli.numero_documento || "")
    setAlfabetizado(cli.cliente_alfabetizado ? "sim" : "nao")
    setNomeMae(cli.nome_mae || "")
    setEmail(cli.email || "")
    setDataNascimento(cli.data_nascimento || "")
    setUfNaturalidade(cli.uf_nae || "")
    setDdd(cli.ddd || "")
    setTelefone(cli.telefone || "")
    setMatricula(linha.numeroMatricula || "")

    if (cli.endereco && cli.endereco[0]) {
      const end = cli.endereco[0]
      setCep(end.cep || "")
      setLogradouro(end.logradouro || "")
      setNumero(end.numero || "")
      setComplemento(end.complemento || "")
      setBairro(end.bairro || "")
      setCidade(end.cidade || "")
      setEstado(end.estado || "")
    }

    setMargemCliente(linha.margemDisponivel?.toFixed(2).replace(".", ",") || "")
    if (tipoConvenio === siapePensionistaId) {
      setMatriculaInstituidor(linha.matriculaInstituidor || "")
    }

    setCadastroPuxado(true)
    setModalClienteAberto(false)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setMensagem({ tipo: "", texto: "" })
    setFormSubmitted(true)

    try {
      if (!banco || !tipoOperacao || !tipoProduto || !tipoConvenio || !orgao) {
        setMensagem({ tipo: "erro", texto: "Preencha todos os dados da operação" })
        setErroTexto("Preencha todos os dados da operação")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (!cpfValido || !cpf) {
        setMensagem({ tipo: "erro", texto: "CPF inválido" })
        setErroTexto("CPF inválido")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (!matricula) {
        setMensagem({ tipo: "erro", texto: "Preencha a matrícula" })
        setErroTexto("Preencha a matrícula")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if ((String(tipoConvenio) === String(inssId) && matricula.length !== 10) ||
          (String(tipoConvenio) === String(siapeServidorId) && matricula.length !== 7) ||
          (String(tipoConvenio) === String(siapePensionistaId) && matricula.length !== 8)) {
        setMensagem({ tipo: "erro", texto: "Matrícula com tamanho inválido para o convênio selecionado" })
        setErroTexto("Matrícula com tamanho inválido para o convênio selecionado")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (!dataNascimento) {
        setMensagem({ tipo: "erro", texto: "Preencha a data de nascimento" })
        setErroTexto("Preencha a data de nascimento")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (tipoConvenio === siapePensionistaId && matriculaInstituidor.length !== 7) {
        setMensagem({ tipo: "erro", texto: "Preencha a matrícula do instituidor (7 dígitos)" })
        setErroTexto("Preencha a matrícula do instituidor (7 dígitos)")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (!cadastroPuxado) {
        setMensagem({ tipo: "erro", texto: "Faça o \"Puxar Cadastro\" antes de continuar" })
        setErroTexto("Faça o \"Puxar Cadastro\" antes de continuar")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (!nomeCompleto || !sexo || !numDocumento || !alfabetizado || !nomeMae || !email || !ufNaturalidade || !ddd || !telefone) {
        setMensagem({ tipo: "erro", texto: "Preencha todos os dados pessoais" })
        setErroTexto("Preencha todos os dados pessoais")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (nomeCompleto.trim().split(/\s+/).length < 2) {
        setMensagem({ tipo: "erro", texto: "Nome completo deve conter nome e sobrenome" })
        setErroTexto("Nome completo deve conter nome e sobrenome")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (nomeMae.trim().split(/\s+/).length < 2) {
        setMensagem({ tipo: "erro", texto: "Nome da mãe deve conter nome e sobrenome" })
        setErroTexto("Nome da mãe deve conter nome e sobrenome")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (ddd.replace(/\D/g, "").length !== 2) {
        setMensagem({ tipo: "erro", texto: "DDD deve ter 2 dígitos" })
        setErroTexto("DDD deve ter 2 dígitos")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (telefone.replace(/\D/g, "").length !== 9) {
        setMensagem({ tipo: "erro", texto: "Telefone deve ter 9 dígitos" })
        setErroTexto("Telefone deve ter 9 dígitos")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (email && !email.includes('@')) {
        setMensagem({ tipo: "erro", texto: "Email deve conter @" })
        setErroTexto("Email deve conter @")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (!cep || !logradouro || !numero || !complemento || !bairro || !cidade || !estado) {
        setMensagem({ tipo: "erro", texto: "Preencha todos os dados de endereço" })
        setErroTexto("Preencha todos os dados de endereço")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      if (String(tipoOperacao) === "1" || String(tipoOperacao) === "4" || String(tipoOperacao) === "5") {
        if (!valorParcela || !taxaJuros || !prazo || !valorLiberado || !tps || !seguro) {
          setMensagem({ tipo: "erro", texto: "Preencha todos os dados da simulação" })
          setErroTexto("Preencha todos os dados da simulação")
          setModalErroAberto(true)
          setSubmitting(false)
          return
        }
      }

      if (String(tipoOperacao) === "2" || String(tipoOperacao) === "3") {
        if (!valorLiberado || !prazo || !tps || !seguro) {
          setMensagem({ tipo: "erro", texto: "Preencha todos os dados da simulação" })
          setErroTexto("Preencha todos os dados da simulação")
          setModalErroAberto(true)
          setSubmitting(false)
          return
        }

        if (String(tipoProduto) === "3" && !margemAgregada) {
          setMensagem({ tipo: "erro", texto: "Preencha a margem agregada" })
          setErroTexto("Preencha a margem agregada")
          setModalErroAberto(true)
          setSubmitting(false)
          return
        }

        const parcelasValidar = parcelas.filter(p => p.valor)
        if (parcelasValidar.length === 0) {
          setMensagem({ tipo: "erro", texto: "Adicione pelo menos uma parcela com valor" })
          setErroTexto("Adicione pelo menos uma parcela com valor")
          setModalErroAberto(true)
          setSubmitting(false)
          return
        }

        if (String(tipoOperacao) === "3") {
          for (const p of parcelasValidar) {
            if (!p.bancoOrigem || !p.numeroContratoOrigem || !p.saldoDevedor || !p.numero) {
              setMensagem({ tipo: "erro", texto: "Preencha todos os campos de cada parcela (banco, contrato, saldo devedor, valor, parcelas restantes)" })
              setErroTexto("Preencha todos os campos de cada parcela (banco, contrato, saldo devedor, valor, parcelas restantes)")
              setModalErroAberto(true)
              setSubmitting(false)
              return
            }
          }
        }

        if (String(tipoOperacao) === "2") {
          for (const p of parcelasValidar) {
            if (!p.numero) {
              setMensagem({ tipo: "erro", texto: "Preencha o número de parcelas restantes em cada parcela" })
              setErroTexto("Preencha o número de parcelas restantes em cada parcela")
              setModalErroAberto(true)
              setSubmitting(false)
              return
            }
          }

        }

        if (agregarMargem === 'sim' && !valorMargemAgregada) {
          setMensagem({ tipo: "erro", texto: "Preencha o valor da margem agregada" })
          setErroTexto("Preencha o valor da margem agregada")
          setModalErroAberto(true)
          setSubmitting(false)
          return
        }
      }

      if (!dadosBancarios.banco || !dadosBancarios.agencia || dadosBancarios.agencia.length !== 4 || !dadosBancarios.numeroConta || !dadosBancarios.digitoVerificador || !dadosBancarios.tipoConta) {
        setMensagem({ tipo: "erro", texto: "Preencha todos os dados bancários" })
        setErroTexto("Preencha todos os dados bancários")
        setModalErroAberto(true)
        setSubmitting(false)
        return
      }

      const cpfLimpo = cpf.replace(/\D/g, "")
      let clienteId

      const { data: clienteExistente } = await supabase
        .from("cliente")
        .select("id")
        .eq("cpf", cpfLimpo)
        .single()

      if (clienteExistente) {
        clienteId = clienteExistente.id
        await supabase
          .from("cliente")
          .update({
            nome_completo: nomeCompleto,
            sexo,
            data_nascimento: dataNascimento || null,
            nome_mae: nomeMae,
            uf_nae: ufNaturalidade,
            numero_documento: numDocumento,
            cliente_alfabetizado: alfabetizado === "sim",
            ddd: ddd,
            telefone,
            email,
            atualizado_em: new Date()
          })
          .eq("id", clienteId)
      } else {
        const { data: novoCliente, error: erroCliente } = await supabase
          .from("cliente")
          .insert([{
            cpf: cpfLimpo,
            nome_completo: nomeCompleto,
            sexo,
            data_nascimento: dataNascimento || null,
            nome_mae: nomeMae,
            uf_nae: ufNaturalidade,
            numero_documento: numDocumento,
            cliente_alfabetizado: alfabetizado === "sim",
            ddd: ddd,
            telefone,
            email
          }])
          .select()
          .single()

        if (erroCliente) throw erroCliente
        clienteId = novoCliente.id
      }

      const { data: enderecoExistente } = await supabase
        .from("endereco")
        .select("id")
        .eq("cliente_id", clienteId)
        .single()

      const enderecoData = {
        cliente_id: clienteId,
        cep: cep.replace(/\D/g, ""),
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        atualizado_em: new Date()
      }

      if (enderecoExistente) {
        await supabase.from("endereco").update(enderecoData).eq("id", enderecoExistente.id)
      } else {
        await supabase.from("endereco").insert([enderecoData])
      }

      let matriculaId
      const { data: matriculaExistente } = await supabase
        .from("matricula")
        .select("id")
        .eq("cliente_id", clienteId)
        .eq("convenio_id", parseInt(tipoConvenio))
        .eq("numero_matricula", matricula)
        .single()

      if (matriculaExistente) {
        matriculaId = matriculaExistente.id
        matriculaIdRef.current = matriculaId
      } else {
        const margem = typeof margemCliente === "string" 
          ? (parseFloat(margemCliente.replace(/\./g, "").replace(",", ".")) || 0)
          : margemCliente || 0

        const { data: novaMatricula, error: erroMatricula } = await supabase
          .from("matricula")
          .insert([{
            cliente_id: clienteId,
            convenio_id: parseInt(tipoConvenio),
            vinculo_convenio_id: parseInt(orgao),
            numero_matricula: matricula,
            matricula_instituidor: tipoConvenio === siapePensionistaId ? matriculaInstituidor : null,
            situacao: "Ativo",
            margem_disponivel: margem
          }])
          .select()
          .single()

        if (erroMatricula) throw erroMatricula
        matriculaId = novaMatricula.id
        matriculaIdRef.current = matriculaId
      }

        const { data: dadosBancariosInserido, error: erroDadosBancarios } = await supabase
          .from("dados_bancarios")
          .insert([{
            cliente_id: clienteId,
            banco_recebimento_id: dadosBancarios.banco,
            agencia: dadosBancarios.agencia,
            numero_conta: dadosBancarios.numeroConta,
            digito: dadosBancarios.digitoVerificador,
            tipo_conta: dadosBancarios.tipoConta
          }])
        .select()
        .single()

      if (erroDadosBancarios) throw erroDadosBancarios
      dadosBancariosInseridoRef.current = dadosBancariosInserido.id

      const parseValor = (val) => {
        if (typeof val === "string") return parseFloat(val) || null
        return val || null
      }

      let usuarioDigitadorId = null

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: usuarioLogado } = await supabase
          .from("usuario")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle()
        if (usuarioLogado) usuarioDigitadorId = usuarioLogado.id
      }

      if (!usuarioDigitadorId) {
        usuarioDigitadorId = usuarioId
      }

      let propostaStatusId = null

      for (const termo of ["%digitação%", "%aguardando%", "%análise%"]) {
        const { data: st } = await supabase
          .from("proposta_status")
          .select("id")
          .ilike("nome", termo)
          .maybeSingle()
        if (st) { propostaStatusId = st.id; break }
      }

      if (!propostaStatusId) {
        const { data: primeiro } = await supabase
          .from("proposta_status")
          .select("id")
          .order("id")
          .limit(1)
          .maybeSingle()
        if (primeiro) propostaStatusId = primeiro.id
      }
      propostaStatusIdRef.current = propostaStatusId

      const parseNumero = (val) => {
        if (!val) return null
        return parseInt(String(val).replace(/[^\d]/g, '')) || null
      }

      const tipoParcela = String(tipoOperacao) === "3" ? 'pre_portabilidade' : 'refin'

      const parcelasComValor = parcelas.filter(p => p.valor)
      const deveSepararPropostas = String(tipoOperacao) === "3"

      const dadosSimulacao = {}

      if (String(tipoOperacao) === "2") {
        dadosSimulacao.parcela_final = parseValor(valorParcelaFinal)
        dadosSimulacao.unificar_parcela = unificarParcela === 'sim'
        dadosSimulacao.agregar_margem = agregarMargem === 'sim'
        dadosSimulacao.valor_margem_agregada = parseValor(valorMargemAgregada)
        dadosSimulacao.margem_agregada = parseValor(margemAgregada)
      }

      let todasPropostasIds = []

      if (deveSepararPropostas) {
        for (let i = 0; i < parcelasComValor.length; i++) {
          const p = parcelasComValor[i]

          const { data: propostaInserida, error: erroProposta } = await supabase
            .from("proposta")
            .insert([{
              banco_credor_id: banco,
              dados_bancarios_id: dadosBancariosInserido.id,
              matricula_id: matriculaId,
              tipo_operacao_id: parseInt(tipoOperacao),
              tipo_produto_id: parseInt(tipoProduto),
              usuario_digitador_id: usuarioDigitadorId,
          proposta_status_id: propostaStatusIdRef.current,
              valor_parcela: parseValor(p.valor),
              numero_parcelas: parseNumero(p.numero) || 1,
              taxa_juros: parseValor(taxaJuros),
              tps: parseValor(tps),
              seguro: seguro === "sim" ? 50.00 : 0,
              valor_liberado: parseValor(p.saldoDevedor)
            }])
            .select()
            .single()

          if (erroProposta) throw erroProposta

          const { error: erroParcela } = await supabase
            .from("proposta_parcela")
            .insert([{
              proposta_id: propostaInserida.id,
              tipo: tipoParcela,
              indice: 0,
              valor: parseValor(p.valor),
              saldo_devedor: parseValor(p.saldoDevedor),
              prazo_restante: parseNumero(p.numero),
              banco_codigo: p.bancoOrigem || null,
              numero_contrato: p.numeroContratoOrigem || null,
              troco: parseValor(p.troco)
            }])

          if (erroParcela) throw erroParcela

          if (Object.keys(dadosSimulacao).length > 0) {
            const { error: erroSimulacao } = await supabase
              .from("proposta")
              .update({ dados_simulacao: dadosSimulacao })
              .eq("id", propostaInserida.id)

            if (erroSimulacao) throw erroSimulacao
          }

          todasPropostasIds.push(propostaInserida.id)
        }
      } else {
        const { data: propostaInserida, error: erroProposta } = await supabase
          .from("proposta")
          .insert([{
            banco_credor_id: banco,
            dados_bancarios_id: dadosBancariosInserido.id,
            matricula_id: matriculaId,
            tipo_operacao_id: parseInt(tipoOperacao),
            tipo_produto_id: parseInt(tipoProduto),
            usuario_digitador_id: usuarioDigitadorId,
            proposta_status_id: propostaStatusId,
            valor_parcela: parcelas && parcelas.length > 0 && parcelas[0].valor
              ? parcelas.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0)
              : parseValor(valorParcela),
            numero_parcelas: parcelas && parcelas.length > 0 && parcelas[0].numero
              ? parcelas.reduce((s, p) => s + (parseInt(String(p.numero).replace(/[^\d]/g, '')) || 0), 0)
              : parseInt(prazo) || null,
            taxa_juros: parseValor(taxaJuros),
            tps: parseValor(tps),
            seguro: seguro === "sim" ? 50.00 : 0,
            valor_liberado: parseValor(valorLiberado)
          }])
          .select()
          .single()

        if (erroProposta) throw erroProposta

        if (parcelas && parcelas.length > 0 && parcelas[0].valor) {
          const parcelasComValor = parcelas.filter(p => p.valor)
          const trocoPorParcela = unificarParcela === 'sim' && parcelasComValor.length > 0
            ? parseValor(valorLiberado) / parcelasComValor.length
            : null
          const parcelasInsert = parcelasComValor.map((p, i) => ({
            proposta_id: propostaInserida.id,
            tipo: tipoParcela,
            indice: i,
            valor: parseValor(p.valor),
            saldo_devedor: parseValor(p.saldoDevedor),
            prazo_restante: parseNumero(p.numero),
            banco_codigo: p.bancoOrigem || null,
            numero_contrato: p.numeroContratoOrigem || null,
            troco: trocoPorParcela || parseValor(p.troco || valorLiberado)
          })).filter(p => p.valor !== null)

          if (parcelasInsert.length > 0) {
            const { error: erroParcelas } = await supabase
              .from("proposta_parcela")
              .insert(parcelasInsert)

            if (erroParcelas) throw erroParcelas
          }
        } else if (parseValor(valorLiberado)) {
          const { error: erroParcela } = await supabase
            .from("proposta_parcela")
            .insert([{
              proposta_id: propostaInserida.id,
              tipo: tipoParcela,
              indice: 0,
              valor: parseValor(valorParcela),
              troco: parseValor(valorLiberado)
            }])

          if (erroParcela) throw erroParcela
        }

        if (Object.keys(dadosSimulacao).length > 0) {
          const { error: erroSimulacao } = await supabase
            .from("proposta")
            .update({ dados_simulacao: dadosSimulacao })
            .eq("id", propostaInserida.id)

          if (erroSimulacao) throw erroSimulacao
        }

        todasPropostasIds.push(propostaInserida.id)
      }

      localStorage.setItem("propostaAnexar_crmwa", JSON.stringify({
        ids: todasPropostasIds,
        numero: null
      }))

      if (String(tipoOperacao) === "2") {
        setAddRefinValor('')
        setAddRefinLiberado('')
        setAddRefinPrazo('')
        setAddRefinStep('ask')
        setModalAddRefin(true)
      } else {
        const mensagemTexto = todasPropostasIds.length > 1
          ? `${todasPropostasIds.length} propostas cadastradas com sucesso! Agora anexe os documentos do cliente.`
          : `Proposta ${todasPropostasIds[0]} cadastrada com sucesso! Agora anexe os documentos do cliente.`

        setMensagemModal({ visivel: true, tipo: "sucesso", texto: mensagemTexto })
      }

    } catch (error) {
      console.error("Erro ao salvar proposta:", error)
      if (error.message && error.message.includes("chk_matricula_tamanho")) {
        setMensagem({ tipo: "erro", texto: "Não foi possível cadastrar devido à quantidade de dígitos da matrícula" })
      } else {
        setMensagem({ tipo: "erro", texto: "Erro ao salvar: " + error.message })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddRefinCadastrar() {
    if (!addRefinValor || !addRefinLiberado || !addRefinPrazo) {
      alert('Preencha todos os campos.')
      return
    }
    const tpsValue = addRefinTps ? parseFloat(addRefinTps.replace(',', '.')) : 0
    setAddRefinSubmitting(true)
    try {
      const usuarioDigitadorId = parseInt(localStorage.getItem('usuario_id_crmwa') || '0')
      const novaProposta = await supabase
        .from('proposta')
        .insert([{
          banco_credor_id: banco,
          dados_bancarios_id: dadosBancariosInseridoRef.current,
          matricula_id: matriculaIdRef.current,
          tipo_operacao_id: parseInt(tipoOperacao),
          tipo_produto_id: parseInt(tipoProduto),
          usuario_digitador_id: usuarioDigitadorId,
          proposta_status_id: propostaStatusIdRef.current,
          valor_parcela: parseFloat(addRefinValor),
          numero_parcelas: parseInt(addRefinPrazo),
          taxa_juros: parseFloat(taxaJuros),
          tps: tpsValue,
          seguro: seguro === "sim" ? 50.00 : 0,
          valor_liberado: parseFloat(addRefinLiberado)
        }])
        .select()
        .single()

      if (novaProposta.error) throw novaProposta.error

      await supabase.from('proposta_parcela').insert([{
        proposta_id: novaProposta.data.id,
        tipo: 'refin',
        indice: 0,
        valor: parseFloat(addRefinValor),
        troco: parseFloat(addRefinLiberado)
      }])

      setAddRefinValor('')
      setAddRefinLiberado('')
      setAddRefinPrazo('')
      setAddRefinTps('')
      setAddRefinStep('ask')
    } catch (error) {
      console.error('Erro ao cadastrar Refin:', error)
      alert('Erro ao cadastrar: ' + error.message)
    } finally {
      setAddRefinSubmitting(false)
    }
  }

  const handleCancelar = () => {
    if (window.confirm("Deseja realmente cancelar? Todos os dados serão perdidos.")) {
      window.location.reload()
    }
  }

  const limparDadosAposOperacao = () => {
    setCpf("")
    setCpfValido(null)
    setMatricula("")
    setMatriculaValida(null)
    setDataNascimento("")
    setDdd("")
    setTelefone("")
    setNomeCompleto("")
    setSexo("")
    setNumDocumento("")
    setMargemCliente("")
    setAlfabetizado("")
    setNomeMae("")
    setEmail("")
    setUfNaturalidade("")
    setMatriculaInstituidor("")
    setCep("")
    setLogradouro("")
    setNumero("")
    setComplemento("")
    setBairro("")
    setCidade("")
    setEstado("")
    setParcelas([{ id: 1, valor: "", numero: "", bancoOrigem: "", numeroContratoOrigem: "", saldoDevedor: "" }])
    setTps("")
    setSeguro("")
    setValorLiberado("")
    setValorParcelaFinal("")
    setUnificarParcela("")
    setAgregarMargem("")
    setValorMargemAgregada("")
    setCartaoComPlastico(false)
    setPrazo("")
    setMargemAgregada("")
    setValorParcela("")
    setTaxaJuros("")
    setDadosBancarios({ banco: "", agencia: "", numeroConta: "", digitoVerificador: "", tipoConta: "" })
    setResultadosCliente([])
    setModalClienteAberto(false)
    setCadastroPuxado(false)
  }

  const operacaoCompleta = banco && tipoOperacao && tipoProduto && tipoConvenio && orgao
  const clienteCompleto = operacaoCompleta && cpfValido === true && matricula && matriculaValida !== false && dataNascimento && (tipoConvenio !== siapePensionistaId || (matriculaInstituidor.length === 7))
  const dadosPessoaisSecaoPronta = clienteCompleto && cadastroPuxado
  const dadosPessoaisCompletos = dadosPessoaisSecaoPronta && nomeCompleto && sexo && numDocumento && alfabetizado && nomeMae && email && ufNaturalidade && ddd && telefone
  const enderecoCompleto = dadosPessoaisCompletos && cep && logradouro && numero && bairro && cidade && estado && complemento
  const dadosBancariosCompleto = enderecoCompleto && dadosBancarios.banco && dadosBancarios.agencia && dadosBancarios.numeroConta && dadosBancarios.digitoVerificador && dadosBancarios.tipoConta
  const secoesAposClienteDesbloqueadas = cadastroPuxado

  function validarCPF(cpfComMascara) {
    const cpf = cpfComMascara.replace(/[^\d]+/g, "")
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

  async function buscarCEP() {
    const cepLimpo = cep.replace(/\D/g, "")
    if (cepLimpo.length !== 8) return
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        alert("CEP não encontrado")
        return
      }
      
      setLogradouro(data.logradouro || "")
      setBairro(data.bairro || "")
      setCidade(data.localidade || "")
      setEstado(data.uf || "")
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      alert("Erro ao buscar CEP")
    }
  }

  return (
    <>
      <div className={`form-container ${mensagemModal.visivel ? "content-blurred" : ""} ${formSubmitted ? "form-submitted" : ""}`}>
        <header className="form-header">
          <h1>Cadastro de Proposta</h1>
        </header>

        <div className="form-content">
          <section className="form-section">
            <div className="section-title">Operação</div>
            <div className="grid-row">
              <div className="field-group">
                <label>BANCO:</label>
                <div className="input-with-button">
                  <select value={banco} onChange={(e) => { setBanco(e.target.value); setTipoOperacao(""); setTipoProduto(""); setTipoConvenio(""); setOrgao(""); limparDadosAposOperacao() }} className={formSubmitted && !banco ? 'input-error' : ''} required>
                    <option value="">Selecione o banco</option>
                    {bancosDisponiveis.map((item) => (
                       <option key={item.id} value={item.id}>{item.nome}</option>
                     ))}
                  </select>
                  <button className="btn-modal" onClick={() => setModalBancosAberto(true)}>...</button>
                </div>
              </div>

              <ModalBanco
                isOpen={modalBancosAberto}
                onClose={() => setModalBancosAberto(false)}
                bancos={bancosDisponiveis}
                onSelect={(id) => { setBanco(id); limparDadosAposOperacao(); setModalBancosAberto(false) }}
              />
              <div className="field-group">
                <label>TIPO DE OPERAÇÃO:</label>
                  <select 
                  value={tipoOperacao} 
                  onChange={(e) => { setTipoOperacao(e.target.value); setTipoProduto(""); setTipoConvenio(""); setOrgao(""); limparDadosAposOperacao() }} 
                  disabled={!banco}
                 className={formSubmitted && !tipoOperacao ? 'input-error' : ''} required>
                  <option value="">Selecione o tipo de operação</option>
                  {operacoesPermitidas.length > 0 ? (
                    operacoesPermitidas.map((item) => (
                      <option key={item.id} value={item.id}>{item.nome}</option>
                    ))
                  ) : (
                    <option value="" disabled>Nenhuma operação permitida para este banco</option>
                  )}
                </select>
              </div>
              <div className="field-group">
                <label>TIPO DE PRODUTO:</label>
                  <select value={tipoProduto} onChange={(e) => { setTipoProduto(e.target.value); setTipoConvenio(""); setOrgao(""); limparDadosAposOperacao() }} disabled={!tipoOperacao} className={formSubmitted && !tipoProduto ? 'input-error' : ''} required>
                  <option value="">Selecione o tipo do produto</option>
                  {tiposProduto
                    .filter((p) => String(p.tipo_operacao_id) === String(tipoOperacao))
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
                  <select value={tipoConvenio} onChange={(e) => { setTipoConvenio(e.target.value); setOrgao(""); limparDadosAposOperacao() }} disabled={!tipoProduto} className={formSubmitted && !tipoConvenio ? 'input-error' : ''} required>
                    <option value="">Selecione o convênio</option>
                    {conveniosPermitidos.length > 0 ? conveniosPermitidos.map((item) => (
                      <option key={item.id} value={item.id}>{item.nome}</option>
                    )) : conveniosDisponiveis.map((item) => (
                      <option key={item.id} value={item.id}>{item.nome}</option>
                    ))}
                  </select>
                  <button className="btn-modal" onClick={() => setModalConveniosAberto(true)} disabled={!tipoProduto}>...</button>
                </div>
              </div>

              <ModalConvenio
                isOpen={modalConveniosAberto}
                onClose={() => setModalConveniosAberto(false)}
                convenios={conveniosPermitidos.length > 0 ? conveniosPermitidos : conveniosDisponiveis}
                onSelect={(id) => { setTipoConvenio(id); limparDadosAposOperacao(); setModalConveniosAberto(false) }}
              />
              <div className="field-group">
                <label>ORGÃO:</label>
                <div className="input-with-button">
                  <select value={orgao} onChange={(e) => { setOrgao(e.target.value); limparDadosAposOperacao() }} disabled={!tipoConvenio} className={formSubmitted && !orgao ? 'input-error' : ''} required>
                    <option value="">Selecione o orgão</option>
                    {vinculosConvenio.map((item) => (
                      <option key={item.id} value={item.id}>{item.nome}</option>
                    ))}
                  </select>
                  <button className="btn-modal" onClick={() => setModalOrgaosAberto(true)} disabled={!tipoConvenio}>...</button>
                </div>
              </div>

              <ModalOrgao
                isOpen={modalOrgaosAberto}
                onClose={() => setModalOrgaosAberto(false)}
                orgaos={vinculosConvenio}
                onSelect={(id) => { setOrgao(id); limparDadosAposOperacao(); setModalOrgaosAberto(false) }}
              />
            </div>
          </section>

          <section className={`form-section ${!cadastroPuxado && !operacaoCompleta ? "section-disabled" : ""}`}>
            <div className="section-title">Cliente</div>
            <div className="grid-row">
              <div className="field-group" style={{position: "relative", flex: 2}}>
                <label>CPF:</label>
                <div style={{display: "flex", gap: "5px", width: "100%", alignItems: "stretch"}}>
                  <IMaskInput
                    mask="000.000.000-00"
                    value={cpf}
                    onAccept={(value) => {
                      setCpf(value)
                      setCpfValido(value.replace(/[^\d]+/g,"").length === 11 ? validarCPF(value) : null)
                    }}
                    placeholder="000.000.000-00"
                    className={`imask-input ${cpfValido === false ? "input-error" : ""}`}
                    style={{flex: 1}}
                   required/>
                  <button className="btn-puxar" style={{marginTop: 0, height: "30px", whiteSpace: "nowrap"}} disabled={cpfValido !== true || loadingCadastro} onClick={buscarDadosCliente}>
                    {loadingCadastro ? "CARREGANDO..." : "PUXAR CADASTRO"}
                  </button>
                </div>
                {cpfValido === false && <span className="error-msg" style={{position: "absolute", bottom: "-16px", left: "0"}}>CPF inválido</span>}
              </div>
              <div className="field-group" style={{position: "relative"}}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  MATRÍCULA:
                  {formSubmitted && !matricula && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Obrigatório</span>}
                </label>
                <input
                  type="text"
                  placeholder="Digite a matrícula"
                  value={matricula}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "")
                    setMatricula(val)
                    if (!tipoConvenio) {
                      setMatriculaValida(null)
                      return
                    }
                    if (tipoConvenio === inssId) {
                      setMatriculaValida(val.length === 10 || val.length === 0 ? null : false)
                    } else if (tipoConvenio === siapeServidorId) {
                      setMatriculaValida(val.length === 7 || val.length === 0 ? null : false)
                    } else if (tipoConvenio === siapePensionistaId) {
                      setMatriculaValida(val.length === 8 || val.length === 0 ? null : false)
                    } else {
                      setMatriculaValida(null)
                    }
                  }}
                  className={`${matriculaValida === false || (formSubmitted && !matricula) ? "input-error" : ""}`}
                  disabled={!operacaoCompleta}
                 required/>
                {matriculaValida === false && tipoConvenio === inssId && (
                  <span className="error-msg" style={{position: "absolute", bottom: "-16px", left: "0"}}>Matrícula INSS deve ter 10 dígitos</span>
                )}
                {matriculaValida === false && tipoConvenio === siapeServidorId && (
                  <span className="error-msg" style={{position: "absolute", bottom: "-16px", left: "0"}}>Matrícula do Servidor deve ter 7 dígitos</span>
                )}
                {matriculaValida === false && tipoConvenio === siapePensionistaId && (
                  <span className="error-msg" style={{position: "absolute", bottom: "-16px", left: "0"}}>Matrícula do Pensionista deve ter 8 dígitos</span>
                )}
              </div>
              {tipoConvenio === siapePensionistaId && (
                <div className="field-group" style={{position: "relative"}}>
                  <label>MATRÍCULA INSTITUIDOR:</label>
                  <input
                    type="text"
                    placeholder="Digite a matrícula do instituidor (7 dígitos)"
                    value={matriculaInstituidor}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "")
                      if (val.length <= 7) setMatriculaInstituidor(val)
                    }}
                    disabled={!operacaoCompleta}
                    className={matriculaInstituidor.length > 0 && matriculaInstituidor.length !== 7 ? "input-error" : ""}
                    required
                  />
                  {matriculaInstituidor.length > 0 && matriculaInstituidor.length !== 7 && (
                    <span className="error-msg" style={{position: "absolute", bottom: "-16px", left: "0"}}>Instituidor deve ter 7 dígitos</span>
                  )}
                </div>
              )}
              <div className="field-group">
                <label>DATA DE NASCIMENTO:</label>
                <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} disabled={!operacaoCompleta} className={formSubmitted && !dataNascimento ? 'input-error' : ''}  required/>
              </div>
            </div>
            <div style={{display: "flex", gap: "15px", width: "100%", alignItems: "flex-end"}}>
              <div className="field-group" style={{marginBottom: 0, flex: "0 0 20%"}}>
                <label>MARGEM:</label>
                <IMaskInput
                  mask={Number}
                  value={margemCliente}
                  onAccept={(value) => setMargemCliente(value)}
                  placeholder="R$ 0,00"
                  className="imask-input"
                  scale={2}
                  radix=","
                  prefix="R$ "
                  thousandsSeparator="."
                  style={{backgroundColor: "#d5d5d5"}}
                  readOnly
                />
              </div>
              <div className="field-group" style={{marginBottom: 0, flex: 1}}>
                <label>RESTRIÇÃO:</label>
                <div className="msg-bar" style={{backgroundColor: "#d5d5d5", opacity: 0.5, height: "30px", minHeight: "30px"}}></div>
              </div>
            </div>
          </section>

          <section className={`form-section ${!cadastroPuxado && !dadosPessoaisSecaoPronta ? "section-disabled" : ""}`}>
            <div className="section-title">Dados Pessoais</div>
            <div className="grid-row">
              <div className="field-group full-width">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  NOME COMPLETO:
                  {nomeCompleto && nomeCompleto.trim().split(/\s+/).length < 2 && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Informe nome e sobrenome</span>}
                </label>
                <input
                  type="text"
                  placeholder="Digite o nome completo"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value.toUpperCase())}
                  disabled={!dadosPessoaisSecaoPronta}
                  className={`uppercase-input ${nomeCompleto && nomeCompleto.trim().split(/\s+/).length < 2 ? 'input-error' : ''}`}
                 required/>
              </div>
            </div>
            <div className="grid-row">
              <div className="field-group">
                <label>SEXO:</label>
                <select value={sexo} onChange={(e) => setSexo(e.target.value)} disabled={!cadastroPuxado} className={formSubmitted && !sexo ? 'input-error' : ''} required>
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="field-group">
                <label>NÚMERO DO DOCUMENTO:</label>
                <input
                  type="text"
                  placeholder="Número do RG"
                  value={numDocumento}
                  onChange={(e) => setNumDocumento(e.target.value)}
                  disabled={!cadastroPuxado}
                  className={formSubmitted && !numDocumento ? 'input-error' : ''}
                 required/>
              </div>
              <div className="field-group">
                <label>CLIENTE ALFABETIZADO:</label>
                <select value={alfabetizado} onChange={(e) => setAlfabetizado(e.target.value)} disabled={!cadastroPuxado} className={formSubmitted && !alfabetizado ? 'input-error' : ''} required>
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>
            </div>
            <div className="grid-row">
              <div className="field-group" style={{flex: 3}}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  NOME DA MÃE:
                  {nomeMae && nomeMae.trim().split(/\s+/).length < 2 && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Informe nome e sobrenome</span>}
                </label>
                <input
                  type="text"
                  placeholder="Digite o nome da mãe"
                  value={nomeMae}
                  onChange={(e) => setNomeMae(e.target.value.toUpperCase())}
                  disabled={!secoesAposClienteDesbloqueadas}
                  className={`uppercase-input ${nomeMae && nomeMae.trim().split(/\s+/).length < 2 ? 'input-error' : ''}`}
                 required/>
              </div>
              <div className="field-group small">
                <label>UF NAT:</label>
                <select value={ufNaturalidade} onChange={(e) => setUfNaturalidade(e.target.value)} disabled={!secoesAposClienteDesbloqueadas} className={formSubmitted && !ufNaturalidade ? 'input-error' : ''} required>
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
              <div className="field-group small" style={{ position: "relative" }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  DDD:
                  {ddd && ddd.replace(/\D/g, "").length !== 2 && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>DDD deve ter 2 dígitos</span>}
                </label>
                <IMaskInput
                  mask="00"
                  value={ddd}
                  onAccept={(value) => setDdd(value)}
                  placeholder="00"
                  className={`imask-input ${ddd && ddd.replace(/\D/g, "").length !== 2 ? "input-error" : ""}`}
                  disabled={!cadastroPuxado}
                 required/>
              </div>
              <div className="field-group" style={{ position: "relative" }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  TELEFONE:
                  {telefone && telefone.replace(/\D/g, "").length !== 9 && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Telefone deve ter 9 dígitos</span>}
                </label>
                <IMaskInput
                  mask="00000-0000"
                  value={telefone}
                  onAccept={(value) => setTelefone(value)}
                  placeholder="00000-0000"
                  className={`imask-input ${telefone && telefone.replace(/\D/g, "").length !== 9 ? "input-error" : ""}`}
                  disabled={!cadastroPuxado}
                 required/>
              </div>
              <div className="field-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  EMAIL:
                  {email && !email.includes('@') && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Email deve conter @</span>}
                </label>
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!cadastroPuxado}
                  className={`${formSubmitted && !email ? 'input-error' : ''} ${email && !email.includes('@') ? 'input-error' : ''}`} required/>
              </div>
            </div>
          </section>

          <section className={`form-section ${!cadastroPuxado && !dadosPessoaisCompletos ? "section-disabled" : ""}`}>
            <div className="section-title">Endereço</div>
            <div className="grid-row address-row-1">
              <div className="field-group xsmall">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  CEP:
                  {formSubmitted && !cep && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Obrigatório</span>}
                </label>
                <IMaskInput
                  mask="00000-000"
                  value={cep}
                  onAccept={(value) => setCep(value)}
                  placeholder="00000-000"
                  className="imask-input"
                  disabled={!secoesAposClienteDesbloqueadas}
                 required/>
              </div>
              <div className="field-group button-align">
                <button className="btn-cep" disabled={!secoesAposClienteDesbloqueadas} onClick={buscarCEP}>BUSCAR CEP</button>
              </div>
              <div className="field-group large">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  LOGRADOURO:
                  {formSubmitted && !logradouro && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Obrigatório</span>}
                </label>
                <input
                  type="text"
                  placeholder="Rua, Avenida, etc."
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  disabled={!secoesAposClienteDesbloqueadas}
                 className={formSubmitted && !logradouro ? 'input-error' : ''} required/>
              </div>
              <div className="field-group xsmall">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  NÚMERO:
                  {formSubmitted && !numero && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Obrigatório</span>}
                </label>
                <input
                  type="text"
                  placeholder="000"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  disabled={!secoesAposClienteDesbloqueadas}
                 className={formSubmitted && !numero ? 'input-error' : ''} required/>
              </div>
              <div className="field-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  COMPLEMENTO:
                  {formSubmitted && !complemento && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Obrigatório</span>}
                </label>
                <input
                  type="text"
                  placeholder="Apto, Bloco, etc."
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  disabled={!secoesAposClienteDesbloqueadas}
                 className={formSubmitted && !complemento ? 'input-error' : ''} required/>
              </div>
              <div className="field-group small">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  ESTADO:
                  {formSubmitted && !estado && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Obrigatório</span>}
                </label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)} disabled={!secoesAposClienteDesbloqueadas} className={formSubmitted && !estado ? 'input-error' : ''} required>
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  BAIRRO:
                  {formSubmitted && !bairro && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Obrigatório</span>}
                </label>
                <input
                  type="text"
                  placeholder="Digite o bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  disabled={!secoesAposClienteDesbloqueadas}
                 className={formSubmitted && !bairro ? 'input-error' : ''} required/>
              </div>
              <div className="field-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  CIDADE:
                  {formSubmitted && !cidade && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Obrigatório</span>}
                </label>
                <input
                  type="text"
                  placeholder="Digite a cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  disabled={!secoesAposClienteDesbloqueadas}
                 className={formSubmitted && !cidade ? 'input-error' : ''} required/>
              </div>
            </div>
          </section>

          {(String(tipoOperacao) === "1" || String(tipoOperacao) === "4" || String(tipoOperacao) === "5") && (
            <section className={`form-section ${!cadastroPuxado && !enderecoCompleto ? "section-disabled" : ""}`}>
              <div className="section-title">Dados da Simulação</div>
              {String(tipoOperacao) === "4" && (
              <div style={{background: '#3f3b6c', color: 'white', padding: '10px 20px', borderRadius: '6px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                <input
                  type="checkbox"
                  id="cartaoPlastico"
                  checked={cartaoComPlastico}
                  onChange={(e) => setCartaoComPlastico(e.target.checked)}
                  disabled={!secoesAposClienteDesbloqueadas}
                  style={{width: '20px', height: '20px', cursor: 'pointer', accentColor: '#9b98c6'}}
                />
                <label htmlFor="cartaoPlastico" style={{cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', margin: 0, letterSpacing: '1px'}}>CARTÃO COM PLÁSTICO</label>
              </div>
              )}
              <div className="grid-row">
                <div className="field-group">
                  <label>VALOR DE PARCELA:</label>
                            <IMaskInput
                              mask={Number}
                              value={valorParcela}
                              onAccept={(value) => setValorParcela(value)}
                              placeholder="R$ 0,00"
                              className="imask-input"
                              scale={2}
                              radix=","
                              prefix="R$ "
                              thousandsSeparator="."
                              disabled={!secoesAposClienteDesbloqueadas}
                              unmask={true}
                             required/>
                </div>
                <div className="field-group">
                  <label>TAXA DE JUROS:</label>
                  <IMaskInput
                    mask={Number}
                    value={taxaJuros}
                    onAccept={(value) => setTaxaJuros(value)}
                    placeholder="0,00%"
                    className="imask-input"
                    scale={2}
                    radix=","
                    suffix="%"
                    thousandsSeparator="."
                    disabled={!secoesAposClienteDesbloqueadas}
                    unmask={true}
                   required/>
                </div>
                <div className="field-group">
                  <label>PRAZO:</label>
                  <select value={prazo} onChange={(e) => setPrazo(e.target.value)} disabled={!secoesAposClienteDesbloqueadas} className={formSubmitted && !prazo ? 'input-error' : ''} required>
                    <option value="">Selecione</option>
                    <option value="120">120</option>
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
                  <IMaskInput
                             mask={Number}
                              value={valorLiberado}
                    onAccept={(value) => {
                                  setValorLiberado(value)
                                }}
                                placeholder="R$ 0,00"
                                className="imask-input"
                                scale={2}
                                radix=","
                                prefix="R$ "
                                thousandsSeparator="."
                                  disabled={!secoesAposClienteDesbloqueadas}
                                  unmask={true}
                                 required/>
                  </div>
                  <div className="field-group">

                    <label>TPS:</label>
                  <IMaskInput
                    mask={Number}
                    value={tps}
                    onAccept={(value) => setTps(value)}
                               placeholder="R$ 0,00"
                               className="imask-input"
                               scale={2}
                               radix=","
                               prefix="R$ "
                               thousandsSeparator="."
                               disabled={!secoesAposClienteDesbloqueadas}
                               unmask={true}
                              required/>
                </div>
                <div className="field-group">
                  <label>SEGURO:</label>
                  <select value={seguro} onChange={(e) => setSeguro(e.target.value)} disabled={!secoesAposClienteDesbloqueadas} className={formSubmitted && !seguro ? 'input-error' : ''} required>
                    <option value="">Selecione</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {String(tipoOperacao) === "2" && (
            <section className={`form-section ${!cadastroPuxado && !enderecoCompleto ? "section-disabled" : ""}`}>
              <div className="section-title">Dados da Simulação</div>

              <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
                <div style={{flex: 1}}>
                  <div className="subsection-title" style={{marginBottom: '15px'}}>Parcelas</div>
                  {parcelas.map((parcela, index) => (
                    <div key={parcela.id} style={{display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'nowrap', marginBottom: '10px'}}>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>VALOR DE PARCELA:</label>
                        <IMaskInput
                          mask={Number}
                          value={parcela.valor}
                          onAccept={(value) => {
                            const novasParcelas = [...parcelas]
                            novasParcelas[index].valor = value
                            setParcelas(novasParcelas)
                          }}
                          placeholder="R$ 0,00"
                          className="imask-input"
                          scale={2}
                          radix=","
                          prefix="R$ "
                          thousandsSeparator="."
                          disabled={!secoesAposClienteDesbloqueadas}
                          unmask={true}
                         required/>
                      </div>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>PARCELAS RESTANTES:</label>
                        <select 
                          value={parcela.numero} 
                          onChange={(e) => {
                            const novasParcelas = [...parcelas]
                            novasParcelas[index].numero = e.target.value
                            setParcelas(novasParcelas)
                          }} 
                          disabled={!secoesAposClienteDesbloqueadas}
                          required>
                          <option value="">Selecione</option>
                          {Array.from({ length: 96 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num + "x"}>{num}x</option>
                          ))}
                        </select>
                      </div>
                      {parcelas.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removerParcela(parcela.id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#d9534f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                    <div style={{display: 'flex', justifyContent: 'flex-start', marginTop: '10px', alignItems: 'center', gap: '15px'}}>
                    <button 
                      type="button" 
                      onClick={adicionarParcela}
                      style={{
                        padding: '5px 15px',
                        backgroundColor: '#4a4a7d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                 <div style={{flex: 1}}>
                    <div className="subsection-title">Operação</div>
                   <div className="grid-row">
                         <div className="field-group">
                          <label>VALOR LIBERADO:</label>
                          <IMaskInput
                            mask={Number}
                            value={valorLiberado}
                            onAccept={(value) => setValorLiberado(value)}
                             placeholder="R$ 0,00"
                             className="imask-input"
                             scale={2}
                             radix=","
                             prefix="R$ "
                             thousandsSeparator="."
                              disabled={!secoesAposClienteDesbloqueadas}
                              unmask={true}
                             required/>
                          </div>

                          <div className="field-group">
                             <label>PRAZO:</label>
                           <select value={prazo} onChange={(e) => setPrazo(e.target.value)} disabled={!secoesAposClienteDesbloqueadas} className={formSubmitted && !prazo ? 'input-error' : ''} required>
                             <option value="">Selecione</option>
                             <option value="120">120</option>
                             <option value="108">108</option>
                             <option value="96">96</option>
                             <option value="84">84</option>
                             <option value="72">72</option>
                             <option value="60">60</option>
                           </select>
                        </div>

                        <div className="field-group">
                          <label>TPS:</label>
                          <IMaskInput
                            mask={Number}
                            value={tps}
                            onAccept={(value) => setTps(value)}
                            placeholder="R$ 0,00"
                            className="imask-input"
                            scale={2}
                            radix=","
                            prefix="R$ "
                            thousandsSeparator="."
                            disabled={!secoesAposClienteDesbloqueadas}
                            unmask={true}
                           required/>
                        </div>

                        <div className="field-group">
                          <label>SEGURO:</label>
                          <select value={seguro} onChange={(e) => setSeguro(e.target.value)} disabled={!secoesAposClienteDesbloqueadas} className={formSubmitted && !seguro ? 'input-error' : ''} required>
                            <option value="">Selecione</option>
                            <option value="sim">Sim</option>
                            <option value="nao">Não</option>
                          </select>
                        </div>

                       {String(tipoProduto) === "3" && (
                         <div className="field-group">
                           <label>MARGEM AGREGADA:</label>
                            <IMaskInput
                              mask={Number}
                              value={margemAgregada}
                              onAccept={(value) => setMargemAgregada(value)}
                              placeholder="R$ 0,00"
                              className="imask-input"
                              scale={2}
                              radix=","
                              prefix="R$ "
                              thousandsSeparator="."
                              disabled={!secoesAposClienteDesbloqueadas}
                              unmask={true}
                             required/>
                         </div>
                       )}

                           <div className="field-group">
                             <label>VALOR FINAL DE PARCELA:</label>
                             <IMaskInput
                               mask={Number}
                               value={valorParcelaFinal}
                               onAccept={(value) => setValorParcelaFinal(value)}
                               placeholder="R$ 0,00"
                               className="imask-input"
                               scale={2}
                               radix=","
                               prefix="R$ "
                               thousandsSeparator="."
                               disabled={!secoesAposClienteDesbloqueadas}
                               unmask={true}
                             />
                           </div>
                        </div>
                      </div>
                 </div>
                 </section>
             )}

           {String(tipoOperacao) === "3" && (
            <section className={`form-section ${!cadastroPuxado && !enderecoCompleto ? "section-disabled" : ""}`}>
              <div className="section-title">Dados da Simulação</div>

              <div style={{display: 'flex', gap: '20px', marginBottom: '20px', flexDirection: 'column'}}>
                <div style={{flex: 1}}>
                  <div className="subsection-title" style={{marginBottom: '15px'}}>Parcelas</div>
                  {parcelas.map((parcela, index) => (
                    <div key={parcela.id} style={{display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'nowrap', marginBottom: '10px'}}>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>BANCO:</label>
                        <select value={parcela.bancoOrigem} onChange={(e) => { const n = [...parcelas]; n[index].bancoOrigem = e.target.value; setParcelas(n) }} disabled={!secoesAposClienteDesbloqueadas} required>
                          <option value="">Selecione</option>
                          {bancosDisponiveis.map((item) => (
                            <option key={item.codigo} value={item.codigo}>{item.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>Nº CONTRATO:</label>
                        <input
                          type="text"
                          placeholder="Nº contrato"
                          value={parcela.numeroContratoOrigem}
                          onChange={(e) => { const n = [...parcelas]; n[index].numeroContratoOrigem = e.target.value; setParcelas(n) }}
                          disabled={!secoesAposClienteDesbloqueadas}
                         required/>
                      </div>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>SALDO DEVEDOR:</label>
                            <IMaskInput
                              mask={Number}
                              value={parcela.saldoDevedor}
                              onAccept={(value) => { const n = [...parcelas]; n[index].saldoDevedor = value; setParcelas(n) }}
                              placeholder="R$ 0,00"
                              className="imask-input"
                              scale={2}
                              radix=","
                              prefix="R$ "
                              thousandsSeparator="."
                              disabled={!secoesAposClienteDesbloqueadas}
                              unmask={true}
                             required/>
                       </div>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>VALOR DE PARCELA:</label>
                        <IMaskInput
                           mask={Number}
                           value={parcela.valor}
                           onAccept={(value) => { const n = [...parcelas]; n[index].valor = value; setParcelas(n) }}
                           placeholder="R$ 0,00"
                           className="imask-input"
                           scale={2}
                           radix=","
                           prefix="R$ "
                           thousandsSeparator="."
                           disabled={!secoesAposClienteDesbloqueadas}
                           unmask={true}
                          required/>
                      </div>
                      <div className="field-group" style={{flex: 1, minWidth: 0}}>
                        <label>PARCELAS RESTANTES:</label>
                        <select 
                          value={parcela.numero} 
                          onChange={(e) => { const n = [...parcelas]; n[index].numero = e.target.value; setParcelas(n) }} 
                          disabled={!secoesAposClienteDesbloqueadas}
                         required>
                          <option value="">Selecione</option>
                          {Array.from({ length: 96 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num + "x"}>{num}x</option>
                          ))}
                        </select>
                      </div>
                      {parcelas.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removerParcela(parcela.id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#d9534f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                    <div style={{display: 'flex', justifyContent: 'flex-start', marginTop: '10px', alignItems: 'center', gap: '15px'}}>
                    <button 
                      type="button" 
                      onClick={adicionarParcela}
                      style={{
                        padding: '5px 15px',
                        backgroundColor: '#4a4a7d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Adicionar
                    </button>
                    {String(tipoProduto) === "5" && (
                      <>
                    <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px'}}>
                      <input
                        type="checkbox"
                        checked={agregarMargem === 'sim'}
                        onChange={(e) => setAgregarMargem(e.target.checked ? 'sim' : '')}
                        disabled={!secoesAposClienteDesbloqueadas}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#3f3b6c'
                        }}
                      />
                      AGREGAR MARGEM
                    </label>
                    {agregarMargem === 'sim' && (
                      <div className="field-group" style={{marginBottom: 0}}>
                   <label>VALOR DA MARGEM AGREGADA:</label>
                        <IMaskInput
                           mask={Number}
                           value={valorMargemAgregada}
                           onAccept={(value) => setValorMargemAgregada(value)}
                           placeholder="R$ 0,00"
                           className="imask-input"
                           scale={2}
                           radix=","
                           prefix="R$ "
                           thousandsSeparator="."
                           disabled={!secoesAposClienteDesbloqueadas}
                           unmask={true}
                          required/>
                      </div>
                    )}
                      </>
                    )}
                  </div>
                </div>

                 <div style={{flex: 1}}>
                   <div className="subsection-title">Operação</div>
                  <div className="grid-row">
                       <div className="field-group">
                         <label>VALOR LIBERADO:</label>
                         <IMaskInput
                           mask={Number}
                           value={valorLiberado}
                           onAccept={(value) => setValorLiberado(value)}
                            placeholder="R$ 0,00"
                            className="imask-input"
                            scale={2}
                            radix=","
                            prefix="R$ "
                            thousandsSeparator="."
                             disabled={!secoesAposClienteDesbloqueadas}
                             unmask={true}
                            required/>
                         </div>

                         <div className="field-group">
                            <label>PRAZO:</label>
                          <select value={prazo} onChange={(e) => setPrazo(e.target.value)} disabled={!secoesAposClienteDesbloqueadas} className={formSubmitted && !prazo ? 'input-error' : ''} required>
                            <option value="">Selecione</option>
                            <option value="120">120</option>
                            <option value="108">108</option>
                            <option value="96">96</option>
                            <option value="84">84</option>
                            <option value="72">72</option>
                            <option value="60">60</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label>TPS:</label>
                         <IMaskInput
                           mask={Number}
                           value={tps}
                           onAccept={(value) => setTps(value)}
                           placeholder="R$ 0,00"
                           className="imask-input"
                           scale={2}
                           radix=","
                            prefix="R$ "
                            thousandsSeparator="."
                            disabled={!secoesAposClienteDesbloqueadas}
                            unmask={true}
                           required/>
                        </div>

                       <div className="field-group">
                          <label>SEGURO:</label>
                            <select value={seguro} onChange={(e) => setSeguro(e.target.value)} disabled={!secoesAposClienteDesbloqueadas || (String(tipoOperacao) === "3" && String(tipoProduto) === "4")} className={formSubmitted && !seguro ? 'input-error' : ''} required>
                             <option value="">Selecione</option>
                             <option value="sim">Sim</option>
                             <option value="nao">Não</option>
                           </select>
                         </div>

                        {String(tipoProduto) === "3" && (
                          <div className="field-group">
                            <label>MARGEM AGREGADA:</label>
                            <IMaskInput
                              mask={Number}
                              value={margemAgregada}
                              onAccept={(value) => setMargemAgregada(value)}
                              placeholder="R$ 0,00"
                              className="imask-input"
                              scale={2}
                              radix=","
                              prefix="R$ "
                              thousandsSeparator="."
                              disabled={!secoesAposClienteDesbloqueadas}
                              unmask={true}
                             required/>
                          </div>
                        )}

                            <div className="field-group">
                              <label>VALOR FINAL DE PARCELA:</label>
                              <IMaskInput
                                mask={Number}
                                value={valorParcelaFinal}
                                onAccept={(value) => setValorParcelaFinal(value)}
                                placeholder="R$ 0,00"
                                className="imask-input"
                                scale={2}
                                radix=","
                                prefix="R$ "
                                thousandsSeparator="."
                                disabled={!secoesAposClienteDesbloqueadas}
                                unmask={true}
                              />
                           </div>
                        </div>
                      </div>
                 </div>
                 </section>
             )}

           <section className={`form-section ${!cadastroPuxado && !enderecoCompleto ? "section-disabled" : ""}`}>
            <div className="section-title">Dados Bancários</div>
            <div className="grid-row">
              <div className="field-group">
                <label>BANCO:</label>
                <div className="input-with-button">
                  <select value={dadosBancarios.banco} onChange={(e) => setDadosBancarios({ ...dadosBancarios, banco: e.target.value })} disabled={!cadastroPuxado} className={formSubmitted && !dadosBancarios.banco ? 'input-error' : ''} required>
                    <option value="">Selecione o banco</option>
                    {bancosRecebimentoDisponiveis.map((item) => (
                       <option key={item.id} value={item.id}>{item.nome}</option>
                     ))}
                  </select>
                  <button className="btn-modal" onClick={() => setModalBancosRecebimentoAberto(true)} disabled={!cadastroPuxado}>...</button>
                </div>
              </div>
              <ModalBancoRecebimento
                isOpen={modalBancosRecebimentoAberto}
                onClose={() => setModalBancosRecebimentoAberto(false)}
                bancos={bancosRecebimentoDisponiveis}
                onSelect={(id) => { setDadosBancarios({ ...dadosBancarios, banco: id }); setModalBancosRecebimentoAberto(false) }}
              />
              <div className="field-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  AGÊNCIA:
                  {formSubmitted && (!dadosBancarios.agencia || dadosBancarios.agencia.length !== 4) && <span className="error-msg" style={{ fontSize: '11px', fontWeight: 'normal' }}>Deve ter 4 dígitos</span>}
                </label>
                <IMaskInput
                  mask="0000"
                  value={dadosBancarios.agencia}
                  onAccept={(value) => setDadosBancarios({ ...dadosBancarios, agencia: value })}
                  placeholder="0000"
                  className={`imask-input ${formSubmitted && (!dadosBancarios.agencia || dadosBancarios.agencia.length !== 4) ? 'input-error' : ''}`}
                  disabled={!secoesAposClienteDesbloqueadas}
                 required/>
              </div>
              <div className="field-group">
                <label>NÚMERO DA CONTA:</label>
                <input
                  type="text"
                  placeholder="00000"
                  value={dadosBancarios.numeroConta}
                  onChange={(e) => setDadosBancarios({ ...dadosBancarios, numeroConta: e.target.value })}
                  disabled={!cadastroPuxado}
                 required/>
              </div>
              <div className="field-group xsmall">
                <label>DV:</label>
                <IMaskInput
                  mask="0"
                  value={dadosBancarios.digitoVerificador}
                  onAccept={(value) => setDadosBancarios({ ...dadosBancarios, digitoVerificador: value })}
                  placeholder="0"
                  className="imask-input"
                  disabled={!secoesAposClienteDesbloqueadas}
                 required/>
              </div>
              <div className="field-group">
                <label>TIPO DE CONTA:</label>
                <select value={dadosBancarios.tipoConta} onChange={(e) => setDadosBancarios({ ...dadosBancarios, tipoConta: e.target.value })} disabled={!cadastroPuxado} className={formSubmitted && !dadosBancarios.tipoConta ? 'input-error' : ''} required>
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
              <div className={`mensagem ${mensagem.tipo}`}>
                {mensagem.texto}
              </div>
            )}
            <button className="btn-main" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "ENVIANDO..." : "CADASTRAR"}
            </button>
            <button className="btn-sub" onClick={handleCancelar} disabled={submitting}>CANCELAR</button>
            <button className="btn-sub" onClick={() => setPaginaAtual("inicio")} disabled={submitting}>VOLTAR</button>
          </div>
        </div>
      </div>

      {modalClienteAberto && (
        <div className="modal-overlay">
          <div className="modal-container">
            <header className="modal-header">
              <h2>Clientes Encontrados</h2>
            </header>
            <div className="modal-body">
              <div className="table-container">
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>CPF</th>
                      <th>Nome Completo</th>
                      <th>Matrícula</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadosCliente.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: "center", padding: "20px" }}>Nenhum cliente encontrado</td>
                      </tr>
                    ) : (
                      resultadosCliente.map((linha, idx) => (
                        <tr key={idx} className="modal-table-row" onClick={() => selecionarCliente(linha)} style={{ cursor: 'pointer' }}>
                          <td>{linha.cpf}</td>
                          <td>{linha.nomeCompleto}</td>
                          <td>{linha.numeroMatricula || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button className="btn-voltar-modal" onClick={() => setModalClienteAberto(false)}>FECHAR</button>
                {resultadosCliente.length === 0 ? (
                  <button className="btn-main" style={{ marginLeft: "10px" }} onClick={() => { setCadastroPuxado(true); setModalClienteAberto(false) }}>
                    CADASTRAR NOVO CLIENTE
                  </button>
                ) : (
                  <button className="btn-main" style={{ marginLeft: "10px" }} onClick={() => { const cpfAtual = cpf; const cpfValidoAtual = validarCPF(cpfAtual); limparDadosAposOperacao(); setCpf(cpfAtual); setCpfValido(cpfValidoAtual); setCadastroPuxado(true) }}>
                    ADICIONAR MATRÍCULA
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalErroAberto && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2>Campos obrigatórios</h2>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <p style={{ fontSize: 15, color: '#333' }}>{erroTexto}</p>
              <div className="modal-footer" style={{ justifyContent: 'center', marginTop: 20 }}>
                <button className="btn-voltar-modal" onClick={() => setModalErroAberto(false)}>OK</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalAddRefin && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{addRefinStep === 'ask' ? 'Cadastrar mais um Refinanciamento?' : 'Novo Refinanciamento'}</h2>
            </div>
            {addRefinStep === 'ask' ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
                <p style={{ fontSize: 15, color: '#333', marginBottom: 20 }}>Deseja cadastrar mais um Refinanciamento?</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 15 }}>
                  <button className="btn-salvar" onClick={() => setAddRefinStep('form')}>Sim</button>
                  <button className="btn-cancelar" onClick={() => { setModalAddRefin(false); setPaginaAtual('anexar-documento') }}>Não</button>
                </div>
              </div>
            ) : (
              <div className="modal-body" style={{ padding: '20px' }}>
                <div className="field-group" style={{ marginBottom: 15 }}>
                  <label>VALOR DE PARCELA:</label>
                  <IMaskInput mask={Number} value={addRefinValor} onAccept={(v) => setAddRefinValor(v)} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." unmask={true} />
                </div>
                <div className="field-group" style={{ marginBottom: 15 }}>
                  <label>VALOR LIBERADO:</label>
                  <IMaskInput mask={Number} value={addRefinLiberado} onAccept={(v) => setAddRefinLiberado(v)} placeholder="R$ 0,00" className="imask-input" scale={2} radix="," prefix="R$ " thousandsSeparator="." unmask={true} />
                </div>
                <div className="field-group" style={{ marginBottom: 15 }}>
                  <label>PRAZO:</label>
                  <IMaskInput mask={Number} value={addRefinPrazo} onAccept={(v) => setAddRefinPrazo(v)} placeholder="Meses" className="imask-input" />
                </div>
                <div className="field-group" style={{ marginBottom: 15 }}>
                  <label>TPS:</label>
                  <IMaskInput mask={Number} value={addRefinTps} onAccept={(v) => setAddRefinTps(v)} placeholder="0,00" className="imask-input" scale={2} radix="," thousandsSeparator="." />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button className="btn-cancelar" onClick={() => { setModalAddRefin(false); setPaginaAtual('anexar-documento') }}>Fechar</button>
                  <button className="btn-salvar" onClick={handleAddRefinCadastrar} disabled={addRefinSubmitting}>
                    {addRefinSubmitting ? 'CADASTRANDO...' : 'CADASTRAR'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mensagemModal.visivel && (
        <div className="success-modal-overlay">
          <div className={`success-modal-content ${mensagemModal.tipo === "sucesso" ? "modal-sucesso" : "modal-erro"}`}>
            <h3>{mensagemModal.tipo === "sucesso" ? "Sucesso!" : "Erro"}</h3>
            <p>{mensagemModal.texto}</p>
            <button className="success-modal-btn" onClick={() => {
              setMensagemModal({ visivel: false, tipo: "", texto: "" })
              if (mensagemModal.tipo === "sucesso") {
                setPaginaAtual("anexar-documento")
              }
            }}>
              OK
            </button>
                    </div>
                  </div>
            )}
    </>
  )
}

