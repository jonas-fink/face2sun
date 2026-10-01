import type { z } from 'zod';
import {
    apiErrorSchema,
    authMeSchema,
    nearbyResponseSchema,
    presenceResponseSchema,
    publicLightSchema,
    publicMomentSchema,
    publicPlaceSchema,
    publicRitualSchema,
    spotsResponseSchema,
    type createPlaceBodySchema,
} from 'face2sun-shared';

export class ApiError extends Error {
    status: number;
    fields: Record<string, string> | undefined;
    spotsTaken: number | undefined;
    cap: number | undefined;

    constructor(
        status: number,
        message: string,
        extra: { fields?: Record<string, string>; spotsTaken?: number; cap?: number } = {},
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.fields = extra.fields;
        this.spotsTaken = extra.spotsTaken;
        this.cap = extra.cap;
    }
}

// Latitude and longitude stay optional so the member can submit without a
// location and the server's 400 `fields` name what is missing.
export type CreatePlaceInput = Omit<z.input<typeof createPlaceBodySchema>, 'latitude' | 'longitude'> & {
    latitude?: number;
    longitude?: number;
};

export type CreateRitualInput = { title: string; recurrence: string; cap: number };

const toApiError = async (response: Response): Promise<ApiError> => {
    const json: unknown = await response.json().catch(() => null);
    const parsed = apiErrorSchema.safeParse(json);
    const spots = spotsResponseSchema.safeParse(json);
    return new ApiError(response.status, parsed.success ? parsed.data.message : `Request failed (${response.status})`, {
        fields: parsed.success ? parsed.data.fields : undefined,
        spotsTaken: spots.success ? spots.data.spotsTaken : undefined,
        cap: spots.success ? spots.data.cap : undefined,
    });
};

const send = async (method: string, path: string, body?: unknown): Promise<Response> => {
    let response: Response;
    try {
        response = await fetch(path, {
            method,
            credentials: 'include',
            headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
    }
    if (!response.ok) throw await toApiError(response);
    return response;
};

const read = async <T>(response: Response, schema: z.ZodType<T>): Promise<T> => {
    const json: unknown = await response.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
        console.error(`Unexpected response from ${response.url}`, parsed.error);
        throw new ApiError(response.status, 'The server sent a response this app does not understand.');
    }
    return parsed.data;
};

const placePath = (placeId: string) => `/api/places/${encodeURIComponent(placeId)}`;

export const register = async (email: string, password: string) =>
    read(await send('POST', '/api/auth/register', { email, password }), authMeSchema);

export const login = async (email: string, password: string) =>
    read(await send('POST', '/api/auth/login', { email, password }), authMeSchema);

export const logout = async (): Promise<void> => {
    await send('POST', '/api/auth/logout');
};

export const getMe = async () => read(await send('GET', '/api/auth/me'), authMeSchema);

export const getNearby = async (lat: number, lng: number) =>
    read(await send('GET', `/api/places/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`), nearbyResponseSchema);

export const getPlace = async (placeId: string) => read(await send('GET', placePath(placeId)), publicPlaceSchema);

export const createPlace = async (input: CreatePlaceInput) =>
    read(await send('POST', '/api/places', input), publicPlaceSchema);

export const checkIn = async (placeId: string) =>
    read(await send('POST', `${placePath(placeId)}/check-ins`, {}), presenceResponseSchema);

export const createMoment = async (placeId: string, text: string) =>
    read(await send('POST', `${placePath(placeId)}/moments`, { text }), publicMomentSchema);

export const putLight = async (placeId: string, text: string) =>
    read(await send('PUT', `${placePath(placeId)}/light`, { text }), publicLightSchema);

export const createRitual = async (placeId: string, input: CreateRitualInput) =>
    read(await send('POST', `${placePath(placeId)}/ritual`, input), publicRitualSchema);

export const takeSpot = async (placeId: string) =>
    read(await send('POST', `${placePath(placeId)}/ritual/spots`, {}), spotsResponseSchema);
