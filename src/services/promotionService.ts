import type { Promotion } from '../models';
import { apiClient } from '../api/apiClient';

const ENDPOINT = '/promocoes';
const UPDATED_EVENT = 'promotions-updated';

interface BackendPromotion {
  id: number;
  titulo: string;
  descricao?: string | null;
  imagem?: string | null;
  produtoIds?: Array<number | string> | null;
  precosPromocionais?: Record<string, number | string> | null;
  ativo?: boolean | number | null;
  clicavel?: boolean | number | null;
  selo?: string | null;
  inicio?: string | null;
  fim?: string | null;
  ordem?: number | string | null;
}

interface PromotionPayload {
  titulo: string;
  descricao: string;
  imagem: string;
  produtoIds: number[];
  precosPromocionais: Record<string, number>;
  ativo: boolean;
  clicavel: boolean;
  selo: string;
  inicio: string | null;
  fim: string | null;
  ordem: number;
}

function toBoolean(value: boolean | number | null | undefined): boolean {
  return value === true || value === 1;
}

function normalizeDate(value?: string | null): string {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function toIsoDate(value?: string): string | null {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
}

function normalizePromotion(item: BackendPromotion): Promotion {
  const promotionalPrices = Object.fromEntries(
    Object.entries(item.precosPromocionais ?? {}).map(
      ([productId, price]) => [
        String(productId),
        Number(price) || 0,
      ],
    ),
  );

  return {
    id: String(item.id),
    title: item.titulo ?? '',
    description: item.descricao ?? '',
    imageUrl: item.imagem ?? '',
    productIds: Array.isArray(item.produtoIds)
      ? item.produtoIds.map(String)
      : [],
    promotionalPrices,
    active: toBoolean(item.ativo),
    clickable: toBoolean(item.clicavel),
    badge: item.selo ?? 'Oferta',
    startsAt: normalizeDate(item.inicio),
    endsAt: normalizeDate(item.fim),
    order: Number(item.ordem ?? 1),
  };
}

function buildPayload(
  data: Omit<Promotion, 'id'> | Partial<Promotion>,
): Partial<PromotionPayload> {
  const payload: Partial<PromotionPayload> = {};

  if (data.title !== undefined) {
    payload.titulo = data.title.trim();
  }

  if (data.description !== undefined) {
    payload.descricao = data.description.trim();
  }

  if (data.imageUrl !== undefined) {
    payload.imagem = data.imageUrl;
  }

  if (data.productIds !== undefined) {
    payload.produtoIds = data.productIds
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  if (data.promotionalPrices !== undefined) {
    payload.precosPromocionais = Object.fromEntries(
      Object.entries(data.promotionalPrices).map(
        ([productId, price]) => [
          String(productId),
          Number(price) || 0,
        ],
      ),
    );
  }

  if (data.active !== undefined) {
    payload.ativo = data.active;
  }

  if (data.clickable !== undefined) {
    payload.clicavel = data.clickable;
  }

  if (data.badge !== undefined) {
    payload.selo = data.badge.trim() || 'Oferta';
  }

  if (data.startsAt !== undefined) {
    payload.inicio = toIsoDate(data.startsAt);
  }

  if (data.endsAt !== undefined) {
    payload.fim = toIsoDate(data.endsAt);
  }

  if (data.order !== undefined) {
    payload.ordem = Math.max(1, Number(data.order) || 1);
  }

  return payload;
}

function emitUpdated(): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent(UPDATED_EVENT));
}

async function getAll(): Promise<Promotion[]> {
  const response =
    await apiClient.get<BackendPromotion[]>(ENDPOINT);

  return response
    .map(normalizePromotion)
    .sort((a, b) => a.order - b.order);
}

async function create(
  data: Omit<Promotion, 'id'>,
): Promise<Promotion> {
  const response =
    await apiClient.post<BackendPromotion>(
      ENDPOINT,
      buildPayload(data),
    );

  const promotion = normalizePromotion(response);
  emitUpdated();

  return promotion;
}

async function update(
  id: string,
  data: Partial<Promotion>,
): Promise<Promotion> {
  const response =
    await apiClient.put<BackendPromotion>(
      `${ENDPOINT}/${id}`,
      buildPayload(data),
    );

  const promotion = normalizePromotion(response);
  emitUpdated();

  return promotion;
}

async function remove(id: string): Promise<void> {
  await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  emitUpdated();
}

export const promotionService = {
  getAll,
  create,
  update,
  remove,
  updatedEvent: UPDATED_EVENT,
};