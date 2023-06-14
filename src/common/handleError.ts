import { NextFunction, Request, Response } from 'express';
import { AppError } from './appError';

export function handleError(error: AppError, request: Request, response: Response, next: NextFunction): void {
  if (!response.headersSent) {
    response.status(error.status);
  }

  if (!error.isOperational) {
    throw error;
  }

  next(error);
}
