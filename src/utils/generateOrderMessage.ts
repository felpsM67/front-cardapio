import type { Order } from '../models';
import { configService } from '../services/configService';
import { formatCurrency, formatPhone } from './format';

export async function generateOrderMessage(
  order: Order,
): Promise<string> {
  const config =
    await configService.get();

  const address = order.address;
  const isPickup = order.deliveryType === 'pickup';

  const items = order.items
    .map((item) => {
      const additions =
        item.selectedOptions?.length
          ? item.selectedOptions
              .map((option) => {
                const quantity =
                  option.quantity ?? 1;

                return `${quantity}x ${option.name}`;
              })
              .join(', ')
          : '';

      return [
        `${item.quantity}x ${
          item.product.name
        } — ${formatCurrency(
          item.unitPrice *
            item.quantity,
        )}`,
        additions
          ? `Adicionais: ${additions}`
          : '',
        item.notes
          ? `Observação: ${item.notes}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  let payment: string;

  if (order.payment.method === 'pix') {
    payment = [
      'Pix',
      config.pixKey
        ? `Chave Pix: ${config.pixKey}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  } else if (
    order.payment.method === 'cash'
  ) {
    if (order.payment.needsChange) {
      const changeFor =
        Number(
          order.payment.changeFor ?? 0,
        );

      payment = [
        'Dinheiro',
        `Troco para: ${formatCurrency(
          changeFor,
        )}`,
        `Troco estimado: ${formatCurrency(
          Math.max(
            changeFor - order.total,
            0,
          ),
        )}`,
      ].join('\n');
    } else {
      payment = 'Dinheiro\nSem troco';
    }
  } else {
    payment =
      order.payment.method === 'credit'
        ? 'Cartão de crédito na entrega'
        : 'Cartão de débito na entrega';
  }

  return [
    `NOVO PEDIDO #${order.id}`,
    '',
    `Cliente: ${order.customer.name}`,
    `Telefone: ${formatPhone(order.customer.phone)}`,
    '',
    isPickup ? 'RETIRADA NA LOJA' : 'ENDEREÇO DE ENTREGA',
    isPickup ? 'Cliente retira o pedido no balcão.' : `${address.street}, ${address.number}`,
    !isPickup ? `Bairro: ${address.district}` : '',
    !isPickup ? `${address.city} - ${address.state}` : '',
    !isPickup && address.complement
      ? `Complemento: ${address.complement}`
      : '',
    !isPickup && address.reference
      ? `Referência: ${address.reference}`
      : '',
    '',
    'ITENS',
    items,
    '',
    `Subtotal: ${formatCurrency(
      order.subtotal,
    )}`,
    isPickup
      ? 'Taxa de entrega: Grátis'
      : `Taxa de entrega: ${formatCurrency(order.deliveryFee)}`,
    `Total: ${formatCurrency(
      order.total,
    )}`,
    '',
    'PAGAMENTO',
    payment,
  ]
    .filter(
      (line) => line !== '',
    )
    .join('\n');
}
