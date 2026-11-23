import { validationResult } from 'express-validator';
import { AppError } from '../helpers/appError.js';
import { asyncHandler } from '../helpers/asyncHandler.js';

export const validateRules = (rules) =>
  asyncHandler(async (req, res, next) => {
    const errors = [];
    for (const rule of rules) {
      const result = await rule.run(req);
      errors.push(...result.array());
    }
    if (errors.length) {
      const [first] = errors;
      throw new AppError(first.msg || 'Datos inválidos', 400, 'VALIDATION_ERROR', 'Corrige los campos según las reglas de Campus');
    }
    // Sanitización de texto antes de uso
    const names = ['fullName', 'email', 'subject', 'password', 'ci', 'newPassword'];
    for (const n of names) {
      if (typeof req.body?.[n] === 'string') req.body[n] = req.body[n].trim();
    }
    next();
  });
