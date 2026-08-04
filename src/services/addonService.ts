import type { AddonGroup } from '../models';
import { apiClient } from '../api/apiClient';
import { STORAGE_KEYS } from '../constants/storage';
import { storageService } from './storageService';
import { useEffect, useMemo, useState } from 'react';

const GROUP_ENDPOINTS = ['/adicionais/grupos', '/adicionais', '/grupos-adicionais'];

let addonGroups: AddonGroup[] = storageService.get<AddonGroup[]>(
  STORAGE_KEYS.ADDONS,
  [],
);

function persistGroups(items: AddonGroup[]): AddonGroup[] {
  addonGroups = items;
  storageService.set(STORAGE_KEYS.ADDONS, addonGroups);
  return addonGroups;
}

function parseBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'sim', 's', 'ativo', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'nao', 'n', 'inativo', 'no', 'none'].includes(normalized)) return false;
  }
  return fallback;
}

function normalizeGroup(item: unknown, fallbackId?: string): AddonGroup {
  const value = (item ?? {}) as Record<string, unknown>;
  const items = Array.isArray(value.items)
    ? value.items
    : Array.isArray(value.itens)
      ? value.itens
      : [];

  return {
    id: String(value.id ?? value._id ?? fallbackId ?? crypto.randomUUID()),
    name: String(value.name ?? value.nome ?? 'Grupo de adicionais'),
    required: parseBoolean(value.required ?? value.obrigatorio, false),
    maxSelections: Number(value.maxSelections ?? value.max_selecoes ?? 3),
    active: parseBoolean(value.active ?? value.ativo, true),
    applicableProductIds: Array.isArray(value.applicableProductIds)
      ? value.applicableProductIds.map((id) => String(id))
      : Array.isArray(value.produtoIds)
        ? value.produtoIds.map((id) => String(id))
        : [],
    items: (items as Array<Record<string, unknown>>).map((entry) => ({
      id: String(entry.id ?? entry._id ?? crypto.randomUUID()),
      name: String(entry.name ?? entry.nome ?? 'Adicional'),
      price: Number(entry.price ?? entry.preco ?? entry.valor ?? 0),
      available: parseBoolean(entry.available ?? entry.ativo ?? entry.active, true),
    })),
  };
}

function buildGroupPayload(group: AddonGroup) {
  return {
    nome: group.name,
    name: group.name,
    obrigatorio: group.required,
    required: group.required,
    max_selecoes: group.maxSelections,
    maxSelections: group.maxSelections,
    ativo: group.active,
    active: group.active,
    produtoIds: group.applicableProductIds,
    applicableProductIds: group.applicableProductIds,
    itens: group.items.map((item) => ({
      nome: item.name,
      name: item.name,
      valor: item.price,
      price: item.price,
      ativo: item.available,
      available: item.available,
    })),
    items: group.items.map((item) => ({
      nome: item.name,
      name: item.name,
      valor: item.price,
      price: item.price,
      ativo: item.available,
      available: item.available,
    })),
  };
}

async function syncGroupToApi(action: 'create' | 'update' | 'delete', group?: AddonGroup): Promise<void> {
  if (!group && action !== 'delete') return;

  const payload = group ? buildGroupPayload(group) : undefined;

  for (const endpoint of GROUP_ENDPOINTS) {
    try {
      if (action === 'create') {
        await apiClient.post(endpoint, payload);
        return;
      }

      if (action === 'update' && group) {
        await apiClient.put(`${endpoint}/${encodeURIComponent(group.id)}`, payload);
        return;
      }

      if (action === 'delete' && group) {
        await apiClient.delete(`${endpoint}/${encodeURIComponent(group.id)}`);
        return;
      }
    } catch (error) {
      console.warn(`Falha ao sincronizar grupo de adicionais em ${endpoint}`, error);
    }
  }
}

async function hydrateGroupsFromApi(): Promise<void> {
  for (const endpoint of GROUP_ENDPOINTS) {
    try {
      const response = await apiClient.get<unknown[]>(endpoint);
      if (Array.isArray(response)) {
        const normalized = response.map((item) => normalizeGroup(item));
        if (normalized.length) {
          persistGroups(normalized);
          return;
        }
      }
    } catch (error) {
      console.warn(`Falha ao carregar grupos de adicionais em ${endpoint}`, error);
    }
  }
}

void hydrateGroupsFromApi();

export const addonService = {
  getAll: (): AddonGroup[] => addonGroups,

  save: (items: AddonGroup[]): void => {
    persistGroups(items);
  },

  getForProduct: (id: string): AddonGroup[] =>
    addonGroups.filter((group) => group.applicableProductIds.includes(id)),

  create: (data: Omit<AddonGroup, 'id'>): AddonGroup => {
    const created: AddonGroup = {
      id: crypto.randomUUID(),
      ...data,
    };

    persistGroups([...addonGroups, created]);
    void syncGroupToApi('create', created);
    return created;
  },

  update: (id: string, data: Partial<AddonGroup>): void => {
    const updated = addonGroups.map((group) =>
      group.id === id ? { ...group, ...data } : group,
    );

    persistGroups(updated);
    const current = updated.find((group) => group.id === id);
    if (current) {
      void syncGroupToApi('update', current);
    }
  },

  remove: (id: string): void => {
    const remaining = addonGroups.filter((group) => group.id !== id);
    persistGroups(remaining);
    const removed = addonGroups.find((group) => group.id === id);
    if (removed) {
      void syncGroupToApi('delete', removed);
    }
  },
};
