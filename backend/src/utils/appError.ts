export interface AppErrorTypes {
    errorMessage: string;
    status: 'failed' | 'error';
    isOperational: boolean;
    statusCode: number;
    message: string;
    path: string | null;
    value: string | number | null;
    ermsg: string | null;
    errors: object;
    name: string | null;
    code: number | null;
    // Optional fields for error handling
    errorCode?: string;
    waitTime?: number;
}

export class AppError extends Error {
    protected errorMessage: string;
    protected status: 'failed' | 'error';
    protected isOperational: boolean;
    public statusCode: number; // Made public for error handler access
    // New optional properties
    public errorCode?: string;
    public waitTime?: number;

    constructor(message: string, statusCode: number, errorCode?: string, waitTime?: number) {
        super(message);

        this.errorMessage = message;
        this.status = `${statusCode}`.startsWith('4') ? 'failed' : 'error';
        this.statusCode = statusCode;
        this.isOperational = true;

        // Only set if provided
        if (errorCode) this.errorCode = errorCode;
        if (waitTime) this.waitTime = waitTime;

        Error.captureStackTrace(this, this.constructor);
    }
}

