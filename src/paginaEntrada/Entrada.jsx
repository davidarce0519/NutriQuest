import React from 'react';
import './Entrada.css';
// El "../" sube una carpeta para salir de donde está el componente y entrar a elementos_graficos
import logoNutri from '../elementos_graficos/nutriquest_logo-removebg-preview.png';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


const MenuPrincipal = () => {
  
  // Espacio para asignar funciones a los botones
  const handleNavigation = (ruta) => {
    console.log(`Navegando a: ${ruta}`);
    // Aquí puedes usar useNavigate() de react-router-dom
  };

  return (
    <div className="mobile-container">
      <div className="screen-content">
        
        {/* Header / Logo */}
        <header className="logo-section">
          <div className="logo-placeholder">
             {/* Sustituir por <img src="logo.png" /> */}
             <img 
                src={logoNutri} 
                alt="Logo NutriQuest" 
                className="app-logo-image" 
            />

          </div>
        </header>

        {/* Sección Realidad Aumentada */}
        <section className="ra-card">
          <div className="ra-main-button" onClick={() => handleNavigation('ra-experiencia')}>
            <h2>Realidad Aumentada</h2>
            <p>Prepara un batido especial</p>
          </div>
          <button 
            className="btn-secondary dark" 
            onClick={() => handleNavigation('experiencia-sin-ra')}
          >
            experiencia sin RA
          </button>
        </section>

        {/* Botones Inferiores */}
        <nav className="menu-buttons">
          <button 
            className="btn-main light" 
            onClick={() => handleNavigation('Minijuego')}
          >
            Mini Juego
          </button>
          
          <button 
            className="btn-main light" 
            onClick={() => handleNavigation('info-nutricional')}
          >
            Información nutricional
          </button>
        </nav>

      </div>
    </div>
  );
};

export default MenuPrincipal;