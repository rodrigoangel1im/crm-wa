import React, { useState, useEffect } from 'react';
import './ModalOrgao.css';

const ModalOrgao = ({ isOpen, onClose, orgaos, onSelect }) => {
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [orgaosFiltrados, setOrgaosFiltrados] = useState(orgaos);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    setOrgaosFiltrados(orgaos);
    setFiltroTipo('');
    setFiltroTexto('');
  }, [isOpen, orgaos]);

  const aplicarFiltro = () => {
    if (!filtroTipo || !filtroTexto) {
      setOrgaosFiltrados(orgaos);
      return;
    }
    const texto = filtroTexto.toLowerCase();
    const filtrados = orgaos.filter((orgao) => {
      if (filtroTipo === 'Por Código') {
        return orgao.codigo && orgao.codigo.toLowerCase().includes(texto);
      } else if (filtroTipo === 'Por Nome') {
        return orgao.nome.toLowerCase().includes(texto);
      }
      return true;
    });
    setOrgaosFiltrados(filtrados);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <header className="modal-header">
          <h2>Orgãos</h2>
        </header>

        <div className="modal-body">
          <div className="filter-section">
            <div className="filter-group">
              <label>FILTRO:</label>
              <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="">Selecione o filtro</option>
                <option>Por Código</option>
                <option>Por Nome</option>
              </select>
            </div>
            <div className="filter-group grow">
              <label>FILTRO:</label>
              <input
                type="text"
                placeholder="Digite para buscar..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                onKeyUp={(e) => e.key === 'Enter' && aplicarFiltro()}
              />
            </div>
            <button className="btn-buscar" onClick={aplicarFiltro}>BUSCAR</button>
          </div>

          <div className="table-container">
            <table className="modal-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Codigo</th>
                  <th style={{ width: '70%' }}>Nome do Orgão</th>
                </tr>
              </thead>
              <tbody>
                {orgaosFiltrados.map((orgao) => (
                  <tr key={orgao.id} onClick={() => onSelect(orgao.id)} className="modal-table-row">
                    <td>{orgao.codigo}</td>
                    <td>{orgao.nome}</td>
                  </tr>
                ))}
                {orgaosFiltrados.length === 0 && (
                  <>
                    <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
                    <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
                    <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="modal-footer">
            <button className="btn-voltar-modal" onClick={onClose}>VOLTAR</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalOrgao;
