import React from 'react';
import './Minijuego.css';
import logoNutriQuest from '../elementos_graficos/nutriquest_logo-removebg-preview.png';

const SeleccionNiveles = () => {
  const handleGoBack = () => {
    window.history.back(); // O usar useNavigate de react-router-dom
  };

  return (
    <div className="levels-page">
      <div className="levels-container-mobile">
        
        {/* Header con flecha y logo */}
        <header className="levels-header">
          <button className="back-button" onClick={handleGoBack}>
            &#10094;
          </button>
          <div className="levels-logo-wrapper">
            <img src={logoNutriQuest} alt="NutriQuest" className="levels-logo-img" />
          </div>
        </header>

        {/* Tarjeta de Contenido */}
        <main className="levels-main-card">
          <p className="levels-intro-text">
            En este emocionante juego, tú eres un héroe que debe combatir a monstruos malvados utilizando tus conocimientos sobre nutrición.
          </p>

          <div className="levels-list">
            {/* Nivel 1 - Activo */}
            <button className="level-btn active-level">
              nivel 1
            </button>

            {/* Nivel 2 - Bloqueado */}
            <div className="level-btn locked-level">
              Nivel 2
              <span className="lock-icon">🔒</span>
            </div>

            {/* Nivel 3 - Bloqueado */}
            <div className="level-btn locked-level">
              Nivel 3
              <span className="lock-icon">🔒</span>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
};

export default SeleccionNiveles;