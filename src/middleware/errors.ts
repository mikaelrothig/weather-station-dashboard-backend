import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http';

export const notFound = (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
};

// Express 5 forwards errors thrown in async handlers here. Anything that isn't an HttpError is a provider failing.
export const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
        res.status(error.status).json({ error: error.message });
        return;
    }

    console.error(`${req.method} ${req.originalUrl} failed:`, error);
    res.status(502).json({ error: 'The data provider is unavailable' });
};
