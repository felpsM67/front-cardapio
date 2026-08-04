import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Address, Order, Payment } from '../../models';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { storageService } from '../../services/storageService';
import { STORAGE_KEYS } from '../../constants/storage';
import { configService } from '../../services/configService';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/format';
import {
  generateOrderMessage,
  generateWhatsAppUrl,
} from '../../utils/generateOrderMessage';
import { Button } from '../../components/common/Button';

export function ReviewPage() {
  const cart = useCart();
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const address = storageService.get<Address | null>(
    STORAGE_KEYS.CHECKOUT_ADDRESS,
    null,
  );
  const payment = storageService.get<Payment | null>(
    STORAGE_KEYS.CHECKOUT_PAYMENT,
    null,
  );
  const config = configService.get();

  if (!customer || !address || !payment) {
    return <div className="p-10 text-center">Dados do checkout incompletos.</div>;
  }

  const confirmedCustomer = customer;
  const confirmedAddress = address;
  const confirmedPayment = payment;
  const total = cart.subtotal + config.deliveryFee;

  async function finish() {
    setError('');
    setSaving(true);

    const order: Order = {
      id: '',
      customer: confirmedCustomer,
      address: confirmedAddress,
      items: cart.items,
      subtotal: cart.subtotal,
      deliveryFee: config.deliveryFee,
      discount: 0,
      total,
      payment: confirmedPayment,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      const savedOrder = await orderService.create(order);
      const confirmedOrder = { ...order, id: String(savedOrder.id) };
      const url = generateWhatsAppUrl(generateOrderMessage(confirmedOrder));

      window.open(url, '_blank');
      cart.clear();
      storageService.remove(STORAGE_KEYS.CHECKOUT_ADDRESS);
      storageService.remove(STORAGE_KEYS.CHECKOUT_PAYMENT);
      navigate('/pedido/sucesso');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `Não foi possível salvar o pedido: ${saveError.message}`
          : 'Não foi possível salvar o pedido no backend.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-black">Revise seu pedido</h1>

      <div className="mt-6 space-y-4">
        <section className="rounded-2xl border p-5">
          <h2 className="font-bold">Cliente</h2>
          <p>
            {customer.name} · {customer.phone}
          </p>
        </section>

        <section className="rounded-2xl border p-5">
          <h2 className="font-bold">Entrega</h2>
          <p>
            {address.street}, {address.number} — {address.district},{' '}
            {address.city}/{address.state}
          </p>
        </section>

        <section className="rounded-2xl border p-5">
          <h2 className="font-bold">Itens</h2>
          {cart.items.map((item) => (
            <div key={item.id} className="mt-2 flex justify-between">
              <span>
                {item.quantity}x {item.product.name}
              </span>
              <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
            </div>
          ))}
          <div className="mt-4 flex justify-between border-t pt-4 text-lg font-black">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </section>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
          <p className="mt-1 font-normal">
            O pedido não foi salvo e o carrinho foi mantido para você tentar novamente.
          </p>
        </div>
      )}

      <Button
        className="mt-6 w-full bg-green-600 hover:bg-green-700"
        disabled={saving}
        onClick={() => void finish()}
      >
        {saving ? 'Salvando pedido...' : 'Finalizar pedido pelo WhatsApp'}
      </Button>
    </div>
  );
}
