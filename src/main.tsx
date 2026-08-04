import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { initializeApiData } from './services/apiBootstrap';

async function start(): Promise<void> {
  let startupError = '';

  try {
    await initializeApiData();
  } catch (error) {
    startupError = error instanceof Error ? error.message : 'Falha ao carregar dados da API.';
    console.error(error);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      {startupError && (
        <div className="fixed inset-x-0 top-0 z-[100] bg-red-700 px-4 py-2 text-center text-sm font-semibold text-white">
          {startupError}
        </div>
      )}
      <App />
    </React.StrictMode>,
  );
}

void start();
