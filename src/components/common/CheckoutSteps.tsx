interface CheckoutStepsProps {
  current: 1 | 2 | 3 | 4 | 5;
}

interface VisualStep {
  number: 1 | 2 | 3;
  label: string;
}

function getVisualStep(
  current: CheckoutStepsProps['current'],
): VisualStep {
  if (current === 1) {
    return {
      number: 1,
      label: 'Carrinho',
    };
  }

  if (current === 2 || current === 3) {
    return {
      number: 2,
      label: 'Seus dados',
    };
  }

  return {
    number: 3,
    label: 'Finalizar pedido',
  };
}

export function CheckoutSteps({
  current,
}: CheckoutStepsProps): React.JSX.Element {
  const step =
    getVisualStep(current);

  return (
    <div className="mb-7">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          {step.label}
        </span>

        <span className="text-xs text-slate-400">
          {step.number} de 3
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[1, 2, 3].map(
          (number) => (
            <div
              key={number}
              className={`h-1 rounded-full transition-colors ${
                number <= step.number
                  ? 'bg-[var(--primary)]'
                  : 'bg-slate-200'
              }`}
            />
          ),
        )}
      </div>
    </div>
  );
}