import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Cria o ponto de entrada da aplicação
createRoot(document.getElementById('root')!).render(
  // Envolve a aplicação em StrictMode para detectar problemas em potencial
  <StrictMode>
    <App />
  </StrictMode>
);