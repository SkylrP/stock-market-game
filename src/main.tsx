import React from 'react';
import ReactDOM from 'react-dom/client';
import { GameProvider } from './state/GameContext';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
);
