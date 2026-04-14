import React from 'react';
import './Login.css';
import logoNutri from '../elementos_graficos/nutriquest_logo-removebg-preview.png';

function App() {
  return (
    <div className="main-container">
      {/* Capa de fondo con la imagen y el gradiente */}
      <div className="background-overlay"></div>
      
      <div className="content">
        {/* Sección del Logo */}
        <div className="logo-container">
          <img 
           src={logoNutri} 
            alt="NutriQuest Logo" 
            className="logo-img" 
          />
        </div>

        {/* Sección de Botones */}
        <div className="actions">
          <button className="btn-iniciar">Iniciar</button>
          <a href="#terminos" className="terms-link">Terminos y condiciones</a>
        </div>
      </div>
    </div>
  );
}

export default App;