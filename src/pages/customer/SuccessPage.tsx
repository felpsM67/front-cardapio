import {
  CheckCircle2,
  Clock3,
  MessageCircle,
  Store,
  Truck,
} from 'lucide-react';

import {
  Link,
  useLocation,
} from 'react-router-dom';

import type {
  DeliveryType,
} from '../../models';

interface SuccessState {
  orderId?: string;
  deliveryType?: DeliveryType;
}

export function SuccessPage(): React.JSX.Element {
  const location =
    useLocation();

  const state =
    location.state as
      | SuccessState
      | null;

  const isPickup =
    state?.deliveryType ===
    'pickup';

  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <div className="surface-card overflow-hidden text-center">
        <div className="bg-emerald-50 px-6 py-8">
          <CheckCircle2
            size={66}
            className="mx-auto text-emerald-600"
          />

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
            Pedido enviado!
          </h1>

          {state?.orderId && (
            <p className="mt-2 text-sm font-bold text-emerald-700">
              Pedido #
              {
                state.orderId
              }
            </p>
          )}
        </div>

        <div className="space-y-4 p-6 text-left">
          <div className="flex gap-3 rounded-xl bg-slate-50 p-4">
            {isPickup ? (
              <Store
                className="mt-0.5 shrink-0 text-slate-400"
                size={19}
              />
            ) : (
              <Truck
                className="mt-0.5 shrink-0 text-slate-400"
                size={19}
              />
            )}

            <div>
              <strong className="block text-sm text-slate-800">
                {isPickup
                  ? 'Aguarde ficar pronto para retirada'
                  : 'Aguarde a confirmação'}
              </strong>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {isPickup
                  ? 'A loja recebeu seu pedido e avisará quando ele estiver pronto para você retirar.'
                  : 'A loja recebeu seu pedido e seguirá com o preparo para entrega.'}
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl bg-slate-50 p-4">
            <Clock3
              className="mt-0.5 shrink-0 text-slate-400"
              size={19}
            />

            <div>
              <strong className="block text-sm text-slate-800">
                {isPickup
                  ? 'Não vá antes da confirmação'
                  : 'Seu pedido está na fila de atendimento'}
              </strong>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {isPickup
                  ? 'Espere o aviso da loja informando que o pedido está pronto para retirada.'
                  : 'As próximas atualizações dependem do andamento do preparo e da entrega.'}
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl bg-slate-50 p-4">
            <MessageCircle
              className="mt-0.5 shrink-0 text-slate-400"
              size={19}
            />

            <div>
              <strong className="block text-sm text-slate-800">
                Acompanhe pelo
                WhatsApp
              </strong>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {isPickup
                  ? 'Você poderá receber a mensagem de “pronto para retirada” pelo atendimento da loja.'
                  : 'As atualizações do pedido podem ser enviadas pelo atendimento da loja.'}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-6">
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-black text-white"
            style={{
              backgroundColor:
                'var(--primary)',
            }}
          >
            Voltar ao cardápio
          </Link>
        </div>
      </div>
    </div>
  );
}