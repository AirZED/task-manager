import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, bucketName, publicUrl } from '../config/cloudflare';
import { cloudflareUpload } from '../utils/cloudflareUpload';
import crypto from 'crypto';
import path from 'path';

interface UploadResult {
    url: string;
    key: string;
}

interface PresignedUploadResult {
    uploadUrl: string;
    key: string;
    publicUrl: string;
    method: 'PUT';
    expiresIn: number;
}

/**
 * Generate presigned URL for direct client-to-R2 upload (SERVERLESS-FRIENDLY)
 * This is the recommended method for serverless deployments like Vercel
 * 
 * Flow:
 * 1. Client requests presigned URL from server
 * 2. Server generates presigned URL and returns it
 * 3. Client uploads file directly to R2 using presigned URL
 * 4. Client confirms upload by sending the publicUrl to server
 * 5. Server stores the publicUrl in database
 */
export const generatePresignedUrl = async (
    fileName: string,
    contentType: string,
    folder: string = 'general'
): Promise<PresignedUploadResult> => {
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    const key = `${folder}/${uniqueFileName}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
        uploadUrl,
        key,
        publicUrl: `${publicUrl}/${key}`,
        method: 'PUT',
        expiresIn: 3600,
    };
};

/**
 * Upload file buffer to Cloudflare R2 (TRADITIONAL METHOD)
 * Use this only for non-serverless deployments or small files
 * For serverless (Vercel), use generatePresignedUrl instead
 * 
 * This function now uses the cloudflareUpload helper which includes:
 * - Automatic image optimization
 * - Format conversion (JPEG, PNG, WebP, AVIF)
 * - Smart resizing
 * - Better error handling
 */
export const uploadFile = async (
    buffer: Buffer,
    originalName: string,
    mimetype: string,
    _folder: string = 'general'
): Promise<UploadResult> => {
    // Use the cloudflareUpload helper for optimized uploads
    const result = await cloudflareUpload.uploadSingleFile({
        fileName: originalName,
        buffer,
        mimetype,
    });

    // Extract key from URL (remove public URL prefix)
    const key = result.mediaUrl.replace(`${publicUrl}/`, '');

    return {
        url: result.mediaUrl,
        key,
    };
};

/**
 * Delete file from Cloudflare R2
 * Accepts either a full URL or just the key/filename
 */
export const deleteFile = async (keyOrUrl: string): Promise<void> => {
    // Use the cloudflareUpload helper for deletion
    await cloudflareUpload.deleteSingleFile(keyOrUrl);
};

/**
 * Validate file type and size
 */
export const validateFile = (
    file: Express.Multer.File,
    allowedTypes: string[],
    maxSizeMB: number = 5
): { valid: boolean; error?: string } => {
    const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes

    if (!allowedTypes.includes(file.mimetype)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File size exceeds ${maxSizeMB}MB limit`,
        };
    }

    return { valid: true };
};

