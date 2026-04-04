import React from 'react';
import './Registro.css'; // Asegúrate de que el nombre del archivo CSS sea correcto
import { FaArrowLeft } from 'react-icons/fa'; // Necesitas instalar: npm install react-icons

function RegistroPage() {
  return (
    <div className="main-container">
      {/* Botón de volver */}
      <button className="back-btn" aria-label="Volver">
        <FaArrowLeft className="back-icon" />
      </button>
      
      {/* Capa de fondo con degradado (ya incluida en el CSS del contenedor) */}
      
      <div className="content">
        {/* Título */}
        <h1 className="title-registro">REGISTRO</h1>

        {/* Formulario */}
        <form className="register-form">
          <div className="input-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" className="custom-input" placeholder="ejemplo@email.com" />
          </div>

          <div className="input-group">
            <label htmlFor="peso">Peso (kg):</label>
            <input type="number" id="peso" className="custom-input" placeholder="Ej: 70" />
          </div>

          <div className="input-group">
            <label htmlFor="altura">Altura (cm):</label>
            <input type="number" id="altura" className="custom-input" placeholder="Ej: 175" />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" className="custom-input" />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input type="password" id="confirmPassword" className="custom-input" />
          </div>

          <button type="submit" className="btn-submit">Ingresar</button>
        </form>

        {/* Botones de Redes Sociales (Centrados) */}
        <div className="social-login">
          <button className="social-btn fb-btn" aria-label="Registrarse con Facebook">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" />
          </button>
          <button className="social-btn google-btn" aria-label="Registrarse con Google">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg" alt="Google" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegistroPage;