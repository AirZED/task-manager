import { S3Client } from '@aws-sdk/client-s3';
import { config } from './config';

const cloudflareConfig = {
    region: 'auto',
    endpoint: `https://${config.cloudflare.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: config.cloudflare.accessKeyId,
        secretAccessKey: config.cloudflare.secretAccessKey,
    },
};

export const s3Client = new S3Client(cloudflareConfig);

export const bucketName = config.cloudflare.bucketName;
export const publicUrl = config.cloudflare.publicUrl;

