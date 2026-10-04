'use strict';

/** Error with a stable machine-readable code and an HTTP status. */
class AppError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

module.exports = { AppError };
