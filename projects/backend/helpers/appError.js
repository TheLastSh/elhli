export class AppError extends Error {
  constructor(message, status = 500, code = 'ERROR', suggestion = '') {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.suggestion = suggestion;
  }
}
