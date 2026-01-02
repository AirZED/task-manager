import { Request, Response, NextFunction, RequestHandler } from 'express';

export const catchAsync = <T extends Request = Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<void> | void
): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req as T, res, next)).catch(next);
    };
};

