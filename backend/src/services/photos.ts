import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { httpError } from '#utils';

const MAX_BYTES = 1_500_000;

export function uploadsDir(): string {
    return path.resolve('uploads');
}

function extensionFor(contentType: string): string {
    if (contentType === 'image/png') return 'png';
    if (contentType === 'image/webp') return 'webp';
    return 'jpg';
}

export function contentTypeForFilename(filename: string): string | undefined {
    if (filename.endsWith('.png')) return 'image/png';
    if (filename.endsWith('.webp')) return 'image/webp';
    if (filename.endsWith('.jpg')) return 'image/jpeg';
    return undefined;
}

export function savePhoto(contentType: string, dataBase64: string): { filename: string; contentType: string } {
    const bytes = Buffer.from(dataBase64, 'base64');
    if (bytes.length === 0 || bytes.length > MAX_BYTES) {
        throw httpError(400, 'Invalid request', {
            photos: 'Each photo must be between 1 byte and 1.5 MB',
        });
    }
    const filename = `${randomBytes(16).toString('hex')}.${extensionFor(contentType)}`;
    const dir = uploadsDir();
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, filename), bytes);
    return { filename, contentType };
}

export function deletePhoto(filename: string): void {
    const file = path.join(uploadsDir(), filename);
    if (existsSync(file)) unlinkSync(file);
}

export function photoPath(filename: string): string | undefined {
    if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(filename)) return undefined;
    const file = path.join(uploadsDir(), filename);
    if (!existsSync(file)) return undefined;
    return file;
}
