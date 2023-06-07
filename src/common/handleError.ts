import { Response, Request, NextFunction } from 'express';
import { AppError, AfterResponseError } from './appError';

export function handleError(error: AppError, request: Request, response: Response, next: NextFunction): void {
  if (error instanceof AfterResponseError) {
    response.status(error.status);
  }

  if (!error.isOperational) {
    throw error;
  }

  next(error);
}
