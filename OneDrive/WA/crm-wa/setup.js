const fs = require('fs');
const path = require('path');

const folders = [
  'src/components/Navbar',
  'src/components/AvisosTable',
  'src/pages/Inicio'
];

const files = {
  'src/App.css': `* { margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; }
body { background-color: #9b98c6; }`,
  
  'src/App.jsx': `import React from 'react';
import Inicio from './pages/Inicio/Inicio';
import './App.css';
export default function App() { return <Inicio />; }`,

  'src/components/Navbar/Navbar.jsx': `import React from 'react';
import './Navbar.css';
export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <a href="#" className="active">Inicio</a>
        <a href="#">Contratos</a>
        <a href="#">Simulações</a>
        <a href="#">Esteira</a>
        <a href="#">Perfil</a>
      </div>
    </nav>
  );
}`,

  'src/components/Navbar/Navbar.css': `.navbar { width: 100%; padding: 15px 0; display: flex; justify-content: center; }
.nav-container { background: rgba(255,255,255,0.2); border-radius: 20px; padding: 8px 30px; display: flex; gap: 20px; }
.nav-container a { text-decoration: none; color: white; font-size: 14px; }`,

  'src/components/AvisosTable/AvisosTable.jsx': `import React from 'react';
import './AvisosTable.css';
export default function AvisosTable() {
  return (
    <div className="avisos-section">
      <div className="avisos-title-bar">Avisos</div>
      <table className="avisos-table">
        <thead>
          <tr><th>Aviso</th><th>Responsavel</th><th>Data da publicação</th></tr>
        </thead>
        <tbody><tr className="empty-row"><td></td><td></td><td></td></tr></tbody>
      </table>
    </div>
  );
}`,

  'src/components/AvisosTable/AvisosTable.css': `.avisos-title-bar { background: #3f3b6c; color: white; padding: 10px; border-radius: 4px; }
.avisos-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
.avisos-table th { background: #3f3b6c; color: white; padding: 10px; border: 1px solid #2d2952; }
.avisos-table td { background: #dadada; border: 1px solid #a3a3a3; height: 200px; }`,

  'src/pages/Inicio/Inicio.jsx': `import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import AvisosTable from '../../components/AvisosTable/AvisosTable';
import './Inicio.css';
export default function Inicio() {
  return (
    <div className="inicio-layout">
      <Navbar />
      <header className="page-header"><h1>Inicio</h1></header>
      <main className="main-content"><div className="content-card"><AvisosTable /></div></main>
    </div>
  );
}`,

  'src/pages/Inicio/Inicio.css': `.page-header { background: #3f3b6c; padding: 30px; color: white; }
.page-header h1 { margin-left: 10%; }
.main-content { display: flex; justify-content: center; padding: 40px; }
.content-card { background: #f7f7f7; width: 85%; min-height: 500px; border-radius: 10px; padding: 20px; }`
};

// Cria as pastas
folders.forEach(folder => fs.mkdirSync(folder, { recursive: true }));

// Cria os arquivos
Object.entries(files).forEach(([name, content]) => {
  fs.writeFileSync(name, content);
  console.log(\`Criado: \${name}\`);
});

console.log('--- Estrutura React pronta! ---');