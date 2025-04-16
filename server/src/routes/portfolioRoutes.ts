import express, { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { authenticateToken as authenticateJWT } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { PortfolioController } from '../controllers/portfolioController';

const router = express.Router();
const portfolioController = new PortfolioController();

// Get all portfolios for the authenticated user
router.get('/', authenticateJWT, (req: Request, res: Response) => portfolioController.getUserPortfolios(req, res));

// Get a specific portfolio by ID
router.get(
  '/:id',
  authenticateJWT,
  [param('id').isInt().withMessage('Portfolio ID must be an integer')],
  validateRequest,
  (req: Request, res: Response) => portfolioController.getPortfolioById(req, res)
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
  (req: Request, res: Response) => portfolioController.createPortfolio(req, res)
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
  (req: Request, res: Response) => portfolioController.updatePortfolio(req, res)
);

// Delete a portfolio
router.delete(
  '/:id',
  authenticateJWT,
  [param('id').isInt().withMessage('Portfolio ID must be an integer')],
  validateRequest,
  (req: Request, res: Response) => portfolioController.deletePortfolio(req, res)
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
  (req: Request, res: Response) => portfolioController.addInstrument(req, res)
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
  (req: Request, res: Response) => portfolioController.removeInstrument(req, res)
);

export default router; 