export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

export class ValidationError extends AppError {
  public readonly details: unknown;

  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable entity', code = 'UNPROCESSABLE_ENTITY') {
    super(message, 422, code);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', code = 'TOO_MANY_REQUESTS') {
    super(message, 429, code);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    super(message, 500, code, false);
  }
}

/**
 * AI Service Error - Phase 8
 * Used when AI API calls fail
 */
export class AIServiceError extends AppError {
  public readonly provider: string;
  public readonly originalError?: Error;

  constructor(
    message = 'AI service temporarily unavailable',
    provider = 'gemini',
    originalError?: Error
  ) {
    super(message, 503, 'AI_SERVICE_ERROR');
    this.provider = provider;
    this.originalError = originalError;
  }
}

/**
 * AI Timeout Error - Phase 8
 * Used when AI API call times out
 */
export class AITimeoutError extends AppError {
  public readonly timeoutMs: number;

  constructor(message = 'AI service timeout', timeoutMs = 1000) {
    super(message, 504, 'AI_TIMEOUT');
    this.timeoutMs = timeoutMs;
  }
}
