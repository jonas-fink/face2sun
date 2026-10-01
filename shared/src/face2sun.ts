import { z } from 'zod';

export const lightCueSchema = z.enum(['early-light', 'morning-quiet', 'after-lunch', 'late-light']);
export type LightCue = z.infer<typeof lightCueSchema>;

export const registerBodySchema = z.object({
    email: z.email(),
    password: z.string().min(8).max(72),
});

export const loginBodySchema = registerBodySchema;

export const authMeSchema = z.object({
    email: z.email(),
});

export const photoInputSchema = z.object({
    contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    dataBase64: z.string().min(1),
});

export const createPlaceBodySchema = z.object({
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(2000),
    lightCue: lightCueSchema,
    latitude: z.number().gte(-90).lte(90),
    longitude: z.number().gte(-180).lte(180),
    photos: z.array(photoInputSchema).min(1).max(4),
});

export const nearbyQuerySchema = z.object({
    lat: z.coerce.number().gte(-90).lte(90),
    lng: z.coerce.number().gte(-180).lte(180),
});

export const createMomentBodySchema = z.object({
    text: z.string().trim().min(1).max(2000),
});

export const putLightBodySchema = z.object({
    text: z.string().trim().min(1).max(280),
});

export const createRitualBodySchema = z.object({
    title: z.string().trim().min(1).max(80),
    recurrence: z.string().trim().min(1).max(80),
    cap: z.number().int().gte(2).lte(12),
});

export const publicRitualSchema = z.object({
    title: z.string(),
    recurrence: z.string(),
    spotsTaken: z.number().int().nonnegative(),
    cap: z.number().int(),
});
export type PublicRitual = z.infer<typeof publicRitualSchema>;

export const publicPlaceCardSchema = z.object({
    id: z.string(),
    name: z.string(),
    lightCue: lightCueSchema,
    presenceCount: z.number().int().nonnegative(),
    ritual: publicRitualSchema.nullable(),
});
export type PublicPlaceCard = z.infer<typeof publicPlaceCardSchema>;

export const nearbyResponseSchema = z.object({
    places: z.array(publicPlaceCardSchema).max(3),
});
export type NearbyResponse = z.infer<typeof nearbyResponseSchema>;

export const publicMomentSchema = z.object({
    id: z.string(),
    text: z.string(),
    at: z.string(),
});
export type PublicMoment = z.infer<typeof publicMomentSchema>;

export const publicLightSchema = z.object({
    text: z.string(),
    at: z.string(),
});
export type PublicLight = z.infer<typeof publicLightSchema>;

export const publicPlaceSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    lightCue: lightCueSchema,
    photos: z.array(z.object({ url: z.string() })).min(1),
    presenceCount: z.number().int().nonnegative(),
    moments: z.array(publicMomentSchema),
    light: publicLightSchema.nullable(),
    ritual: publicRitualSchema.nullable(),
});
export type PublicPlace = z.infer<typeof publicPlaceSchema>;

export const presenceResponseSchema = z.object({
    presenceCount: z.number().int().nonnegative(),
});

export const spotsResponseSchema = z.object({
    spotsTaken: z.number().int().nonnegative(),
    cap: z.number().int(),
});

export const apiErrorSchema = z.object({
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
});
