import React, { useState, useEffect } from 'react';
import './ModalBanco.css';

const ModalBanco = ({ isOpen, onClose, bancos, onSelect }) => {
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [bancosFiltrados, setBancosFiltrados] = useState(bancos);

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
    setBancosFiltrados(bancos);
    setFiltroTipo('');
    setFiltroTexto('');
  }, [isOpen, bancos]);

  const aplicarFiltro = () => {
    if (!filtroTipo || !filtroTexto) {
      setBancosFiltrados(bancos);
      return;
    }
    const texto = filtroTexto.toLowerCase();
    const filtrados = bancos.filter((banco) => {
      if (filtroTipo === 'Por Código') {
        return banco.codigo.toString().includes(texto);
      } else if (filtroTipo === 'Por Nome') {
        return banco.nome.toLowerCase().includes(texto);
      }
      return true;
    });
    setBancosFiltrados(filtrados);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <header className="modal-header">
          <h2>Bancos</h2>
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
                  <th style={{ width: '70%' }}>Nome do Banco</th>
                </tr>
              </thead>
              <tbody>
                {bancosFiltrados.map((banco) => (
                   <tr key={banco.id} onClick={() => onSelect(banco.id)} className="modal-table-row">
                     <td>{banco.codigo}</td>
                    <td>{banco.nome}</td>
                  </tr>
                ))}
                {bancosFiltrados.length === 0 && (
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

export default ModalBanco;
