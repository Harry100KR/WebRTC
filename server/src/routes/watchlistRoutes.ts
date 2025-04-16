import express from 'express';
import { body, param } from 'express-validator';
import { authenticateJWT } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { WatchlistController } from '../controllers/watchlistController';

const router = express.Router();
const watchlistController = new WatchlistController();

// Get all watchlists for the authenticated user
router.get('/', authenticateJWT, watchlistController.getUserWatchlists);

// Get a specific watchlist by ID
router.get(
  '/:id',
  authenticateJWT,
  [param('id').isInt().withMessage('Watchlist ID must be an integer')],
  validateRequest,
  watchlistController.getWatchlistById
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
  watchlistController.createWatchlist
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
  watchlistController.updateWatchlist
);

// Delete a watchlist
router.delete(
  '/:id',
  authenticateJWT,
  [param('id').isInt().withMessage('Watchlist ID must be an integer')],
  validateRequest,
  watchlistController.deleteWatchlist
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
  watchlistController.addInstrument
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
  watchlistController.removeInstrument
);

export default router; 