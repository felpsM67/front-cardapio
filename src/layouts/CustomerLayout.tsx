import {
  useEffect,
  useState,
  type CSSProperties,
} from 'react';
import { Outlet } from 'react-router-dom';

import { Header } from '../components/layout/Header';
import { configService } from '../services/configService';

export function CustomerLayout() {
  const [primaryColor, setPrimaryColor] =
    useState('#16a34a');

  useEffect(() => {
    async function loadConfig(): Promise<void> {
      try {
        const config =
          await configService.get();

        setPrimaryColor(
          config.primaryColor || '#16a34a',
        );
      } catch (error) {
        console.error(
          'Erro ao carregar configurações:',
          error,
        );
      }
    }

    void loadConfig();
  }, []);

  const style = {
    '--primary': primaryColor,
  } as CSSProperties;

  return (
    <div style={style}>
      <Header />
      <Outlet />
    </div>
  );
}