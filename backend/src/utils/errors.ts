export class BadRequestError extends Error {
  statusCode = 400;
  code: string;
  constructor(message: string, code = 'BAD_REQUEST') {
    super(message);
    this.name = 'BadRequestError';
    this.code = code;
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code: string;
  constructor(message: string, code = 'NOT_FOUND') {
    super(message);
    this.name = 'NotFoundError';
    this.code = code;
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code: string;
  constructor(message: string, code = 'UNAUTHORIZED') {
    super(message);
    this.name = 'UnauthorizedError';
    this.code = code;
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code: string;
  constructor(message: string, code = 'FORBIDDEN') {
    super(message);
    this.name = 'ForbiddenError';
    this.code = code;
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code: string;
  constructor(message: string, code = 'CONFLICT') {
    super(message);
    this.name = 'ConflictError';
    this.code = code;
  }
}
