import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfjsWorker

export async function extrairTextoPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument(arrayBuffer).promise
  let textoCompleto = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    textoCompleto += content.items.map(item => item.str).join(' ') + '\n'
  }
  return textoCompleto
}

export async function extrairTextoPDFDebug(file) {
  const texto = await extrairTextoPDF(file)
  console.log('=== TEXTO EXTRAÍDO DO PDF ===')
  console.log(texto.slice(0, 5000))
  console.log('=== FIM (5000 chars) ===')
  return texto
}

function limparValorMonetario(valor) {
  if (!valor) return null
  const limpo = valor
    .replace(/^R?\$?\s*/, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.\-]/g, '')
  const num = parseFloat(limpo)
  return isNaN(num) ? null : parseFloat(num.toFixed(2))
}

function limparCPF(valor) {
  if (!valor) return null
  return valor.replace(/\D/g, '').slice(0, 11)
}

// ===================== HISCON (INSS) =====================

export function extrairDadosHiscon(texto) {
  const nomeMatch = texto.match(/CONSIGNADO\s+([A-ZÀ-Ú\s]+?)\s+Benefício/i)
  const infos = {
    nome: nomeMatch ? nomeMatch[1].trim() : null,
    cpf: null,
  }

  const nBeneficio = texto.match(/N[º°]?\s*Benefício[:\s]*([0-9.\-]+)/i)
  const beneficioTipo = texto.match(/Benefício\s+([A-ZÀ-Ú\s]+?)\s+N[º°]?\s*Benefício/i)

  const matriculas = []

  const valoresHiscon = texto.match(/VALORES DO BENEFÍCIO.*?R?\$?([0-9.,]+)\s*R?\$?([0-9.,]+)\s*R?\$?([0-9.,]+)/i)
  const maxPermitido = valoresHiscon ? limparValorMonetario(valoresHiscon[2]) : null
  const totalComprometido = valoresHiscon ? limparValorMonetario(valoresHiscon[3]) : null
  const margem = (maxPermitido != null && totalComprometido != null)
    ? maxPermitido - totalComprometido
    : null

  const rawMat = nBeneficio ? nBeneficio[1].replace(/\D/g, '') : ''
  const matricula = rawMat.padStart(10, '0')

  const situacaoMatch = texto.match(/Situação[:\s]*(\w+)/i)

  matriculas.push({
    matricula,
    margem,
    orgao: beneficioTipo ? beneficioTipo[1].trim() : 'INSS',
    situacao: situacaoMatch ? situacaoMatch[1] : 'Ativo',
  })

  const contratos = []
  const linhas = texto.split('\n')
  let emAtivos = false
  let emExcluidos = false
  let headerEncontrado = false

  const agora = new Date()
  const mesAtual = agora.getMonth() + 1
  const anoAtual = agora.getFullYear()

  const contratoRe = /(?<![,\d])(\d{2}\/\d{4})\s+(\d{2,3})\s+R\$\s*(\d{1,3}(?:\.\d{3})*(?:\s*,\s*\d{2})?)/gi

  for (const linha of linhas) {
    const trimmed = linha.trim()
    if (/CONTRATOS ATIVOS E SUSPENSOS/i.test(trimmed)) {
      emAtivos = true
      emExcluidos = false
      headerEncontrado = false
    }
    if (/CONTRATOS EXCLUÍDOS E ENCERRADOS/i.test(trimmed)) {
      emAtivos = false
      emExcluidos = true
      headerEncontrado = false
    }
    if (/CARTÃO DE CRÉDITO|RESUMO|TOTAL\b/i.test(trimmed)) {
      emAtivos = false
      emExcluidos = false
    }
    if (emAtivos && trimmed.length > 20 && !trimmed.startsWith('*')) {
      if (!headerEncontrado && /CONTRATO|CONTRA TO/i.test(trimmed)) {
        headerEncontrado = true
      }
      if (headerEncontrado) {
        const matches = [...trimmed.matchAll(contratoRe)]
        for (const m of matches) {
          const endDate = m[1]
          const prazo = parseInt(m[2])
          if (prazo >= 12 && prazo <= 480) {
            const [endMes, endAno] = endDate.split('/').map(Number)
            const prazo_restante = (endAno - anoAtual) * 12 + (endMes - mesAtual)
            const beforeText = trimmed.substring(0, m.index)
            const bankMatches = [...beforeText.matchAll(/(\d{3,4})\s*-\s*([A-ZÀ-Ú\u00c0-\u00da][A-ZÀ-Ú\u00c0-\u00da\s\d]*?)(?=\s+\d{2}\/\d{4})/gi)]
            const bank = bankMatches.length > 0 ? bankMatches[bankMatches.length - 1] : null
            const linha_emprestimo = bank ? `${bank[1]} - ${bank[2].trim()}` : null

            const afterText = trimmed.substring(m.index + m[0].length)
            const rateMatch = afterText.match(/(\d{1,2},\d{2})\s+(\d{1,3},\d{2})\s+(\d{1,2},\d{2})\s+(\d{1,3},\d{2})\s+R\$/i)
            const obs = rateMatch ? `${rateMatch[3]}%` : null

            contratos.push({
              contrato: null,
              linha_emprestimo,
              obs,
              valor_parcela: limparValorMonetario(m[3].replace(/\s+/g, '')),
              prazo_restante,
              prazo_original: prazo,
            })
          }
        }
      }
    }
  }

  return {
    informacoes_pessoais: infos,
    matriculas,
    contratos,
    textoOriginal: texto,
  }
}

// ===================== SIAPE EXTRATO CONSIGNAÇÃO =====================

function extrairValoresMargem(texto) {
  const margemSection = texto.match(/Utilizada Cartão\s+([\d\sR\$.,]+?)(?:Extrato de Consignações|Bruta Cartão Benefício)/i)
  if (!margemSection) return {}

  const valores = margemSection[1].match(/R?\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/g)
  if (!valores || valores.length < 8) return {}

  const v = valores.map(v => limparValorMonetario(v))
  return {
    brutaCompulsoria: v[0],
    liquidaComp: v[1],
    brutaFacult: v[2],
    liquidaFacult: v[3],
    brutaCartao: v[4],
    liquidaCartao: v[5],
    utilizadaFac: v[6],
    utilizadaCartao: v[7],
  }
}

function extrairValoresCartaoBeneficio(texto) {
  const m = texto.match(/Utilizada Cartão Benefício\s*R?\$?\s*([0-9.,]+)/i)
  return m ? limparValorMonetario(m[1]) : 0
}

function extrairSecaoHeader(texto) {
  const t = texto.replace(/\s+/g, ' ').trim()
  const headerMatch = t.match(/Órgão\s+CPF\s+Matrícula\s+Nome\s+(.+?)\s+Bruta\s+Compulsória/i)
  if (!headerMatch) return {}
  const valores = headerMatch[1].trim()

  const cpfMatch = valores.match(/(\d{3}\.\d{3}\.\d{3}-\d{2})/)
  const cpf = cpfMatch ? cpfMatch[1].replace(/\D/g, '') : null

  const parts = cpfMatch ? valores.split(cpfMatch[1]) : [valores]
  const antesCPF = parts[0].trim()
  const depoisCPF = parts[1]?.trim() || ''

  const orgaoPartes = antesCPF.split(/\s+/)
  let orgao = ''
  if (orgaoPartes.length >= 3 && orgaoPartes[1] === '-') {
    orgao = orgaoPartes.slice(0, 3).join(' ') + ' ' + orgaoPartes.slice(3).join(' ')
  }
  orgao = orgao.trim()

  const depoisParts = depoisCPF.split(/\s+/)
  const matricula = depoisParts.find(p => /^\d{5,}(?:\/\d+)?$/.test(p)) || ''

  // Pensionista: parte após a barra é a matrícula (ex: 869902/8834 → 8834)
  let matriculaNormalizada = matricula
  if (matricula) {
    const barraIdx = matricula.indexOf('/')
    if (barraIdx !== -1) {
      matriculaNormalizada = matricula.slice(barraIdx + 1)
    }
  }

  const nome = depoisParts
    .filter(p => !/^\d+$/.test(p) && !/^\d{5,}(?:\/\d+)?$/.test(p))
    .join(' ')
    .trim()

  return { orgao, cpf, matricula: matriculaNormalizada, nome }
}

export function extrairDadosExtratoConsignacao(texto, items = []) {
  const header = extrairSecaoHeader(texto)
  const margemVals = extrairValoresMargem(texto)
  const utilizadaCartaoBen = extrairValoresCartaoBeneficio(texto)

  const brutaFacult = margemVals.brutaFacult ?? 0
  const utilizadaFac = margemVals.utilizadaFac ?? 0
  const utilizadaCartao = margemVals.utilizadaCartao ?? 0
  const liquidaComp = margemVals.liquidaComp
  let margem = brutaFacult - utilizadaFac - utilizadaCartao - (utilizadaCartaoBen ?? 0)
  if (liquidaComp != null && margem > liquidaComp) {
    margem = liquidaComp
  }

  const contratos = items.length > 50
    ? extrairContratosPorCoordenadas(items)
    : extrairContratosFallback(texto)

  return {
    informacoes_pessoais: { nome: header.nome, cpf: header.cpf },
    matriculas: [{ matricula: header.matricula, margem, orgao: header.orgao, situacao: 'Ativo' }],
    contratos,
    textoOriginal: texto,
  }
}

/**
 * Extrai contratos usando coordenadas X/Y dos itens do PDF.
 *
 * No extrato SIAPE, cada campo da tabela (contrato, rubrica, parcela, valor)
 * está num Y diferente, mas campos do mesmo contrato compartilham o mesmo X.
 * Agrupamos por X para reconstruir cada linha.
 */
function extrairContratosPorCoordenadas(items) {
  const TOL = 6

  // Rubricas como âncora: cada rubrica = um contrato
  const rubricas = items
    .filter(it => it.x0 >= 150 && /^\d{4,5}\s*-\s*[A-ZÀ-Ú]/.test(it.str.trim()))
    .sort((a, b) => a.x0 - b.x0)

  // Parcelas: padrão "NN/NN" ou "NN/NNN"
  const parcelas = items
    .filter(it => /^\d{1,3}\/\d{1,3}$/.test(it.str.trim()))
    .sort((a, b) => a.x0 - b.x0)

  // Valores: "R$ N.NNN,NN" ou "R$ NN,NN"
  const valores = items
    .filter(it => {
      const s = it.str.trim()
      if (!/^R?\$?\s*[\d.]+,\d{2}$/.test(s)) return false
      if (it.x0 < 150) return false
      return true
    })
    .sort((a, b) => a.x0 - b.x0)

  const contratos = []

  for (const rub of rubricas) {
    const x = rub.x0

    // Número do contrato: qualquer item sem espaços na mesma coluna (y<140)
    const ct = items.find(it => {
      if (Math.abs(it.x0 - x) > TOL) return false
      if (it.y >= 140) return false
      if (it.x0 < 150) return false
      const s = it.str.trim()
      return s.length > 0 && !s.includes(' ')
    })

    const par = parcelas.find(p => Math.abs(p.x0 - x) <= TOL)
    const val = valores.find(v => Math.abs(v.x0 - x) <= TOL)

    let prazoRestante = null
    let prazoOriginal = null
    if (par) {
      const [atual, total] = par.str.split('/').map(Number)
      if (total && atual >= 0) {
        prazoRestante = total - atual
        prazoOriginal = total
      }
    }

    const rubStr = rub.str.trim()
    const obs = /CARTAO|AMORT/i.test(rubStr) ? 'Cartão' : null

    contratos.push({
      contrato: ct ? (ct.str.match(/\d{4,}/)?.[0] ?? ct.str).replace(/^0+/, '') : null,
      linha_emprestimo: rubStr,
      valor_parcela: val ? limparValorMonetario(val.str) : null,
      prazo_restante: prazoRestante,
      prazo_original: prazoOriginal,
      obs,
    })
  }

  return contratos
}

/**
 * Fallback para quando items não estão disponíveis (compatibilidade).
 */
function extrairContratosFallback(texto) {
  const contratos = []
  const linhaContrato = /(\d{4,20})\s+(3\d{4}\s*-\s*[A-ZÀ-Ú][A-ZÀ-Ú\s\-]+?)\s+\d{1,2}\s+\d{1,2}\s+\d{2}\/\d{2}\/\d{4}/g
  let m
  while ((m = linhaContrato.exec(texto)) !== null) {
    contratos.push({
      contrato: m[1].replace(/^0+/, ''),
      linha_emprestimo: m[2].trim(),
      valor_parcela: null,
      prazo_restante: null,
      prazo_original: null,
      obs: null,
    })
  }
  return contratos
}

// ===================== SIAPE CONTRACHEQUE =====================

const SITUACAO_VALUES = ['ATIVO', 'INATIVO', 'APOSENTADO', 'PENSIONISTA', 'RESERVISTA', 'NORMAL']

function extrairSituacaoFuncional(items) {
  if (!items?.length) return null
  const label = items.find(i => /SITUAÇÃO FUNCIONAL/i.test(i.str))
  if (!label) return null
  const colX = label.x
  const colY = label.y
  const situacao = items
    .filter(i => i.x >= colX - 30 && i.x <= colX + 30 && i.y < colY && i.str.trim().length > 0)
    .sort((a, b) => b.y - a.y)[0]
  return situacao?.str || null
}

export function extrairDadosContracheque(texto, items) {
  const t = texto.replace(/\s+/g, ' ')

  const nome = matchCampo(t, /NOME DO SERVIDOR[:\s]+([A-ZÀ-Ú\s]{10,}?)(?:\s+MAT)/i)
    || matchCampo(t, /NOME DO BENEFICI[ÁA]RIO[:\s]+([A-ZÀ-Ú\s]{10,}?)(?:\s+MATR[IÍ]CULA)/i)
    || matchCampo(t, /NOME DO SERVIDOR[:\s]+([A-ZÀ-Ú\s]{10,}?)(?:\s+\d)/i)

  const cpf = limparCPF(matchCampo(t, /CPF\s*([0-9]{3}\.?[0-9]{3}\.?[0-9]{3}\-?[0-9]{2})/i))

  const matSiape = matchCampo(t, /MAT[.\s]*SIAPE[:\s]*([\d]+)/i)
    || matchCampo(t, /MATRICULA SIAPE[:\s]*([\d]+)/i)
  const matSiapeCurto = t.match(/(\d{7})\s+[A-ZÀ-Ú]/)?.[1]

  const orgao = t.match(/POLICIA MILITAR|BOMBEIRO|DEP[\s.]+CENTRAL/i)?.[0]

  const liquidoM = t.match(/L[IÍ]QUIDO[:\s]*R?\$?\s*([0-9.,]+)/i)
  const brutoM = t.match(/BRUTO[:\s]*R?\$?\s*([0-9.,]+)/i)

  const margem = limparValorMonetario(liquidoM?.[1])

  const situacao = extrairSituacaoFuncional(items)
    || t.match(new RegExp(`SITUAÇÃO FUNCIONAL\\s+(${SITUACAO_VALUES.join('|')})`, 'i'))?.[1]
    || SITUACAO_VALUES.find(v => new RegExp(`\\b${v}\\b`).test(t.slice(t.indexOf('CARGO') + 5, t.indexOf('DISCRIMINAÇÃO'))))
    || 'Ativo'

  const matriculas = [{
    matricula: matSiape || matSiapeCurto,
    margem,
    orgao: orgao || null,
    situacao,
  }]

  const contratos = []
  const linhas = texto.split('\n')
  let emDescontos = false

  for (const linha of linhas) {
    const s = linha.trim()
    if (/DESCONTOS\s/.test(s)) {
      emDescontos = true
      continue
    }
    if (emDescontos) {
      if (/BASE C[ÁA]LCULO|Este contracheque|Autentica[cç][aã]o/i.test(s)) {
        emDescontos = false
        continue
      }
      const valorM = s.match(/(\d{1,3}(?:\.\d{3})*,\d{2})\s+(.+)/)
      if (valorM) {
        const descricao = valorM[2].trim()
        const rubrica = s.match(/^(\d+)\s/)?.[1]
        if (/EMPREST|AMORT|PENS[ÃA]O|IMPOSTO|CONTRIBUICAO|FUNDO|CARTAO|CARTAO/.test(descricao)) {
          contratos.push({
            contrato: rubrica || null,
            linha_emprestimo: descricao,
            valor_parcela: limparValorMonetario(valorM[1]),
            prazo_restante: null,
            prazo_original: null,
          })
        }
      }
    }
  }

  return {
    informacoes_pessoais: { nome, cpf },
    matriculas,
    contratos,
    textoOriginal: texto,
  }
}

function matchCampo(texto, regex, grupo = 1) {
  const match = texto.match(regex)
  return match ? match[grupo].trim() : null
}

export function detectarTipoPDF(texto) {
  const t = texto.replace(/\s+/g, ' ').trim()
  if (/HISTORICO.*EMPRESTIMO.*CONSIGNADO/i.test(t)
    || /HISTÓRICO.*EMPRÉSTIMO.*CONSIGNADO/i.test(t)) return 'hiscon'
  if (/COMPROVANTE.*RENDIMENTOS.*FOLHA/i.test(t)
    || /COMPROVANTE.*RENDIMENTOS.*BENEFICIARIO/i.test(t)
    || /COMPROVANTE.*RENDIMENTOS.*BENEFICIÁRIO/i.test(t)) return 'contracheque'
  if (/Extrato de Consignações Vigentes|Demonstrativo de uso da margem|Margem.*Cartão|Bruta.*Compulsória/i.test(t)
    && !/HISCON|HISTORICO.*EMPRESTIMO/i.test(t)) return 'extrato_consignacao'
  if (/NOME DO SERVIDOR|MATRICULA.*SIAPE|CONTRACHEQUE/i.test(t)) return 'contracheque'
  if (/ORGAO.*CPF.*MATRICULA.*NOME/i.test(t)
    || /ÓRGÃO.*CPF.*MATRÍCULA.*NOME/i.test(t)
    || /POLICIA MILITAR|BOMBEIRO|CARGO.*REF.*PADRAO/i.test(t)) return 'extrato_consignacao'
  return 'extrato_consignacao'
}

export function extrairDados(texto, items) {
  const tipo = detectarTipoPDF(texto)
  switch (tipo) {
    case 'hiscon':
      return extrairDadosHiscon(texto)
    case 'extrato_consignacao':
      return extrairDadosExtratoConsignacao(texto, items)
    case 'contracheque':
      return extrairDadosContracheque(texto, items)
    default:
      return extrairDadosExtratoConsignacao(texto, items)
  }
}

async function extrairTextoEItems(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument(arrayBuffer).promise
  const allItems = []
  let textoSimples = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    textoSimples += content.items.map(item => item.str).join(' ') + '\n'
    allItems.push(
      ...content.items.map(item => ({
        str: item.str,
        x: item.transform?.[4] ?? 0,
        x0: item.transform?.[4] ?? 0,
        x1: (item.transform?.[4] ?? 0) + (item.width ?? 0),
        y: item.transform?.[5] ?? 0,
        page: i,
      }))
    )
  }

  return { texto: textoSimples, items: allItems }
}

export async function processarPDFSimulacao(file, convenioId, inssId) {
  const { texto, items } = await extrairTextoEItems(file)
  const dados = extrairDados(texto, items)
  return { tipoDocumento: 'pdf', dados }
}

export async function extrairDadosCompletos(files, convenioId, inssId) {
  let informacoesPessoais = { nome: null, cpf: null, telefone: null }
  const todasMatriculas = []
  const todosContratos = []

  for (const file of files) {
    try {
      const result = await processarPDFSimulacao(file, convenioId, inssId)
      if (result.dados.informacoes_pessoais.nome) informacoesPessoais.nome = result.dados.informacoes_pessoais.nome
      if (result.dados.informacoes_pessoais.cpf && !informacoesPessoais.cpf) informacoesPessoais.cpf = result.dados.informacoes_pessoais.cpf
      if (result.dados.matriculas) {
        for (const novaMat of result.dados.matriculas) {
          const existente = todasMatriculas.find(m => m.matricula === novaMat.matricula)
          if (existente) {
            existente.situacao = novaMat.situacao ?? existente.situacao
            if (novaMat.margem != null && existente.margem == null) existente.margem = novaMat.margem
          } else {
            todasMatriculas.push(novaMat)
          }
        }
      }
      if (result.dados.contratos) todosContratos.push(...result.dados.contratos)
    } catch (err) {
      console.error(`Erro ao processar ${file.name}:`, err)
    }
  }

  return { informacoesPessoais, matriculas: todasMatriculas, contratos: todosContratos }
}
