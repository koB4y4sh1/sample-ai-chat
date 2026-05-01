import { z } from 'zod';

export const googleMapCoordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const googleMapMarkerSchema = googleMapCoordinateSchema.extend({
  label: z.string().min(1),
  note: z.string().optional(),
});

export const showGoogleMapSchema = z.object({
  title: z.string().min(1),
  center: googleMapCoordinateSchema,
  zoom: z.number().int().min(1).max(20).default(13),
  markers: z.array(googleMapMarkerSchema).default([]),
});

export type ShowGoogleMapArgs = z.infer<typeof showGoogleMapSchema>;
