import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { Buffer } from 'buffer';
import { config } from '../config/config';
import logger from './logger';
import { getMimeTypeAndExtension } from './helper';
import { AppError } from './appError';
import os from 'os';

// Optimize Sharp performance globally for serverless environments
sharp.cache(false); // Disable cache to reduce memory usage
// For serverless (Vercel), use conservative concurrency (1-2 threads)
// os.cpus().length may return 0 or 1 in serverless, so we ensure at least 1
const cpuCount = os.cpus().length || 1;
sharp.concurrency(Math.max(1, Math.min(2, cpuCount))); // Conservative for serverless

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
    },
    maxAttempts: 3,
    retryMode: 'adaptive',
});

// Image format quality presets
const FORMAT_OPTIONS = {
    jpeg: { quality: 80, progressive: true, mozjpeg: true },
    webp: { quality: 75, alphaQuality: 80, lossless: false },
    png: { compressionLevel: 9, quality: 80 },
    avif: { quality: 60, speed: 5 },
};

interface ICloudflareUploadFile {
    fileName?: string;
    buffer: Buffer;
    mimetype: string;
}

/**
 * Selects the optimal output format based on mime type and content
 */
function selectOptimalFormat(
    mimeType: string,
    _buffer: Buffer
): { format: keyof typeof FORMAT_OPTIONS; extension: string } {
    let format: keyof typeof FORMAT_OPTIONS = 'jpeg';
    let extension = '.jpg';

    // If it's already webp, keep it webp
    if (mimeType === 'image/webp') {
        return { format: 'webp', extension: '.webp' };
    }

    // For transparent images, use webp or png
    if (mimeType === 'image/png' || mimeType === 'image/gif') {
        // WebP is better for web delivery
        return { format: 'webp', extension: '.webp' };
    }

    return { format, extension };
}

/**
 * Optimizes an image buffer based on size and content
 */
async function optimizeImage(
    buffer: Buffer,
    mimeType: string,
    maxSizeInBytes: number = 2 * 1024 * 1024 // 2MB target after optimization
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
    if (!buffer || !Buffer.isBuffer(buffer)) {
        return { buffer, mimeType, extension: '.jpg' };
    }

    // Skip optimization for small files
    if (buffer.length <= maxSizeInBytes / 2) {
        return {
            buffer,
            mimeType,
            extension:
                mimeType === 'image/jpeg'
                    ? '.jpg'
                    : mimeType === 'image/png'
                        ? '.png'
                        : mimeType === 'image/webp'
                            ? '.webp'
                            : mimeType === 'image/gif'
                                ? '.gif'
                                : '.jpg',
        };
    }

    try {
        // Get image metadata without full decode
        const metadata = await sharp(buffer).metadata();

        // Skip processing for tiny images
        if (
            (metadata.width || 0) < 500 &&
            (metadata.height || 0) < 500 &&
            buffer.length < maxSizeInBytes / 2
        ) {
            return {
                buffer,
                mimeType,
                extension:
                    mimeType === 'image/jpeg'
                        ? '.jpg'
                        : mimeType === 'image/png'
                            ? '.png'
                            : mimeType === 'image/webp'
                                ? '.webp'
                                : mimeType === 'image/gif'
                                    ? '.gif'
                                    : '.jpg',
            };
        }

        // Choose optimal output format
        const { format, extension } = selectOptimalFormat(mimeType, buffer);

        // Calculate reasonable dimensions (max 2000px but maintain aspect ratio)
        const MAX_DIM = 2000;
        let resizeOptions: any = {};

        if ((metadata.width || 0) > MAX_DIM || (metadata.height || 0) > MAX_DIM) {
            resizeOptions = {
                width: Math.min(metadata.width || MAX_DIM, MAX_DIM),
                height: Math.min(metadata.height || MAX_DIM, MAX_DIM),
                fit: 'inside' as const,
                withoutEnlargement: true,
            };
        }

        // Process the image with optimal settings
        let sharpInstance = sharp(buffer).resize(resizeOptions);

        // Apply format-specific options
        switch (format) {
            case 'jpeg':
                sharpInstance = sharpInstance.jpeg(FORMAT_OPTIONS.jpeg);
                break;
            case 'webp':
                sharpInstance = sharpInstance.webp(FORMAT_OPTIONS.webp);
                break;
            case 'png':
                sharpInstance = sharpInstance.png(FORMAT_OPTIONS.png);
                break;
            case 'avif':
                sharpInstance = sharpInstance.avif(FORMAT_OPTIONS.avif);
                break;
        }

        const optimizedBuffer = await sharpInstance.toBuffer();

        return {
            buffer: optimizedBuffer,
            mimeType: `image/${format}`,
            extension,
        };
    } catch (error) {
        logger.error('Image optimization error:', error);
        return { buffer, mimeType, extension: '.jpg' };
    }
}

/**
 * Upload a single file to Cloudflare R2
 */
export const uploadSingleFile = async (
    payload: ICloudflareUploadFile
): Promise<{ mediaUrl: string }> => {
    const { buffer, mimetype } = payload;

    if (!buffer || !mimetype) {
        throw new AppError('Buffer and mimetype are required', 400);
    }

    if (!config.r2.bucketName || !config.r2.accountId || !config.r2.accessKeyId) {
        throw new AppError('Cloudflare R2 is not configured', 500);
    }

    try {
        // Perform basic validation
        const detectedType = getMimeTypeAndExtension(buffer);
        if (!detectedType) {
            throw new AppError('Unsupported file type', 400);
        }

        // Generate a unique and clean filename
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.T]/g, '')
            .slice(0, 15); // Format: YYYYMMDDHHMMSS
        const randomStr = Math.random().toString(36).substring(2, 7); // Short random string
        const uniqueFileName = `event_${timestamp}_${randomStr}`;

        let optimizedBuffer = buffer;
        let finalMimeType = detectedType.mimeType;
        let extension = detectedType.extension;

        // Process based on file type
        if (detectedType.mimeType.startsWith('image/')) {
            // Process image files
            const optimizeResult = await optimizeImage(buffer, detectedType.mimeType);
            optimizedBuffer = optimizeResult.buffer;
            finalMimeType = optimizeResult.mimeType;
            extension = optimizeResult.extension;
        }

        const finalFileName = `${uniqueFileName}${extension}`;

        // Upload to Cloudflare R2
        const uploadParams = {
            Bucket: config.r2.bucketName,
            Key: finalFileName,
            Body: optimizedBuffer,
            ContentType: finalMimeType,
            CacheControl: 'public, max-age=31536000', // Cache for 1 year
        };

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        const mediaUrl = config.r2.publicUrl
            ? `${config.r2.publicUrl}/${finalFileName}`
            : `https://${config.r2.accountId}.r2.cloudflarestorage.com/${config.r2.bucketName}/${finalFileName}`;

        return {
            mediaUrl,
        };
    } catch (error) {
        logger.error('Upload error:', error);
        throw new AppError(
            error instanceof Error
                ? error.message
                : 'Upload failed - please try again',
            400
        );
    }
};

/**
 * Delete a single file from Cloudflare R2
 */
export const deleteSingleFile = async (fileUrl: string): Promise<void> => {
    if (!fileUrl) {
        throw new AppError('File URL is required', 400);
    }

    if (!config.r2.bucketName) {
        throw new AppError('Cloudflare R2 is not configured', 500);
    }

    // Extract just the filename from the full URL if needed
    const key = fileUrl.includes('/')
        ? fileUrl.split('/').pop() || fileUrl
        : fileUrl;

    const deleteParams = {
        Bucket: config.r2.bucketName,
        Key: key,
    };

    try {
        const command = new DeleteObjectCommand(deleteParams);
        await s3Client.send(command);
    } catch (error) {
        logger.error('Delete file error', error);
        throw new AppError('Unable to delete file', 400);
    }
};

export const cloudflareUpload = {
    uploadSingleFile,
    deleteSingleFile,
};

