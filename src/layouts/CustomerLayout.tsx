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
    useState(() =>
      configService.getCachedPrimaryColor(),
    );

  useEffect(() => {
    let active = true;

    async function loadConfig(): Promise<void> {
      try {
        const config =
          await configService.get();

        if (active) {
          setPrimaryColor(
            config.primaryColor,
          );
        }
      } catch (error) {
        console.error(
          'Erro ao carregar configurações:',
          error,
        );
      }
    }

    void loadConfig();

    return () => {
      active = false;
    };
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