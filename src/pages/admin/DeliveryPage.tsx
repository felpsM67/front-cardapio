import { useEffect, useState } from 'react';
import { CheckCircle2, MapPin, Navigation, PackageOpen, Phone, UserRound } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { courierService } from '../../services/courierService';
import { formatCurrency } from '../../utils/format';
import { orderStatusClass, orderStatusLabel } from '../../utils/orderStatus';
import { storageService } from '../../services/storageService';
import { STORAGE_KEYS } from '../../constants/storage';
import { resolveAdminRole } from '../../constants/adminAccess';

interface AdminSession {
  roleId?: string;
}

export function DeliveryPage() {
  const [, refresh] = useState(0);
  const session = storageService.get<AdminSession | null>(STORAGE_KEYS.ADMIN_SESSION, null);

  useEffect(() => {
    return orderService.subscribe(() => refresh((value) => value + 1));
  }, []);

  const currentRole = resolveAdminRole(session?.roleId);
  const couriers = courierService.getAll().filter((item) => item.active);
  const fallbackId = currentRole === 'manager' ? 'manager-fallback' : 'courier-fallback';
  const [courierId, setCourierId] = useState(couriers[0]?.id ?? fallbackId);
  const courier = couriers.find((item) => item.id === courierId) ?? couriers[0] ?? {
    id: fallbackId,
    name: currentRole === 'manager' ? 'Gerente' : 'Entregador',
    phone: '',
    vehicleModel: '',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const orders = orderService
    .getAll()
    .filter((order) => ['ready', 'out_for_delivery'].includes(order.status));

  function take(id: string) {
    if (!courier) return;
    orderService.assignCourier(id, courier.id, courier.name);
  }

  function delivered(id: string) {
    if (confirm('Confirmar que o pedido foi entregue?')) {
      orderService.markDelivered(id);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Navigation size={32} />
          <div>
            <h1 className="text-3xl font-black">Painel do entregador</h1>
            <p className="text-slate-500">Escolha uma entrega e confirme a conclusão.</p>
          </div>
        </div>
        {(couriers.length > 0 || session?.roleId) && (
          <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <UserRound size={18} />
            <span className="text-sm font-bold">Entregador:</span>
            <select value={courier?.id} onChange={(event) => setCourierId(event.target.value)} className="rounded-lg border px-3 py-2">
              {couriers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              {!couriers.length && <option value={fallbackId}>{currentRole === 'manager' ? 'Gerente' : 'Entregador'}</option>}
            </select>
          </label>
        )}
      </div>

      {!courier || (!couriers.length && !session?.roleId) ? (
        <div className="mt-6 rounded-2xl bg-white p-12 text-center shadow-sm">
          <h2 className="text-xl font-black">Nenhum entregador ativo</h2>
          <p className="mt-2 text-slate-500">Cadastre ou ative um entregador na aba “Entregadores”.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {orders.map((order) => {
            const mine = order.assignedCourierId === courier.id;
            const assigned = Boolean(order.assignedCourierId);
            return (
              <article key={order.id} className={`rounded-2xl bg-white p-5 shadow-sm ${mine ? 'ring-2 ring-emerald-400' : ''}`}>
                <div className="flex justify-between gap-3">
                  <div><p className="text-xs font-bold text-slate-400">PEDIDO #{order.id}</p><h2 className="text-xl font-black">{order.customer.name}</h2></div>
                  <span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${orderStatusClass[order.status]}`}>{orderStatusLabel[order.status]}</span>
                </div>
                <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                  <p className="flex gap-2"><MapPin size={17} /><span>{order.address.street}, {order.address.number} — {order.address.district}, {order.address.city}/{order.address.state}</span></p>
                  <p className="flex gap-2"><Phone size={17} />{order.customer.phone}</p>
                  <p className="flex gap-2"><PackageOpen size={17} />{order.items.map((item) => `${item.quantity}x ${item.product.name}`).join(', ')}</p>
                  <p className="font-black">Receber: {formatCurrency(order.total)}</p>
                </div>
                {assigned && <p className="mt-3 text-sm">Responsável: <b>{order.assignedCourierName}</b></p>}
                <div className="mt-4 flex gap-2">
                  {!assigned && <button onClick={() => take(order.id)} className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-black text-white" style={{ backgroundColor: 'var(--primary)' }}><Navigation size={18} />Escolher este pedido</button>}
                  {mine && <button onClick={() => delivered(order.id)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-black text-white"><CheckCircle2 size={18} />Marcar como entregue</button>}
                  {assigned && !mine && <div className="flex-1 rounded-xl bg-slate-100 p-3 text-center text-sm text-slate-500">Pedido escolhido por outro entregador.</div>}
                </div>
              </article>
            );
          })}
          {!orders.length && <div className="col-span-full rounded-2xl bg-white p-16 text-center text-slate-500">Nenhum pedido pronto para entrega.</div>}
        </div>
      )}
    </div>
  );
}
