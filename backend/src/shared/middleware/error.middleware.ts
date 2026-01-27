import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';
import { env } from '../config/index.js';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  request.log.error(error);

  // Custom AppError
  if (error instanceof AppError) {
    reply.status(error.statusCode).send(
      errorResponse(
        error.code,
        error.message,
        error instanceof ValidationError ? error.details : undefined
      )
    );
    return;
  }

  // Zod validation error
  if (error instanceof ZodError) {
    reply.status(400).send(
      errorResponse('VALIDATION_ERROR', 'Validation failed', error.flatten())
    );
    return;
  }

  // Prisma errors (check by error name to avoid import issues)
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = handlePrismaError(error as PrismaKnownError);
    reply.status(prismaError.statusCode).send(
      errorResponse(prismaError.code, prismaError.message)
    );
    return;
  }

  // Fastify validation error
  if (error.validation) {
    reply.status(400).send(
      errorResponse('VALIDATION_ERROR', 'Validation failed', error.validation)
    );
    return;
  }

  // Default error
  const statusCode = error.statusCode ?? 500;
  const message = env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : error.message;

  reply.status(statusCode).send(
    errorResponse('INTERNAL_ERROR', message)
  );
}

// Minimal type for Prisma error handling without importing Prisma
interface PrismaKnownError extends Error {
  code: string;
  meta?: Record<string, unknown>;
}

function handlePrismaError(error: PrismaKnownError): {
  statusCode: number;
  code: string;
  message: string;
} {
  switch (error.code) {
    case 'P2002':
      return {
        statusCode: 409,
        code: 'CONFLICT',
        message: 'A record with this value already exists',
      };
    case 'P2025':
      return {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Record not found',
      };
    case 'P2003':
      return {
        statusCode: 400,
        code: 'FOREIGN_KEY_ERROR',
        message: 'Related record not found',
      };
    default:
      return {
        statusCode: 500,
        code: 'DATABASE_ERROR',
        message: 'Database error occurred',
      };
  }
}
