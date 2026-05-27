import React from 'react'

export default function ModalFormUsuario({ editando, form, setForm, erro, tipoPerfis }) {
  const alterar = (campo, valor) => setForm({ ...form, [campo]: valor })

  const renderInput = (campo, label, type = 'text', placeholder = '', opts = {}) => (
    <div className="form-group" style={{ flex: opts.flex || 1, minWidth: opts.minWidth || 0 }}>
      <label>{label}</label>
      <input type={type} value={form[campo] || ''} onChange={(e) => alterar(campo, e.target.value)} placeholder={placeholder} />
    </div>
  )

  return (
    <div>
      {erro && (
        <div style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12, padding: '8px 12px', backgroundColor: '#fdf0ef', borderRadius: 6, border: '1px solid #f5c6cb' }}>
          {erro}
        </div>
      )}

      <div className="modal-section-title">Controle de Acesso</div>
      <div className="form-row">
        {renderInput('nome', 'Nome', 'text', 'Nome completo')}
      </div>
      <div className="form-row">
        {renderInput('email', 'E-mail', 'email', 'email@exemplo.com')}
      </div>
      {!editando && (
        <div className="form-row">
          {renderInput('senha', 'Senha', 'password', 'Deixe em branco para 123456')}
        </div>
      )}
      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Perfil</label>
          <select value={form.tipo_perfil_id ?? ''} onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null
            const perfil = tipoPerfis.find(t => t.id === id)
            alterar('tipo_perfil_id', id)
            alterar('perfil', perfil ? perfil.nome : '')
          }} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
            <option value="">Selecione um perfil</option>
            {tipoPerfis.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row" style={{ marginTop: 12 }}>
        <label className="checkbox-label">
          <input type="checkbox" checked={form.ativo} onChange={(e) => alterar('ativo', e.target.checked)} />
          Usuário ativo
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={form.admin} onChange={(e) => alterar('admin', e.target.checked)} />
          Administrador
        </label>
      </div>
      <div className="form-row">
        {renderInput('id_ponto', 'ID Ponto', 'number', 'ID do funcionário no ponto')}
      </div>

      <div className="modal-section-title">Dados Pessoais</div>
      <div className="form-row">
        {renderInput('cpf', 'CPF', 'text', '000.000.000-00')}
        {renderInput('rg', 'RG', 'text', '00.000.000-0')}
        {renderInput('data_nascimento', 'Data Nascimento', 'date')}
      </div>
      <div className="form-row">
        {renderInput('telefone', 'Telefone', 'text', '(00) 00000-0000')}
        {renderInput('telefone2', 'Telefone 2', 'text', '(00) 0000-0000')}
      </div>

      <div className="modal-section-title">Endereço</div>
      <div className="form-row">
        {renderInput('cep', 'CEP', 'text', '00000-000')}
        {renderInput('logradouro', 'Logradouro', 'text', 'Rua...', { flex: 3 })}
      </div>
      <div className="form-row">
        {renderInput('numero', 'Número', 'text', 'Nº')}
        {renderInput('complemento', 'Complemento', 'text', 'Apto / Bloco')}
      </div>
      <div className="form-row">
        {renderInput('bairro', 'Bairro', 'text', 'Bairro', { flex: 1.5 })}
        {renderInput('cidade', 'Cidade', 'text', 'Cidade', { flex: 1.5 })}
        {renderInput('estado', 'Estado', 'text', 'UF', { minWidth: 60 })}
      </div>

      <div className="modal-section-title">Contato de Emergência</div>
      <div className="form-row">
        {renderInput('contato_emergencia_nome', 'Nome', 'text', 'Nome completo', { flex: 1.5 })}
        {renderInput('contato_emergencia_telefone', 'Telefone', 'text', '(00) 00000-0000')}
        {renderInput('contato_emergencia_parentesco', 'Parentesco', 'text', 'Ex: Mãe, Pai...')}
      </div>

      <div className="modal-section-title">Dados Financeiros</div>
      <div className="form-row">
        {renderInput('banco', 'Banco', 'text', 'Nome do banco')}
        {renderInput('agencia', 'Agência', 'text', '0000')}
        {renderInput('conta', 'Conta', 'text', '00000-0')}
        <div className="form-group" style={{ flex: 1 }}>
          <label>Tipo</label>
          <select value={form.tipo_conta || ''} onChange={(e) => alterar('tipo_conta', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
            <option value="">Selecione</option>
            <option value="corrente">Corrente</option>
            <option value="poupanca">Poupança</option>
            <option value="salario">Salário</option>
          </select>
        </div>
      </div>

      <div className="modal-section-title">Dados Profissionais</div>
      <div className="form-row">
        {renderInput('cargo', 'Cargo', 'text', 'Cargo atual')}
        {renderInput('posicao', 'Posição', 'text', 'Ex: Pleno, Senior')}
      </div>
      <div className="form-row">
        {renderInput('salario', 'Salário (R$)', 'number', '0.00')}
        {renderInput('vale_transporte', 'Vale Transporte (R$)', 'number', '0.00')}
        {renderInput('email_corporativo', 'E-mail Corporativo', 'email', 'email@empresa.com')}
      </div>
    </div>
  )
}
