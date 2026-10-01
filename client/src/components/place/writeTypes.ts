export type WriteKey = 'checkIn' | 'moment' | 'light' | 'ritual' | 'spot';

export type WriteError = { message: string; fields: Record<string, string> };

export const hasFields = (error: WriteError | undefined): boolean => error !== undefined && Object.keys(error.fields).length > 0;
