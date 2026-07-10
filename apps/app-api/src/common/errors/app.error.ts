export interface AppErrorDetails {
  [key: string]: unknown;
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: AppErrorDetails,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.', details?: AppErrorDetails) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = 'You do not have access to this resource.',
    details?: AppErrorDetails,
  ) {
    super(message, 'FORBIDDEN', 403, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Input validation failed.', details?: AppErrorDetails) {
    super(message, 'BAD_USER_INPUT', 400, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists.', details?: AppErrorDetails) {
    super(message, 'CONFLICT', 409, details);
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(
    message = 'The requested status transition is not allowed.',
    details?: AppErrorDetails,
  ) {
    super(message, 'INVALID_STATUS_TRANSITION', 409, details);
  }
}

export class DuplicateSessionError extends AppError {
  constructor(
    message = 'Duplicate session detected',
    details?: AppErrorDetails,
  ) {
    super(message, 'DUPLICATE_SESSION', 409, details);
  }
}

export class SessionTimeoutError extends AppError {
  constructor(
    message = 'Session has expired. Please log in again.',
    details?: AppErrorDetails,
  ) {
    super(message, 'SESSION_TIMEOUT', 401, details);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(
    message = 'Invalid email or password.',
    details?: AppErrorDetails,
  ) {
    super(message, 'INVALID_CREDENTIALS', 401, details);
  }
}
