import type { StoreConfig } from '../models';
import { apiClient } from '../api/apiClient';

const CONFIG_ENDPOINT = '/configuracoes';
let configPromise: Promise<StoreConfig> | null = null;
interface BackendStoreConfig {
  id: number;
  nomeLoja: string;
  descricao: string;
  numeroLoja: string;
  chavePix: string;
  titularPix: string;
  valorFrete: number | string;
  pedidoMinimo: number | string | null;
  slugCardapio: string;
  prazoEntrega: string;
  horarioFuncionamento: string;
  aberto: boolean;
  corPrimaria: string;
  capaUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface StoreConfigPayload {
  nomeLoja: string;
  descricao: string;
  numeroLoja: string;
  chavePix: string;
  titularPix: string;
  valorFrete: number;
  pedidoMinimo: number | null;
  slugCardapio: string;
  prazoEntrega: string;
  horarioFuncionamento: string;
  aberto: boolean;
  corPrimaria: string;
  capaUrl: string;
}

function normalizeConfig(config: BackendStoreConfig): StoreConfig {
  return {
    storeName: config.nomeLoja ?? '',
    description: config.descricao ?? '',
    whatsappNumber: config.numeroLoja ?? '',
    pixKey: config.chavePix ?? '',
    pixHolderName: config.titularPix ?? '',
    deliveryFee: Number(config.valorFrete ?? 0),
    minimumOrder:
      config.pedidoMinimo === null || config.pedidoMinimo === undefined
        ? null
        : Number(config.pedidoMinimo),
    menuSlug: config.slugCardapio ?? '',
    estimatedTime: config.prazoEntrega ?? '',
    openingHours: config.horarioFuncionamento ?? '',
    isOpen: Boolean(config.aberto),
    primaryColor: config.corPrimaria || '#ea580c',
    coverUrl: config.capaUrl ?? '',
  };
}

function buildPayload(config: StoreConfig): StoreConfigPayload {
  return {
    nomeLoja: config.storeName.trim(),
    descricao: config.description.trim(),
    numeroLoja: config.whatsappNumber.trim(),
    chavePix: config.pixKey.trim(),
    titularPix: config.pixHolderName.trim(),
    valorFrete: Number(config.deliveryFee) || 0,
    pedidoMinimo:
      config.minimumOrder === null ? null : Number(config.minimumOrder),
    slugCardapio: config.menuSlug.trim(),
    prazoEntrega: config.estimatedTime.trim(),
    horarioFuncionamento: config.openingHours.trim(),
    aberto: config.isOpen,
    corPrimaria: config.primaryColor.trim(),
    capaUrl: config.coverUrl.trim(),
  };
}

function applyPrimaryColor(primaryColor: string): void {
  if (!primaryColor) return;

  document.documentElement.style.setProperty(
    '--primary',
    primaryColor,
  );
}

function get(forceReload = false): Promise<StoreConfig> {
  if (!configPromise || forceReload) {
    configPromise = apiClient
      .get<BackendStoreConfig>(CONFIG_ENDPOINT)
      .then((response) => {
        const config = normalizeConfig(response);

        applyPrimaryColor(config.primaryColor);

        return config;
      })
      .catch((error) => {
        configPromise = null;
        throw error;
      });
  }

  return configPromise;
}

async function save(value: StoreConfig): Promise<StoreConfig> {
  const response =
    await apiClient.put<BackendStoreConfig>(
      CONFIG_ENDPOINT,
      buildPayload(value),
    );

  const config = normalizeConfig(response);
  configPromise = Promise.resolve(config);

  applyPrimaryColor(config.primaryColor);

  window.dispatchEvent(
    new CustomEvent<StoreConfig>(
      'store-config-updated',
      {
        detail: config,
      },
    ),
  );

  return config;
}

export const configService = {
  get,
  save,
  applyPrimaryColor,
};