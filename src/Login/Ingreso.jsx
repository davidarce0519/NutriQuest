import React from 'react';
import './Ingreso.css';

function LoginScreen() {
  return (
    <div className="main-container">
      <div className="background-overlay"></div>
      
      <div className="content form-content">
        <h1 className="title-ingresar">Ingresar</h1>

        <form className="login-form">
          <div className="input-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" className="custom-input" />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" className="custom-input" />
          </div>

          <button type="submit" className="btn-submit">Ingresar</button>
          
          <a href="#registrar" className="registrar-link">Registrar</a>
        </form>

        <div className="social-login">
          <button className="social-btn fb-btn">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" />
          </button>
          <button className="social-btn google-btn">
            <img src="https://w7.pngwing.com/pngs/712/520/png-transparent-google-mail-gmail-logo-icon.png" alt="Google" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;