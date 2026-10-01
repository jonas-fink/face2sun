export const MAX_PHOTO_BYTES = 1_500_000;
export const MAX_PHOTOS = 4;

const START_EDGE = 1600;
const START_QUALITY = 0.85;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.1;
const EDGE_SHRINK = 0.8;
const MIN_EDGE = 320;

export type PreparedPhoto = {
    id: string;
    name: string;
    contentType: 'image/jpeg';
    dataBase64: string;
    previewUrl: string;
};

export const fitWithin = (width: number, height: number, maxEdge: number): { width: number; height: number } => {
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
};

const encode = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
    new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))),
            'image/jpeg',
            quality,
        );
    });

const toBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result);
            resolve(result.slice(result.indexOf(',') + 1));
        };
        reader.onerror = () => reject(new Error('Could not read the image.'));
        reader.readAsDataURL(blob);
    });

export const prepareImage = async (file: File): Promise<PreparedPhoto> => {
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new Error(`${file.name} is not an image this browser can read.`);
    }

    try {
        let edge = START_EDGE;
        for (;;) {
            const { width, height } = fitWithin(bitmap.width, bitmap.height, edge);
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Could not process the image.');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, width, height);
            context.drawImage(bitmap, 0, 0, width, height);

            for (let quality = START_QUALITY; quality >= MIN_QUALITY - 1e-9; quality -= QUALITY_STEP) {
                const blob = await encode(canvas, quality);
                if (blob.size <= MAX_PHOTO_BYTES) {
                    const dataBase64 = await toBase64(blob);
                    return {
                        id: crypto.randomUUID(),
                        name: file.name,
                        contentType: 'image/jpeg',
                        dataBase64,
                        previewUrl: `data:image/jpeg;base64,${dataBase64}`,
                    };
                }
            }

            edge = Math.round(edge * EDGE_SHRINK);
            if (edge < MIN_EDGE) throw new Error(`${file.name} is too large to shrink.`);
        }
    } finally {
        bitmap.close();
    }
};
