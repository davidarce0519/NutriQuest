import React from 'react';
import './AlimentosPropios.css';
import data from './alimentos.json'; // Importación del JSON

const AlimentosPage = () => {
  return (
    <div className="nutri-page-container">
      {/* HEADER VERDE DINÁMICO */}
      <header className="page-header">
        <button className="icon-btn">
          <span className="material-icons-round">menu</span>
        </button>
        
        <div className="header-title-container">
          <h1 className="main-title">{data.config.titulo_categoria}</h1>
        </div>

        <button className="icon-btn">
          <span className="help-icon">?</span>
        </button>
      </header>

      {/* TARJETA DE CONTENIDO */}
      <main className="main-content-card">
        <section className="section-header">
          <div className="section-icon-title">
            <span className="section-icon">🍴</span>
            <h2>{data.config.nombre_seccion}</h2>
          </div>
          <button className="back-arrow-small" onClick={() => window.history.back()}>
            <span className="material-icons-round">expand_less</span>
          </button>
        </section>

        {/* Banner con datos del JSON */}
        <button className="banner-foods">
          <div className="banner-img-wrapper">
            <img src={data.banner.url_imagen} alt="Banner" />
          </div>
          <h3>{data.banner.texto}</h3>
        </button>

        {/* GRID DINÁMICO: Se crean tantas etiquetas como alimentos haya en el JSON */}
        <div className="grid-layout">
          {data.lista_alimentos.map((item) => (
            <button key={item.id} className="food-item-card">
              <div className="food-img-container">
                <img src={item.img} alt={item.nombre} />
              </div>
              <div className="food-label-container">
                <p>{item.nombre}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Botón inferior centrado */}
        <button className="scroll-down-icon">
          MÁS ALIMENTOS
        </button>
      </main>
    </div>
  );
};

export default AlimentosPage;