import React from 'react';
import './TodosAlimentos.css';

// URLs de imágenes de prueba (puedes cambiarlas por tus archivos locales)
const imgFrutasVariadas = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5idg606oGkz3-N4jH7337AFjJh90lKL1Exw&s";
const imgFresas = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsch2cerK6ZAai_el3L0Iii-uh3q9oEx870A&s";
const imgNueces = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQitBh0S521KAkpuEfDuPl__EnilYR8GysJqQ&s";
const imgChocolate = "https://babyshowerchocolate.com/cdn/shop/articles/chocolate_hero1-d62e5444a8734f8d8fe91f5631d51ca5.jpg?v=1694433941";
const imgEspinacas = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOld9xGviBX85Kqw-DRoXACG_XVlwPnGgujg&s";
const imgTomates = "https://cdn.wikifarmer.com/images/thumbnail/2020/11/Cosas-que-no-sabias-del-tomate-%E2%80%93-Datos-Curiosos-Sobre-El-Tomate-1200x630.jpg";
const imgBrocoli = "https://mejorconsalud.as.com/wp-content/uploads/2015/06/brocoli-ramas.jpg";
const imgPimientos = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTq7aj4LhOUbHi55QAagnNm9DRdvYbZPWly2w&sg";
const imgManzanas = "https://www.bupasalud.com.co/sites/default/files/inline-images/fuji-red.jpg";
const imgHuevos = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmvbFZLsjqcEyyIzifrg7NPv6-i1njdVIJkg&s";
const imgAguacate = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1Wa_7BJINzSAHGlJjiYk1U3xA2CbmmxEIvA&s";
const imgMiel = "https://granvita.com/wp-content/uploads/2024/02/miel-endulzante-natural-beneficios.jpg";

const alimentosData = [
  { name: "Fresas", img: imgFresas },
  { name: "Nueces", img: imgNueces },
  { name: "Chocolate N", img: imgChocolate },
  { name: "Espinacas", img: imgEspinacas },
  { name: "Tomates", img: imgTomates },
  { name: "Brócoli", img: imgBrocoli },
  { name: "Pimientos", img: imgPimientos },
  { name: "Fresas", img: imgFresas }, // Repetido según imagen
  { name: "Manzanas", img: imgManzanas },
  { name: "Huevos", img: imgHuevos },
  { name: "Aguacate", img: imgAguacate },
  { name: "Miel", img: imgMiel },
];

const AlimentosPage = () => {
  return (
    <div className="nutri-page-container">
      {/* 1. HEADER (AHORA VERDE) */}
      <header className="page-header green-bg">
        <button className="icon-btn menu-btn-header" aria-label="Menu">
          <span className="material-icons-round">☰</span>
        </button>
        
        <div className="header-title-container">
          <h1 className="main-title">Bajo en proteinas</h1>
        </div>

        <button className="icon-btn help-btn-header" aria-label="Ayuda">
          <span className="help-icon">?</span>
        </button>
      </header>

      {/* 2. TARJETA BLANCA DE CONTENIDO */}
      <main className="main-content-card">
        {/* Título de Sección */}
        <section className="section-header">
          <div className="section-icon-title">
            <span className="section-icon">🍴</span>
            <h2>Alimentos</h2>
          </div>
          <button className="back-arrow-small" onClick={() => window.history.back()}>❮</button>
        </section>

        {/* Banner Central "Todos los alimentos" */}
        <button className="banner-foods">
          <div className="banner-img-wrapper">
            <img src={imgFrutasVariadas} alt="Variedad de frutas" />
          </div>
          <h3>Todos los alimentos</h3>
        </button>

        {/* Grid de Alimentos */}
        <section className="foods-grid-scrollable">
          <div className="grid-layout">
            {alimentosData.map((alimento, index) => (
              <button key={index} className="food-item-card">
                <div className="food-img-container">
                  <img src={alimento.img} alt={alimento.name} />
                </div>
                <div className="food-label-container">
                  <p>{alimento.name}</p>
                </div>
              </button>
            ))}
          </div>
          <button className="scroll-down-icon" onClick={() => window.history.back()}>MAS ALIMENTOS</button>
        </section>
      </main>
    </div>
  );
};

export default AlimentosPage;