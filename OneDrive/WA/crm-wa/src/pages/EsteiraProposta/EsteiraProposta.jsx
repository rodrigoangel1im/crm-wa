import './EsteiraProposta.css'
import { supabase } from '../../lib/supabase'
import { useState, useEffect } from 'react'
import ModalDetalheProposta from '../../components/ModalDetalheProposta/ModalDetalheProposta'

export default function EsteiraProposta({ setPaginaAtual }) {
  const [propostas, setPropostas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalDetalheOpen, setModalDetalheOpen] = useState(false)
  const [modalDetalheId, setModalDetalheId] = useState(null)

  useEffect(() => {
    carregarPropostas()
  }, [])

  async function inserirPropostaTeste() {
    try {
      // Atenção: Para inserir na tabela proposta, você precisa ter IDs válidos nas tabelas relacionadas:
      // banco_credor_id, dados_bancarios_id, matricula_id, tipo_operacao_id, tipo_produto_id, usuario_digitador_id
      // Por enquanto, vamos apenas testar buscando um ID qualquer existente (ou usar NULL se a coluna permitir)
      
      // Buscar um ID de banco existente
      const { data: bancoData } = await supabase.from('banco_operacao').select('id').limit(1)
      const bancoId = bancoData?.[0]?.id || null
      
      // Buscar um ID de cliente e matrícula
      const { data: matriculaData } = await supabase.from('matricula').select('id').limit(1)
      const matriculaId = matriculaData?.[0]?.id || null
      
      // Buscar um ID de dados bancários
      const { data: dadosBancData } = await supabase.from('dados_bancarios').select('id').limit(1)
      const dadosBancariosId = dadosBancData?.[0]?.id || null
      
      // Buscar IDs de tipo_operacao e tipo_produto
      const { data: operacaoData } = await supabase.from('tipo_operacao').select('id').limit(1)
      const operacaoId = operacaoData?.[0]?.id || null
      
      const { data: produtoData } = await supabase.from('tipo_produto').select('id').limit(1)
      const produtoId = produtoData?.[0]?.id || null
      
      // Buscar um ID de usuario
      const { data: usuarioData } = await supabase.from('usuario').select('id').limit(1)
      const usuarioId = usuarioData?.[0]?.id || null
      
      const novaProposta = {
        numero_proposta_banco: '2025' + Date.now().toString().slice(-6),
        banco_credor_id: bancoId,
        dados_bancarios_id: dadosBancariosId,
        matricula_id: matriculaId,
        tipo_operacao_id: operacaoId,
        tipo_produto_id: produtoId,
        usuario_digitador_id: usuarioId,
        proposta_status_id: 1, // Em Análise
        valor_liberado: 7500.00,
        valor_liberado_real: null,
        parcela_real: null,
        numero_parcelas_real: null
      }
      
      const { data, error } = await supabase
        .from('proposta')
        .insert([novaProposta])
        .select()
      
      if (error) throw error
      
      console.log('Proposta inserida com sucesso:', data)
      alert('Proposta cadastrada com sucesso!')
      carregarPropostas() // Recarrega a lista
    } catch (error) {
      console.error('Erro ao inserir proposta:', error)
      alert('Erro ao cadastrar: ' + error.message)
    }
  }

  async function carregarPropostas() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('proposta')
        .select(`
          id,
          numero_proposta_banco,
          proposta_status_id,
          proposta_status:proposta_status_id (nome, cor, historico),
          valor_liberado,
          atualizado_em,
          matricula (
            cliente (nome_completo, cpf),
            convenio (nome)
          ),
          banco_credor:banco_credor_id (nome),
          tipo_operacao:tipo_operacao_id (nome)
        `)
        .order('atualizado_em', { ascending: false })

      if (error) throw error

      const propostasFormatadas = data.map(item => ({
        id: item.id,
        adeWa: item.id,
        propostaBanco: item.numero_proposta_banco,
        nomeCliente: item.matricula?.cliente?.nome_completo || 'N/A',
        cpf: item.matricula?.cliente?.cpf || 'N/A',
        status: item.proposta_status?.nome || 'N/A',
        statusCor: item.proposta_status?.cor || '#333',
        statusHistorico: item.proposta_status?.historico || '',
        valorLiberado: item.valor_liberado,
        banco: item.banco_credor?.nome || 'N/A',
        operacao: item.tipo_operacao?.nome || 'N/A',
        convenio: item.matricula?.convenio?.nome || 'N/A',
        dataAtualizacao: item.atualizado_em ? item.atualizado_em.split('T')[0] : '',
        horaAtualizacao: item.atualizado_em ? new Date(item.atualizado_em).toTimeString().split(' ')[0].slice(0,5) : ''
      }))

      setPropostas(propostasFormatadas)
    } catch (error) {
      console.error('Erro ao carregar propostas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = (status) => {
    if (status === 'Aprovado') return 'status-aprovado'
    if (status === 'Em Análise') return 'status-analise'
    if (status === 'Reprovado') return 'status-reprovado'
    if (status === 'Cancelado') return 'status-cancelado'
    if (status === 'Pendente') return 'status-pendente'
    return ''
  }

  const handleStatusClick = (item) => {
    localStorage.setItem('propostaSelecionada_crmwa', JSON.stringify(item))
    setPaginaAtual('status-proposta')
  }

  const handleAdeWaClick = (item) => {
    localStorage.setItem('propostaSelecionada_crmwa', JSON.stringify(item))
    setPaginaAtual('detalhe-proposta')
  }

  if (loading) {
    return (
      <div className="form-container">
        <header className="form-header">
          <h1>Esteira de Proposta</h1>
        </header>
        <div className="form-content" style={{ width: '95%', maxWidth: '1500px' }}>
          <p style={{ textAlign: 'center', padding: '50px' }}>Carregando propostas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="form-container">
      <header className="form-header">
        <h1>Esteira de Proposta</h1>
      </header>

      <div className="form-content" style={{ width: '95%', maxWidth: '1500px' }}>
        <div className="status-badge">Aprovação / Consulta</div>

        <div className="filtros-wrapper">
          <div className="campo-grupo">
            <label>Pesquisar por:</label>
            <select className="input-estilizado" style={{ width: '250px' }}>
              <option>Selecione o tipo de pesquisa</option>
              <option>Nome do Cliente</option>
              <option>CPF</option>
              <option>Proposta Banco</option>
              <option>Status</option>
              <option>Convênio</option>
            </select>
          </div>

          <div className="campo-grupo" style={{ flexGrow: 1 }}>
            <label>Proposta:</label>
            <input type="text" className="input-estilizado" placeholder="Digite para pesquisar..." />
          </div>

          <button className="btn-pesquisar">Pesquisar</button>
          <button className="btn-pesquisar" onClick={inserirPropostaTeste} style={{ backgroundColor: '#28a745', marginLeft: '10px' }}>
            + Testar Cadastro
          </button>
        </div>

        <div className="tabela-container">
          <table className="tabela-propostas">
            <thead>
              <tr>
                <th>ADE WA</th>
                <th>Proposta banco</th>
                <th>Nome cliente</th>
                <th>CPF</th>
                <th>Hist.</th>
                <th>Status</th>
                <th>Valor Liberado</th>
                <th>Banco</th>
                <th>Operação</th>
                <th>Convênio</th>
                <th>Data da última atualização</th>
                <th>Hora da última atualização</th>
                <th>Usuário digitador</th>
              </tr>
            </thead>
            <tbody>
              {propostas.map((item) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{ cursor: 'pointer', color: '#000', fontWeight: 'bold' }}
                      onClick={() => handleAdeWaClick(item)}
                    >
                      {item.adeWa}
                    </span>
                  </td>
                  <td>{item.propostaBanco}</td>
                  <td>{item.nomeCliente.toUpperCase()}</td>
                  <td>{item.cpf}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#3f3b6c', fontSize: '14px', cursor: 'pointer' }} onClick={() => { setModalDetalheId(item.id); setModalDetalheOpen(true) }}>
                    {item.statusHistorico}
                  </td>
                  <td>
                    <span
                      className="status-tag"
                      style={{ cursor: 'pointer', color: item.statusCor, fontWeight: 'bold' }}
                      onClick={() => handleStatusClick(item)}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="valor-cell">
                    {item.valorLiberado?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td>{item.banco}</td>
                  <td>{item.operacao}</td>
                  <td>{item.convenio}</td>
                  <td>{item.dataAtualizacao}</td>
                  <td>{item.horaAtualizacao}</td>
                  <td>{item.usuarioDigitador}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalDetalheProposta
        isOpen={modalDetalheOpen}
        onClose={() => setModalDetalheOpen(false)}
        propostaId={modalDetalheId}
      />
    </div>
  )
}
