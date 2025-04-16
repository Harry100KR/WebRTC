import express, { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { authenticateToken as authenticateJWT } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { WatchlistController } from '../controllers/watchlistController';

const router = express.Router();
const watchlistController = new WatchlistController();

// Get all watchlists for the authenticated user
router.get('/', authenticateJWT, (req: Request, res: Response) => watchlistController.getUserWatchlists(req, res));

// Get a specific watchlist by ID
router.get(
  '/:id',
  authenticateJWT,
  [param('id').isInt().withMessage('Watchlist ID must be an integer')],
  validateRequest,
  (req: Request, res: Response) => watchlistController.getWatchlistById(req, res)
);

// Create a new watchlist
router.post(
  '/',
  authenticateJWT,
  [
    body('name').notEmpty().withMessage('Watchlist name is required'),
    body('description').optional(),
    body('instruments').isArray().withMessage('instruments must be an array'),
  ],
  validateRequest,
  (req: Request, res: Response) => watchlistController.createWatchlist(req, res)
);

// Update a watchlist
router.put(
  '/:id',
  authenticateJWT,
  [
    param('id').isInt().withMessage('Watchlist ID must be an integer'),
    body('name').optional(),
    body('description').optional(),
    body('instruments').optional().isArray().withMessage('instruments must be an array'),
  ],
  validateRequest,
  (req: Request, res: Response) => watchlistController.updateWatchlist(req, res)
);

// Delete a watchlist
router.delete(
  '/:id',
  authenticateJWT,
  [param('id').isInt().withMessage('Watchlist ID must be an integer')],
  validateRequest,
  (req: Request, res: Response) => watchlistController.deleteWatchlist(req, res)
);

// Add an instrument to a watchlist
router.post(
  '/:id/instruments/:instrumentId',
  authenticateJWT,
  [
    param('id').isInt().withMessage('Watchlist ID must be an integer'),
    param('instrumentId').isInt().withMessage('Instrument ID must be an integer'),
  ],
  validateRequest,
  (req: Request, res: Response) => watchlistController.addInstrument(req, res)
);

// Remove an instrument from a watchlist
router.delete(
  '/:id/instruments/:instrumentId',
  authenticateJWT,
  [
    param('id').isInt().withMessage('Watchlist ID must be an integer'),
    param('instrumentId').isInt().withMessage('Instrument ID must be an integer'),
  ],
  validateRequest,
  (req: Request, res: Response) => watchlistController.removeInstrument(req, res)
);

export default router; 