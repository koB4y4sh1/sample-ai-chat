'use client';

import { Plane } from 'lucide-react';
import type { FlightOption } from '../../../lib/generative-ui/schemas/flight-options';
import { cn } from '../../../lib/utils';

const statusToneClass = (status?: string) => {
  if (!status) {
    return 'text-text-secondary';
  }

  const normalized = status.toLowerCase();
  if (normalized.includes('on time')) {
    return 'text-emerald-500';
  }
  if (normalized.includes('boarding')) {
    return 'text-amber-500';
  }
  if (normalized.includes('delayed') || normalized.includes('cancel')) {
    return 'text-red-500';
  }
  return 'text-text-secondary';
};

const isRenderableFlight = (flight: Partial<FlightOption>): flight is FlightOption =>
  Boolean(
    flight.airline &&
      flight.flightNumber &&
      flight.origin &&
      flight.destination &&
      flight.date &&
      flight.departureTime &&
      flight.arrivalTime &&
      flight.duration &&
      flight.status &&
      flight.price,
  );

export function FlightOptions({
  title,
  summary,
  flights,
  onSelect,
  disabled = false,
  selectedFlightKeys,
  toolCallId,
}: {
  title: string;
  summary?: string;
  flights: Array<Partial<FlightOption>>;
  onSelect?: (flight: FlightOption) => void;
  disabled?: boolean;
  selectedFlightKeys?: Set<string>;
  toolCallId?: string;
}) {
  const renderableFlights = flights.filter(isRenderableFlight);

  return (
    <div className="my-3 w-full max-w-xl rounded-2xl border border-border bg-bg p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {summary ? <p className="mt-1 text-sm text-text-secondary">{summary}</p> : null}
        {disabled ? (
          <span className="mt-2 inline-flex rounded-full border border-border bg-sidebar-bg px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            Past message - interactions disabled
          </span>
        ) : null}
      </div>
      <div className="space-y-4">
        {renderableFlights.length === 0 ? (
          <div className="rounded-xl border border-border bg-sidebar-bg p-4 text-sm text-text-secondary">
            Preparing flight options.
          </div>
        ) : null}
        {renderableFlights.map((flight) => (
          <article
            key={flight.id ?? `${flight.airline}-${flight.flightNumber}`}
            className="overflow-hidden rounded-2xl border border-border bg-sidebar-bg shadow-sm"
          >
            <div className="flex items-start justify-between gap-4 p-5">
              <div className="flex min-w-0 items-center gap-3">
                {flight.airlineLogo ? (
                  <div
                    aria-hidden="true"
                    className="h-10 w-10 rounded-full border border-border bg-bg bg-cover bg-center"
                    style={{ backgroundImage: `url(${flight.airlineLogo})` }}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4ECDC4]/15 text-[#4ECDC4]">
                    <Plane className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-text-primary">
                    {flight.airline}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">{flight.flightNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-text-primary">{flight.price}</p>
                <p className="mt-1 text-xs text-text-secondary">{flight.date}</p>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-y border-border px-5 py-4">
              <div>
                <p className="text-xl font-semibold text-text-primary">{flight.departureTime}</p>
                <p className="mt-2 text-base font-semibold text-text-primary">{flight.origin}</p>
              </div>
              <div className="min-w-[104px] text-center">
                <p className="text-xs text-text-secondary">{flight.duration}</p>
                <div className="my-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-border" />
                  <span className="h-px flex-1 bg-border" />
                  <Plane className="h-3.5 w-3.5 text-[#4ECDC4]" />
                  <span className="h-px flex-1 bg-border" />
                  <span className="h-1.5 w-1.5 rounded-full bg-border" />
                </div>
                <p className={cn('text-xs font-medium', statusToneClass(flight.status))}>
                  {flight.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-text-primary">{flight.arrivalTime}</p>
                <p className="mt-2 text-base font-semibold text-text-primary">
                  {flight.destination}
                </p>
              </div>
            </div>
            <div className="p-5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect?.(flight)}
                className={cn(
                  'h-11 w-full rounded-xl border text-sm font-semibold transition-colors',
                  disabled
                    ? selectedFlightKeys?.has(
                        `${toolCallId}:flight:${flight.id ?? `${flight.airline}-${flight.flightNumber}`}`,
                      )
                      ? 'cursor-not-allowed border-[#4ECDC4]/35 bg-[#4ECDC4]/10 text-[#4ECDC4] opacity-80'
                      : 'cursor-not-allowed border-border bg-bg text-text-secondary opacity-45 grayscale'
                    : 'border-border bg-bg text-text-primary hover:border-[#4ECDC4]/60 hover:bg-[#4ECDC4]/10',
                )}
              >
                Select
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
