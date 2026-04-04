import { Routes, Route } from 'react-router-dom';
import MenuPrincipal from './paginaEntrada/MenuPrincipal';
import Minijuego from './PaginaMinijuego/Minijuego';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPrincipal />} />
      <Route path="/minijuego" element={<Minijuego />} />
      {/* Agrega las otras rutas aquí */}
    </Routes>
  );
}