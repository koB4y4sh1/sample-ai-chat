import { z } from 'zod';

export const flightOptionSchema = z.object({
  id: z.string().optional(),
  airline: z.string(),
  airlineLogo: z.string().optional(),
  flightNumber: z.string(),
  origin: z.string(),
  destination: z.string(),
  date: z.string(),
  departureTime: z.string(),
  arrivalTime: z.string(),
  duration: z.string(),
  status: z.string(),
  price: z.string(),
});

export const showFlightOptionsSchema = z.object({
  title: z.string(),
  summary: z.string().optional(),
  flights: z.array(flightOptionSchema).min(1).max(6),
});

export type FlightOption = z.infer<typeof flightOptionSchema>;
export type ShowFlightOptionsArgs = z.infer<typeof showFlightOptionsSchema>;
