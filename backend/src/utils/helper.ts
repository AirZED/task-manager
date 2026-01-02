import { Buffer } from 'buffer';

/**
 * Detect MIME type and extension from buffer using magic numbers
 */
export function getMimeTypeAndExtension(buffer: Buffer): { mimeType: string; extension: string } | null {
    if (!buffer || buffer.length < 4) {
        return null;
    }

    // Check magic numbers (file signatures)
    const header = buffer.slice(0, 12);

    // JPEG
    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
        return { mimeType: 'image/jpeg', extension: '.jpg' };
    }

    // PNG
    if (
        header[0] === 0x89 &&
        header[1] === 0x50 &&
        header[2] === 0x4e &&
        header[3] === 0x47
    ) {
        return { mimeType: 'image/png', extension: '.png' };
    }

    // GIF
    if (
        (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) ||
        (header.toString('ascii', 0, 3) === 'GIF')
    ) {
        return { mimeType: 'image/gif', extension: '.gif' };
    }

    // WebP
    if (
        header[0] === 0x52 &&
        header[1] === 0x49 &&
        header[2] === 0x46 &&
        header[3] === 0x46 &&
        header[8] === 0x57 &&
        header[9] === 0x45 &&
        header[10] === 0x42 &&
        header[11] === 0x50
    ) {
        return { mimeType: 'image/webp', extension: '.webp' };
    }

    // PDF
    if (header.toString('ascii', 0, 4) === '%PDF') {
        return { mimeType: 'application/pdf', extension: '.pdf' };
    }

    // AVIF
    if (
        header[4] === 0x66 &&
        header[5] === 0x74 &&
        header[6] === 0x79 &&
        header[7] === 0x70 &&
        header[8] === 0x61 &&
        header[9] === 0x76 &&
        header[10] === 0x69 &&
        header[11] === 0x66
    ) {
        return { mimeType: 'image/avif', extension: '.avif' };
    }

    // Default to JPEG if it looks like an image but format is unknown
    // This is a fallback for edge cases
    return null;
}

