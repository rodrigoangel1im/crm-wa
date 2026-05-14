import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import './CriarCampanha.css'

export default function CriarCampanha() {
  const [tipoCampanha, setTipoCampanha] = useState('')
  const [convenio, setConvenio] = useState('')
  const [canalRecebimento, setCanalRecebimento] = useState('')
  const [nomeBaseDrive, setNomeBaseDrive] = useState('')
  const [origemBase, setOrigemBase] = useState('')
  const [telefonia, setTelefonia] = useState('')
  const [nomeCampanha, setNomeCampanha] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [nomeBase, setNomeBase] = useState('')
  const [origemSms, setOrigemSms] = useState('')
  const [telefoniaSms, setTelefoniaSms] = useState('')
  const [nomeCampanhaTrafego, setNomeCampanhaTrafego] = useState('')
  const [criativo, setCriativo] = useState('')
  const [criativoArquivo, setCriativoArquivo] = useState(null)
  const [tiposCampanha, setTiposCampanha] = useState([])
  const [conveniosDisponiveis, setConveniosDisponiveis] = useState([])
  const [canaisRecebimento, setCanaisRecebimento] = useState([])
  const [whatsappNumbers, setWhatsappNumbers] = useState([])
  const [selectedWhatsapp, setSelectedWhatsapp] = useState([])

  useEffect(() => {
    supabase.from('tipo_campanha').select('id, nome').eq('ativo', true).order('nome').then(({ data }) => {
      if (data) setTiposCampanha(data)
    })
    supabase.from('convenio').select('id, nome').eq('ativo', true).order('nome').then(({ data }) => {
      if (data) setConveniosDisponiveis(data)
    })
    supabase.from('canal_recebimento').select('id, nome').eq('ativo', true).order('nome').then(({ data }) => {
      if (data) setCanaisRecebimento(data)
    })
    supabase.from('whatsapp').select('id, numero, tipo_numero:tipo_numero_id(nome), usuario:usuario_id(nome)').eq('ativo', true).order('numero').then(({ data, error }) => {
      if (error) console.error('Erro whatsapp:', error)
      console.log('WhatsApp data:', data)
      if (data) setWhatsappNumbers(data)
    })
  }, [])

  const toggleWhatsapp = (id) => {
    setSelectedWhatsapp((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const handleCadastrar = async () => {
    if (!tipoCampanha || !convenio || !canalRecebimento) {
      alert('Preencha todos os campos obrigatórios.')
      return
    }

    if (tipoCampanha === '3' && selectedWhatsapp.length === 0) {
      alert('Selecione pelo menos um número de WhatsApp.')
      return
    }

    let criativoPath = ''
    if (tipoCampanha === '4' && criativoArquivo) {
      const fileExt = criativoArquivo.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('criativos').upload(fileName, criativoArquivo)
      if (uploadError) {
        alert('Erro ao enviar arquivo: ' + uploadError.message)
        return
      }
      criativoPath = fileName
    }

    const { data: usuarioLogado } = await supabase.auth.getUser()
    let criadoPor = null
    if (usuarioLogado?.user?.id) {
      const { data: usuario } = await supabase.from('usuario').select('id').eq('auth_user_id', usuarioLogado.user.id).maybeSingle()
      if (usuario) criadoPor = usuario.id
    }

    const payload = {
      tipo_campanha_id: tipoCampanha,
      convenio_id: convenio,
      canal_recebimento_id: canalRecebimento,
      criado_por: criadoPor,
    }

    if (tipoCampanha === '1' || tipoCampanha === '5') {
      payload.nome_base_drive = nomeBaseDrive
      payload.origem_base = origemBase
      payload.telefonia = telefonia
    }

    if (tipoCampanha === '2' || tipoCampanha === '3') {
      payload.nome_campanha = nomeCampanha
      payload.mensagem = mensagem
      payload.nome_base = nomeBase
      payload.origem = origemSms
      payload.telefonia = telefoniaSms
    }

    if (tipoCampanha === '4') {
      payload.nome_campanha = nomeCampanhaTrafego
      payload.criativo = criativo
      payload.criativo_arquivo = criativoPath
    }

    const { data: campanha, error } = await supabase.from('campanha').insert(payload).select('id').single()

    if (error) {
      alert('Erro ao cadastrar: ' + error.message)
      return
    }

    if (tipoCampanha === '3') {
      if (selectedWhatsapp.length > 0) {
        const campanhaWhatsapp = selectedWhatsapp.map((wid) => ({
          campanha_id: campanha.id,
          whatsapp_id: wid,
        }))
        const { error: relError } = await supabase.from('campanha_whatsapp').insert(campanhaWhatsapp)
        if (relError) {
          alert('Erro ao vincular números: ' + relError.message)
          return
        }
      }
    }

    alert('Campanha cadastrada com sucesso!')
    setTipoCampanha('')
    setConvenio('')
    setCanalRecebimento('')
    setNomeBaseDrive('')
    setOrigemBase('')
    setTelefonia('')
    setNomeCampanha('')
    setMensagem('')
    setNomeBase('')
    setOrigemSms('')
    setTelefoniaSms('')
    setNomeCampanhaTrafego('')
    setCriativo('')
    setCriativoArquivo(null)
    setSelectedWhatsapp([])
  }

  const exibirDadosCampanha = tipoCampanha === '2' || tipoCampanha === '3'

  return (
    <div className="form-container">
      <header className="form-header">
        <h1>Criar Campanha</h1>
      </header>

      <div className="form-content">
        <section className="form-section">
          <div className="section-title">Dados da Proposta</div>
          <div className="grid-row">
            <div className="field-group">
              <label>TIPO DE CAMPANHA:</label>
              <select value={tipoCampanha} onChange={(e) => setTipoCampanha(e.target.value)}>
                <option value="">Selecione o tipo</option>
                {tiposCampanha.map((item) => (
                  <option key={item.id} value={item.id}>{item.nome}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label>CONVÊNIO:</label>
              <select value={convenio} onChange={(e) => setConvenio(e.target.value)}>
                <option value="">Selecione o convênio</option>
                {conveniosDisponiveis.map((item) => (
                  <option key={item.id} value={item.id}>{item.nome}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label>CANAL RECEBIMENTO:</label>
              <select value={canalRecebimento} onChange={(e) => setCanalRecebimento(e.target.value)}>
                <option value="">Selecione o canal</option>
                {canaisRecebimento.map((item) => (
                  <option key={item.id} value={item.id}>{item.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {(tipoCampanha === '1' || tipoCampanha === '5') && (
          <section className="form-section">
            <div className="section-title">Dados da Campanha</div>
            <div className="grid-row">
              <div className="field-group">
                <label>NOME BASE DRIVE:</label>
                <input
                  type="text"
                  value={nomeBaseDrive}
                  onChange={(e) => setNomeBaseDrive(e.target.value)}
                  placeholder="Nome da base no Drive"
                />
              </div>
              <div className="field-group">
                <label>ORIGEM BASE:</label>
                <input
                  type="text"
                  value={origemBase}
                  onChange={(e) => setOrigemBase(e.target.value)}
                  placeholder="Origem da base"
                />
              </div>
              <div className="field-group">
                <label>TELEFONIA:</label>
                <input
                  type="text"
                  value={telefonia}
                  onChange={(e) => setTelefonia(e.target.value)}
                  placeholder="Telefonia"
                />
              </div>
            </div>
            <button
              type="button"
              className="btn-drive"
              onClick={() => window.open('https://drive.google.com/drive/folders/1DHtRFrN_T8gpz8nff7RWfF5sBL_1VaiW?usp=drive_link', '_blank')}
            >
              Adicionar base no Drive
            </button>
          </section>
        )}

        {exibirDadosCampanha && (
          <section className="form-section">
            <div className="section-title">Dados da Campanha</div>
            <div className="grid-row">
              <div className="field-group">
                <label>NOME CAMPANHA:</label>
                <input
                  type="text"
                  value={nomeCampanha}
                  onChange={(e) => setNomeCampanha(e.target.value)}
                  placeholder="Nome da campanha"
                />
              </div>
              <div className="field-group">
                <label>NOME DA BASE:</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    value={nomeBase}
                    onChange={(e) => setNomeBase(e.target.value)}
                    placeholder="Nome da base"
                  />
                  <button
                    type="button"
                    className="btn-modal"
                    onClick={() => window.open('https://drive.google.com/drive/folders/1azLhl-vpz5ZjIvQ2kZ5B9noMLsvl_K5i?usp=drive_link', '_blank')}
                  >
                    ...
                  </button>
                </div>
              </div>
              <div className="field-group">
                <label>ORIGEM:</label>
                <input
                  type="text"
                  value={origemSms}
                  onChange={(e) => setOrigemSms(e.target.value)}
                  placeholder="Origem"
                />
              </div>
              <div className="field-group">
                <label>TELEFONIA:</label>
                <input
                  type="text"
                  value={telefoniaSms}
                  onChange={(e) => setTelefoniaSms(e.target.value)}
                  placeholder="Telefonia"
                />
              </div>
            </div>
            <div className="grid-row">
              <div className="field-group full-width">
                <label>MENSAGEM:</label>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Mensagem"
                  rows={4}
                />
              </div>
            </div>
          </section>
        )}

        {tipoCampanha === '3' && (
          <section className="form-section">
            <div className="section-title">Números de WhatsApp</div>
            {console.log('Renderizando tabela, total:', whatsappNumbers.length)}
            {whatsappNumbers.length === 0 ? (
              <p className="empty-msg">Nenhum número cadastrado.</p>
            ) : (
              <table className="whatsapp-table">
                <thead>
                  <tr>
                    <th>Checkbox</th>
                    <th>Número</th>
                    <th>Tipo</th>
                    <th>Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {whatsappNumbers.map((item) => (
                    <tr key={item.id} className={selectedWhatsapp.includes(item.id) ? 'selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedWhatsapp.includes(item.id)}
                          onChange={() => toggleWhatsapp(item.id)}
                        />
                      </td>
                      <td>{item.numero}</td>
                      <td><span className={`whatsapp-tipo ${item.tipo_numero?.nome}`}>{item.tipo_numero?.nome === 'oficial' ? 'Oficial' : 'Não Oficial'}</span></td>
                      <td>{item.usuario?.nome || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {tipoCampanha === '4' && (
          <section className="form-section">
            <div className="section-title">Dados da Campanha</div>
            <div className="grid-row">
              <div className="field-group">
                <label>NOME CAMPANHA:</label>
                <input
                  type="text"
                  value={nomeCampanhaTrafego}
                  onChange={(e) => setNomeCampanhaTrafego(e.target.value)}
                  placeholder="Nome da campanha"
                />
              </div>
              <div className="field-group">
                <label>CRIATIVO:</label>
                <input
                  type="text"
                  value={criativo}
                  onChange={(e) => setCriativo(e.target.value)}
                  placeholder="Nome do criativo"
                />
              </div>
            </div>
            <div className="grid-row">
              <div className="field-group full-width">
                <label>ANEXAR CRIATIVO:</label>
                <input
                  type="file"
                  onChange={(e) => setCriativoArquivo(e.target.files[0] || null)}
                  accept="image/*,.pdf,.doc,.docx,.mp4"
                />
              </div>
            </div>
          </section>
        )}

        <div className="form-actions">
          <button type="button" className="btn-cadastrar" onClick={handleCadastrar}>CADASTRAR</button>
        </div>
      </div>
    </div>
  )
}
