import express from 'express';
import { body, param } from 'express-validator';
import { authenticateJWT } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { PortfolioController } from '../controllers/portfolioController';

const router = express.Router();
const portfolioController = new PortfolioController();

// Get all portfolios for the authenticated user
router.get('/', authenticateJWT, portfolioController.getUserPortfolios);

// Get a specific portfolio by ID
router.get(
  '/:id',
  authenticateJWT,
  [param('id').isInt().withMessage('Portfolio ID must be an integer')],
  validateRequest,
  portfolioController.getPortfolioById
);

// Create a new portfolio
router.post(
  '/',
  authenticateJWT,
  [
    body('name').notEmpty().withMessage('Portfolio name is required'),
    body('description').optional(),
    body('is_public').isBoolean().withMessage('is_public must be a boolean'),
    body('instruments').isArray().withMessage('instruments must be an array'),
  ],
  validateRequest,
  portfolioController.createPortfolio
);

// Update a portfolio
router.put(
  '/:id',
  authenticateJWT,
  [
    param('id').isInt().withMessage('Portfolio ID must be an integer'),
    body('name').optional(),
    body('description').optional(),
    body('is_public').optional().isBoolean().withMessage('is_public must be a boolean'),
    body('instruments').optional().isArray().withMessage('instruments must be an array'),
  ],
  validateRequest,
  portfolioController.updatePortfolio
);

// Delete a portfolio
router.delete(
  '/:id',
  authenticateJWT,
  [param('id').isInt().withMessage('Portfolio ID must be an integer')],
  validateRequest,
  portfolioController.deletePortfolio
);

// Add an instrument to a portfolio
router.post(
  '/:id/instruments/:instrumentId',
  authenticateJWT,
  [
    param('id').isInt().withMessage('Portfolio ID must be an integer'),
    param('instrumentId').isInt().withMessage('Instrument ID must be an integer'),
  ],
  validateRequest,
  portfolioController.addInstrument
);

// Remove an instrument from a portfolio
router.delete(
  '/:id/instruments/:instrumentId',
  authenticateJWT,
  [
    param('id').isInt().withMessage('Portfolio ID must be an integer'),
    param('instrumentId').isInt().withMessage('Instrument ID must be an integer'),
  ],
  validateRequest,
  portfolioController.removeInstrument
);

export default router; 