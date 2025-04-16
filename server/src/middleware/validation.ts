import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    next();
  };
};

// Common validation rules
export const commonValidationRules = {
  idParam: {
    in: ['params'],
    isInt: true,
    toInt: true,
    errorMessage: 'Invalid ID parameter'
  },
  pagination: {
    page: {
      in: ['query'],
      optional: true,
      isInt: { options: { min: 1 } },
      toInt: true,
      errorMessage: 'Page must be a positive integer'
    },
    limit: {
      in: ['query'],
      optional: true,
      isInt: { options: { min: 1, max: 100 } },
      toInt: true,
      errorMessage: 'Limit must be between 1 and 100'
    }
  }
}; 