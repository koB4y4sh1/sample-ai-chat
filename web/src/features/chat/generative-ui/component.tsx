import { useComponent } from '@copilotkit/react-core/v2';
import { z } from 'zod';

/** 為替カード: 「	ドル円は？　為替いくら？　今のドルは？」 */
const exchangeRateSchema = z.object({
  pair: z.string().describe('Pair label, e.g. USD/JPY').default('JPY'),
  rate: z.string().describe('Headline quote as shown to the user').default('¥150'),
  context: z
    .string()
    .describe('One line of context: session, change, or caution')
    .default('As of 3:00 PM JST'),
});

type ExchangeRateCardProps = z.infer<typeof exchangeRateSchema>;

function ExchangeRateCard({ pair, rate, context }: ExchangeRateCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-200/70 bg-linear-to-br from-sky-50 via-white to-emerald-50 p-4 shadow-lg shadow-sky-200/40 ring-1 ring-white/80">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_34%)]" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-sky-700/80">
            Forex Snapshot
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{pair}</h3>
        </div>
        <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold tracking-[0.22em] text-white shadow-sm shadow-slate-900/20">
          LIVE
        </div>
      </div>

      <div className="relative mt-5 rounded-xl border border-white/70 bg-white/75 px-4 py-3 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Rate</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-slate-950">
          {rate}
        </p>
      </div>

      <p className="relative mt-4 text-sm leading-6 text-slate-600">{context}</p>
    </div>
  );
}

/** 為替相場: 「現在のドルの為替レートを表示して」など */
export function DisplayComponent() {
  useComponent({
    name: 'showExchangeRate',
    description:
      'Show a currency exchange quote card. Use when the user asks about forex: e.g. USD/JPY, EUR/USD, 為替, ドル円, exchange rate, how much is the dollar, fx spot (similar intent to “what’s the weather today?” but for rates).',
    parameters: exchangeRateSchema,
    render: (props) => <ExchangeRateCard {...props} />,
  });

  return null;
}
