import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { Logger } from 'winston';
import logger from '../utils/logger';

// Define interface for database row types
interface WatchlistInstrumentRow {
  instrument_id: number;
}

export class WatchlistController {
  // Get all watchlists for the authenticated user
  async getUserWatchlists(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      // Get all watchlists
      const watchlistsResult = await pool.query(
        `SELECT w.id, w.name, w.description, w.created_at, w.updated_at
         FROM watchlists w
         WHERE w.user_id = $1
         ORDER BY w.created_at DESC`,
        [userId]
      );

      const watchlists = watchlistsResult.rows;

      // For each watchlist, get its instruments
      for (const watchlist of watchlists) {
        const instrumentsResult = await pool.query(
          `SELECT wi.instrument_id
           FROM watchlist_instruments wi
           WHERE wi.watchlist_id = $1`,
          [watchlist.id]
        );
        
        watchlist.instruments = instrumentsResult.rows.map((row: WatchlistInstrumentRow) => row.instrument_id);
      }

      res.status(200).json(watchlists);
    } catch (error) {
      logger.error('Error in getUserWatchlists:', error);
      res.status(500).json({ message: 'Failed to get watchlists' });
    }
  }

  // Get a specific watchlist by ID
  async getWatchlistById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Get the watchlist
      const watchlistResult = await pool.query(
        `SELECT w.id, w.name, w.description, w.created_at, w.updated_at
         FROM watchlists w
         WHERE w.id = $1 AND w.user_id = $2`,
        [id, userId]
      );

      if (watchlistResult.rows.length === 0) {
        res.status(404).json({ message: 'Watchlist not found' });
        return;
      }

      const watchlist = watchlistResult.rows[0];

      // Get watchlist instruments
      const instrumentsResult = await pool.query(
        `SELECT wi.instrument_id
         FROM watchlist_instruments wi
         WHERE wi.watchlist_id = $1`,
        [watchlist.id]
      );
      
      watchlist.instruments = instrumentsResult.rows.map((row: WatchlistInstrumentRow) => row.instrument_id);

      res.status(200).json(watchlist);
    } catch (error) {
      logger.error('Error in getWatchlistById:', error);
      res.status(500).json({ message: 'Failed to get watchlist' });
    }
  }

  // Create a new watchlist
  async createWatchlist(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, instruments } = req.body;
      const userId = req.user?.id;

      // Begin transaction
      await pool.query('BEGIN');

      // Create watchlist
      const watchlistResult = await pool.query(
        `INSERT INTO watchlists (name, description, user_id)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, created_at, updated_at`,
        [name, description, userId]
      );

      const watchlist = watchlistResult.rows[0];
      
      // Add instruments to watchlist
      if (instruments && instruments.length > 0) {
        const values = instruments.map((instrumentId: number) => {
          return `(${watchlist.id}, ${instrumentId})`;
        }).join(', ');

        await pool.query(
          `INSERT INTO watchlist_instruments (watchlist_id, instrument_id)
           VALUES ${values}
           ON CONFLICT (watchlist_id, instrument_id) DO NOTHING`
        );
      }

      // Set instruments array
      watchlist.instruments = instruments || [];

      // Commit transaction
      await pool.query('COMMIT');

      res.status(201).json(watchlist);
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      logger.error('Error in createWatchlist:', error);
      res.status(500).json({ message: 'Failed to create watchlist' });
    }
  }

  // Update a watchlist
  async updateWatchlist(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, instruments } = req.body;
      const userId = req.user?.id;

      // Check if watchlist exists and belongs to user
      const watchlistCheck = await pool.query(
        'SELECT id FROM watchlists WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (watchlistCheck.rows.length === 0) {
        res.status(404).json({ message: 'Watchlist not found or you do not have permission to update it' });
        return;
      }

      // Begin transaction
      await pool.query('BEGIN');

      // Prepare update fields
      const updateFields = [];
      const values = [id];
      let valueIndex = 2;

      if (name !== undefined) {
        updateFields.push(`name = $${valueIndex++}`);
        values.push(name);
      }

      if (description !== undefined) {
        updateFields.push(`description = $${valueIndex++}`);
        values.push(description);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      // Update watchlist if there are fields to update
      if (updateFields.length > 1) { // > 1 because updated_at is always included
        const updateQuery = `
          UPDATE watchlists
          SET ${updateFields.join(', ')}
          WHERE id = $1
          RETURNING id, name, description, created_at, updated_at
        `;
        
        const watchlistResult = await pool.query(updateQuery, values);
        
        // Update instruments if provided
        if (instruments !== undefined) {
          // First delete all existing instruments
          await pool.query(
            'DELETE FROM watchlist_instruments WHERE watchlist_id = $1',
            [id]
          );
          
          // Then add the new instruments
          if (instruments.length > 0) {
            const instrumentValues = instruments.map((instrumentId: number) => {
              return `(${id}, ${instrumentId})`;
            }).join(', ');
            
            await pool.query(
              `INSERT INTO watchlist_instruments (watchlist_id, instrument_id)
               VALUES ${instrumentValues}
               ON CONFLICT (watchlist_id, instrument_id) DO NOTHING`
            );
          }
        }
        
        // Get updated instruments
        const instrumentsResult = await pool.query(
          `SELECT instrument_id FROM watchlist_instruments WHERE watchlist_id = $1`,
          [id]
        );
        
        const watchlist = watchlistResult.rows[0];
        watchlist.instruments = instrumentsResult.rows.map((row: WatchlistInstrumentRow) => row.instrument_id);
        
        // Commit transaction
        await pool.query('COMMIT');
        
        res.status(200).json(watchlist);
      } else {
        // No fields to update, just return the watchlist with instruments
        await pool.query('ROLLBACK'); // No need for transaction
        
        const watchlistResult = await pool.query(
          `SELECT w.id, w.name, w.description, w.created_at, w.updated_at
           FROM watchlists w
           WHERE w.id = $1`,
          [id]
        );
        
        const instrumentsResult = await pool.query(
          `SELECT instrument_id FROM watchlist_instruments WHERE watchlist_id = $1`,
          [id]
        );
        
        const watchlist = watchlistResult.rows[0];
        watchlist.instruments = instrumentsResult.rows.map((row: WatchlistInstrumentRow) => row.instrument_id);
        
        res.status(200).json(watchlist);
      }
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      logger.error('Error in updateWatchlist:', error);
      res.status(500).json({ message: 'Failed to update watchlist' });
    }
  }

  // Delete a watchlist
  async deleteWatchlist(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check if watchlist exists and belongs to user
      const watchlistCheck = await pool.query(
        'SELECT id FROM watchlists WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (watchlistCheck.rows.length === 0) {
        res.status(404).json({ message: 'Watchlist not found or you do not have permission to delete it' });
        return;
      }

      // Delete watchlist (cascade will handle deleting related records)
      await pool.query('DELETE FROM watchlists WHERE id = $1', [id]);

      res.status(200).json({ message: 'Watchlist deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteWatchlist:', error);
      res.status(500).json({ message: 'Failed to delete watchlist' });
    }
  }

  // Add an instrument to a watchlist
  async addInstrument(req: Request, res: Response): Promise<void> {
    try {
      const { id, instrumentId } = req.params;
      const userId = req.user?.id;

      // Check if watchlist exists and belongs to user
      const watchlistCheck = await pool.query(
        'SELECT id FROM watchlists WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (watchlistCheck.rows.length === 0) {
        res.status(404).json({ message: 'Watchlist not found or you do not have permission to update it' });
        return;
      }

      // Check if instrument exists
      const instrumentCheck = await pool.query(
        'SELECT id FROM financial_instruments WHERE id = $1',
        [instrumentId]
      );

      if (instrumentCheck.rows.length === 0) {
        res.status(404).json({ message: 'Instrument not found' });
        return;
      }

      // Add instrument to watchlist
      await pool.query(
        `INSERT INTO watchlist_instruments (watchlist_id, instrument_id)
         VALUES ($1, $2)
         ON CONFLICT (watchlist_id, instrument_id) DO NOTHING`,
        [id, instrumentId]
      );

      res.status(200).json({ message: 'Instrument added to watchlist successfully' });
    } catch (error) {
      logger.error('Error in addInstrument:', error);
      res.status(500).json({ message: 'Failed to add instrument to watchlist' });
    }
  }

  // Remove an instrument from a watchlist
  async removeInstrument(req: Request, res: Response): Promise<void> {
    try {
      const { id, instrumentId } = req.params;
      const userId = req.user?.id;

      // Check if watchlist exists and belongs to user
      const watchlistCheck = await pool.query(
        'SELECT id FROM watchlists WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (watchlistCheck.rows.length === 0) {
        res.status(404).json({ message: 'Watchlist not found or you do not have permission to update it' });
        return;
      }

      // Remove instrument from watchlist
      await pool.query(
        'DELETE FROM watchlist_instruments WHERE watchlist_id = $1 AND instrument_id = $2',
        [id, instrumentId]
      );

      res.status(200).json({ message: 'Instrument removed from watchlist successfully' });
    } catch (error) {
      logger.error('Error in removeInstrument:', error);
      res.status(500).json({ message: 'Failed to remove instrument from watchlist' });
    }
  }
} 