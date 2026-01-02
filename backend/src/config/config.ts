import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '8080', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwt: {
        secret: process.env.JWT_SECRET || '',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || '',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    mongo: {
        uri: process.env.DB_URL || process.env.MONGODB_URI || '',

        
    },
    email: {
        provider: process.env.EMAIL_PROVIDER || 'nodemailer',
        zeptomail: {
            apiKey: process.env.ZEPTOMAIL_API_KEY,
            url: process.env.ZEPTOMAIL_URL || 'api.zeptomail.com/',
            fromEmail: process.env.ZEPTOMAIL_FROM_EMAIL,
            bounceAddress: process.env.ZEPTOMAIL_BOUNCE_ADDRESS,
            smtpUser: process.env.ZEPTOMAIL_SMTP_USER,
            smtpPassword: process.env.ZEPTOMAIL_SMTP_PASSWORD,
        },
        smtp: {
            host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10),
            user: process.env.EMAIL_USER || process.env.SMTP_USER || process.env.ZEPTOMAIL_SMTP_USER || '',
            password: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || '',
            secure: process.env.EMAIL_SECURE === 'true',
        },
        gmail: {
            useGmailService: process.env.USE_GMAIL_SERVICE === 'true',
            appPassword: process.env.GOOGLE_APP_PASSWORD,
            oauth: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            },
        },
        mailchimp: {
            apiKey: process.env.MAILCHIMP_API_KEY,
            serverPrefix: process.env.MAILCHIMP_SERVER_PREFIX,
        },
        brevo: {
            apiKey: process.env.BREVO_API_KEY,
        },
        from: process.env.EMAIL_FROM || process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@taskmanager.com',
        fromName: process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'Task Manager',
        replyTo: process.env.EMAIL_REPLY_TO,
    },
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_CALLBACK_URL || '',
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/api/auth/google/callback',
    },
    cors: {
        origins: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:8080',
        ],
    },
    app: {
        url: process.env.APP_URL || 'http://localhost:5173',
        name: process.env.APP_NAME || 'Task Manager',
        twitterUrl: process.env.TWITTER_URL || '#',
        instagramUrl: process.env.INSTAGRAM_URL || '#',
    },
    r2: {
        bucketName: process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_BUCKET_NAME || '',
        publicUrl: process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_PUBLIC_URL || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '',
        accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_ACCESS_KEY_ID || '',
        accountId: process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '',
    },
    cloudflare: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '',
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '',
        bucketName: process.env.CLOUDFLARE_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'task-manager-uploads',
        publicUrl: process.env.CLOUDFLARE_PUBLIC_URL || process.env.R2_PUBLIC_URL || '',
    },
    frontendUrl: process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173',
    admin: {
        email: process.env.ADMIN_EMAIL || 'admin@taskmanager.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    },
};

