import React from 'react';
import './Informacion1.0.css';
// Asegúrate de importar tu logo correctamente
import logoNutriQuest from '../elementos_graficos/nutriquest_logo-removebg-preview.png'; 

const InformacionNutricional = () => {
  const categorias = [
    { id: 1, titulo: "Para la memoria", img: "https://i0.wp.com/www.buenossaborespanama.com/wp-content/uploads/2022/03/nuts-2021-08-26-15-23-41-utc-scaled.jpg?fit=1200%2C797&ssl=1", slug: "memoria" },
    { id: 2, titulo: "Para la concentración", img: "https://hips.hearstapps.com/hmg-prod/images/ripe-yellow-bananas-at-the-shopping-market-fruits-royalty-free-image-1712833209.jpg?crop=0.66635xw:1xh;center,top&resize=640:*", slug: "concentracion" },
    { id: 3, titulo: "Estabilizar estado de ánimo", img: "https://s1.abcstatics.com/abc/www/multimedia/ciencia/2023/03/31/frutas-kfNH-RL11aJz79VzsPThFeaE6g5L-1200x840@abc.jpg", slug: "animo" },
    { id: 4, titulo: "Para mayor energía", img: "https://www.conasi.eu/blog/wp-content/uploads/2018/06/como-hacer-copos-de-avena-900x600.jpg", slug: "energia" },
    { id: 5, titulo: "Ricos en Antioxidantes", img: "https://eatinapp.es/sites/default/files/inline-images/antioxidantes.jpeg", slug: "antioxidantes" },
    { id: 6, titulo: "Para la salud cerebral", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9XjAfbjF_rCx8kp_-j6tqq-3p2YK2Ra540g&s", slug: "cerebral" },
  ];

  const handleCardClick = (slug) => {
    console.log(`Navegando a: ${slug}`);
  };

  return (
    <div className="nutri-page">
      {/* Header ahora VERDE según la imagen */}
      <header className="green-header">
        <div className="header-top-row">
          <button className="icon-btn menu-btn">☰</button>
          <div className="header-logo-container">
            <img src={logoNutriQuest} alt="NutriQuest" className="header-logo-img" />
          </div>
          {/* Botón vacío o de perfil para mantener el equilibrio del flexbox si no hay '?' */}
          <div className="spacer-btn"></div> 
        </div>
      </header>

      <main className="white-content-card">
        <div className="section-title-row">
          <div className="title-left">
             {/* Icono de cubiertos/libro según la imagen */}
            <div className="title-icon-wrapper">
                <span className="icon-book">🍴</span> 
            </div>
            <h2>Alimentos</h2>
          </div>
          <button className="back-arrow-small" onClick={() => window.history.back()}>❮</button>
        </div>

        <div className="all-foods-banner" onClick={() => handleCardClick('todos')}>
          <div className="banner-overlay">
            <h3>Todos los alimentos</h3>
          </div>
        </div>

        <div className="foods-grid">
          {categorias.map((cat) => (
            <button 
              key={cat.id} 
              className="food-card-button" 
              onClick={() => handleCardClick(cat.slug)}
            >
              <div className="food-img-wrapper">
                <img src={cat.img} alt={cat.titulo} />
              </div>
              <div className="food-card-label">
                {cat.titulo}
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default InformacionNutricional;