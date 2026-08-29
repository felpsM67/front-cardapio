export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

export const onlyDigits = (value: string) =>
  value.replace(/\D/g, '');

export const formatPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);

  if (digits.length <= 2) return digits;

  if (number.startsWith('9')) {
    const ninthDigit = number.slice(0, 1);
    const firstBlock = number.slice(1, 5);
    const secondBlock = number.slice(5, 9);

    return [
      areaCode,
      ninthDigit,
      firstBlock + (secondBlock ? `-${secondBlock}` : ''),
    ]
      .filter(Boolean)
      .join(' ');
  }

  const firstBlock = number.slice(0, 4);
  const secondBlock = number.slice(4, 8);
  return `${areaCode} ${firstBlock}${secondBlock ? `-${secondBlock}` : ''}`;
};
