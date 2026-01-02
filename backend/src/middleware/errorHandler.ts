import { Response, Request, NextFunction } from 'express';
import { AppError, AppErrorTypes } from '../utils/appError';
import { config } from '../config/config';


class ErrorController {
    env: string;

    constructor(env: string) {
        this.env = env;
    }

    // SEND THE GLOBAL ERROR
    globalSendError = (
        err: AppErrorTypes | Error | AppError,
        _req: Request,
        res: Response,
        _next: NextFunction,
    ) => {
        // Ensure we have an AppError-like object
        let error: AppErrorTypes = err as AppErrorTypes;

        // If it's a regular Error or AppError, convert it to AppErrorTypes format
        if (err instanceof AppError) {
            error = {
                errorMessage: err.message,
                status: err.statusCode.toString().startsWith('4') ? 'failed' : 'error',
                isOperational: true,
                statusCode: err.statusCode,
                message: err.message,
                path: null,
                value: null,
                ermsg: null,
                errors: {},
                name: err.name,
                code: null,
                errorCode: err.errorCode,
                waitTime: err.waitTime,
            } as AppErrorTypes;
        } else if (!('statusCode' in err)) {
            error = {
                ...err,
                errorMessage: err.message || 'Internal server error',
                statusCode: 500,
                status: 'error',
                isOperational: false,
                message: err.message || 'Internal server error',
                path: null,
                value: null,
                ermsg: null,
                errors: {},
                name: err.name || 'Error',
                code: null,
            } as AppErrorTypes;
        }

        error.statusCode = error.statusCode || 500;
        error.status = error.status || 'error';

        if (this.env === 'development') {
            return this.sendDevError(error, res);
        }

        // Production error handling
        let processedError: AppErrorTypes = error;

        if (error.name === 'CastError') {
            processedError = this.handleCastErrorDB(error);
        } else if (error.code === 11000) {
            processedError = this.handleDuplicateFieldsDB(error);
        } else if (error.name === 'ValidationError') {
            processedError = this.handleValidateErrorDB(error);
        } else if (error.name === 'JsonWebTokenError') {
            processedError = this.hendleJWTError();
        } else if (error.name === 'TokenExpiredError') {
            processedError = this.handleJWTExpireError();
        }

        return this.sendProdError(processedError, res);
    };

    // HANDLE PRODUCTION ERROR
    sendProdError = (err: AppErrorTypes, res: Response) => {
        console.log(err);
        if (err.isOperational) {
            const response: any = {
                status: err.status,
                message: err.message,
            };

            // Add optional error fields if present
            if (err.errorCode) {
                response.errorCode = err.errorCode;
            }

            if (err.waitTime) {
                response.waitTime = err.waitTime;
                response.retryAfter = new Date(Date.now() + err.waitTime * 1000).toISOString();
            }

            res.status(err.statusCode).json(response);
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Something really went wrong',
            });
        }
    };

    // HANDLE DEVELOPMENT ERROR
    sendDevError = (err: AppErrorTypes, res: Response) => {
        const response: any = {
            status: err.status,
            message: err.message,
            error: err,
        };

        // Add optional error fields if present (for debugging)
        if (err.errorCode) {
            response.errorCode = err.errorCode;
        }

        if (err.waitTime) {
            response.waitTime = err.waitTime;
            response.retryAfter = new Date(Date.now() + err.waitTime * 1000).toISOString();
        }

        res.status(err.statusCode).json(response);
    };

    handleJWTExpireError = (): AppErrorTypes => {
        const appError = new AppError('jwt has expired', 404);
        return {
            errorMessage: appError.message,
            status: 'failed',
            isOperational: true,
            statusCode: 404,
            message: appError.message,
            path: null,
            value: null,
            ermsg: null,
            errors: {},
            name: 'TokenExpiredError',
            code: null,
        };
    };

    handleCastErrorDB = (err: AppErrorTypes): AppErrorTypes => {
        const appError = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
        return {
            errorMessage: appError.message,
            status: 'failed',
            isOperational: true,
            statusCode: 400,
            message: appError.message,
            path: err.path,
            value: err.value,
            ermsg: null,
            errors: {},
            name: 'CastError',
            code: null,
        };
    };

    handleDuplicateFieldsDB = (err: AppErrorTypes): AppErrorTypes => {
        const value = err.ermsg ? err.ermsg.match(/(["'])(\\?.)*?\1/)![0] : null;
        const appError = new AppError(
            `Duplicate field value: ${value}. Please use another value!`,
            400,
        );
        return {
            errorMessage: appError.message,
            status: 'failed',
            isOperational: true,
            statusCode: 400,
            message: appError.message,
            path: null,
            value: null,
            ermsg: err.ermsg,
            errors: {},
            name: 'DuplicateError',
            code: 11000,
        };
    };

    handleValidateErrorDB = (err: AppErrorTypes): AppErrorTypes => {
        const errors: string[] = Object.values(err.errors).map(
            (el: any) => el.message,
        );
        const message = `Invalid input data. ${errors.join('. ')}`;
        const appError = new AppError(message, 400);
        return {
            errorMessage: appError.message,
            status: 'failed',
            isOperational: true,
            statusCode: 400,
            message: appError.message,
            path: null,
            value: null,
            ermsg: null,
            errors: err.errors,
            name: 'ValidationError',
            code: null,
        };
    };

    hendleJWTError = (): AppErrorTypes => {
        const appError = new AppError('Invalid Token, Please log in again', 401);
        return {
            errorMessage: appError.message,
            status: 'failed',
            isOperational: true,
            statusCode: 401,
            message: appError.message,
            path: null,
            value: null,
            ermsg: null,
            errors: {},
            name: 'JsonWebTokenError',
            code: null,
        };
    };
}


const errorController = new ErrorController(config.nodeEnv);

export default errorController;