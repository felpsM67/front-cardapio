export function backendOnlyError(resource: string, action = 'salvar'): never {
  const message = `Não foi possível ${action} ${resource}. Este módulo ainda não está conectado ao backend e nenhum dado foi salvo.`;

  if (typeof window !== 'undefined') {
    window.alert(message);
  }

  throw new Error(message);
}
