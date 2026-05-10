import { useComponent } from '@copilotkit/react-core/v2';
import { z } from 'zod';

/** 為替カード: 「	ドル円は？　為替いくら？　今のドルは？」 */
const exchangeRateSchema = z.object({
  pair: z.string().describe('Pair label, e.g. USD/JPY'),
  rate: z.string().describe('Headline quote as shown to the user'),
  context: z.string().describe('One line of context: session, change, or caution'),
});

function ExchangeRateCard({ pair, rate, context }: z.infer<typeof exchangeRateSchema>) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{pair}</h3>
      <p className="text-2xl tabular-nums">{rate}</p>
      <p className="text-sm text-muted-foreground">{context}</p>
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
    render: ExchangeRateCard,
  });

  return null;
}
