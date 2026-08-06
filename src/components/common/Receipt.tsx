import { forwardRef } from 'react';
import type { Order } from '../../models';
import { formatCurrency } from '../../utils/format';

interface ReceiptProps {
  order: Order;
  storeName?: string;
}

const paymentLabels: Record<string, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
  credit: 'Cartão de crédito',
  debit: 'Cartão de débito',
};

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  function Receipt({ order, storeName = 'Minha Loja' }, ref) {
    const address = order.address;

    return (
      <div ref={ref} className="receipt">
        <div className="receipt-header">
          <strong>{storeName}</strong>
          <div>Pedido #{order.id}</div>
          <div>
            {new Date(order.createdAt).toLocaleString('pt-BR')}
          </div>
        </div>

        <div className="receipt-divider" />

        <div>
          <strong>Cliente:</strong> {order.customer.name}
        </div>
        <div>{order.customer.phone}</div>

        {address && (
          <>
            <div className="receipt-divider" />
            <div>
              <strong>Entrega:</strong>
            </div>
            <div>
              {address.street}, {address.number}
            </div>
            <div>{address.district}</div>
            <div>
              {address.city} - {address.state}
            </div>
            {address.complement && (
              <div>Compl.: {address.complement}</div>
            )}
            {address.reference && (
              <div>Ref.: {address.reference}</div>
            )}
          </>
        )}

        <div className="receipt-divider" />

        <strong>ITENS</strong>
        {order.items.map((item) => (
          <div key={item.id} className="receipt-item">
            <div className="receipt-item-row">
              <span>
                {item.quantity}x {item.product.name}
              </span>
              <span>
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </div>

            {item.selectedOptions?.map((option) => (
              <div key={option.id} className="receipt-item-option">
                + {option.quantity ?? 1}x {option.name}
              </div>
            ))}

            {item.notes && (
              <div className="receipt-item-note">
                Obs: {item.notes}
              </div>
            )}
          </div>
        ))}

        <div className="receipt-divider" />

        <div className="receipt-item-row">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="receipt-item-row">
          <span>Entrega</span>
          <span>{formatCurrency(order.deliveryFee)}</span>
        </div>
        {order.discount > 0 && (
          <div className="receipt-item-row">
            <span>Desconto</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}

        <div className="receipt-divider" />

        <div className="receipt-item-row receipt-total">
          <strong>TOTAL</strong>
          <strong>{formatCurrency(order.total)}</strong>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-payment">
          Pagamento: {paymentLabels[order.payment.method] ?? order.payment.method}
        </div>

        <div className="receipt-footer">Obrigado pela preferência!</div>
      </div>
    );
  },
);