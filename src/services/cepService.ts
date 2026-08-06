export interface CepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const cepService = {
  async find(cep: string): Promise<CepAddress> {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) throw new Error('Informe um CEP com 8 números.');
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) throw new Error('Não foi possível consultar o CEP.');
    const data = await response.json() as CepAddress;
    if (data.erro) throw new Error('CEP não encontrado.');
    return data;
  },
};
