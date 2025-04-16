import { Request, Response } from 'express';
import { pool } from '../config/database';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

interface PortfolioInstrument {
  instrument_id: string;
}

export class PortfolioController {
  // Get all portfolios for the authenticated user
  async getUserPortfolios(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      // Get all portfolios
      const portfoliosResult = await pool.query(
        `SELECT p.id, p.name, p.description, p.is_public, p.created_at, p.updated_at
         FROM portfolios p
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC`,
        [userId]
      );

      const portfolios = portfoliosResult.rows;

      // For each portfolio, get its instruments
      for (const portfolio of portfolios) {
        const instrumentsResult = await pool.query(
          `SELECT pi.instrument_id
           FROM portfolio_instruments pi
           WHERE pi.portfolio_id = $1`,
          [portfolio.id]
        );
        
        portfolio.instruments = instrumentsResult.rows.map((row: PortfolioInstrument) => row.instrument_id);
      }

      res.status(200).json(portfolios);
    } catch (error) {
      logger.error('Error in getUserPortfolios:', error);
      res.status(500).json({ message: 'Failed to get portfolios' });
    }
  }

  // Get a specific portfolio by ID
  async getPortfolioById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Get the portfolio
      const portfolioResult = await pool.query(
        `SELECT p.id, p.name, p.description, p.is_public, p.created_at, p.updated_at
         FROM portfolios p
         WHERE p.id = $1 AND (p.user_id = $2 OR p.is_public = true)`,
        [id, userId]
      );

      if (portfolioResult.rows.length === 0) {
        res.status(404).json({ message: 'Portfolio not found' });
        return;
      }

      const portfolio = portfolioResult.rows[0];

      // Get portfolio instruments
      const instrumentsResult = await pool.query(
        `SELECT pi.instrument_id
         FROM portfolio_instruments pi
         WHERE pi.portfolio_id = $1`,
        [portfolio.id]
      );
      
      portfolio.instruments = instrumentsResult.rows.map((row: PortfolioInstrument) => row.instrument_id);

      res.status(200).json(portfolio);
    } catch (error) {
      logger.error('Error in getPortfolioById:', error);
      res.status(500).json({ message: 'Failed to get portfolio' });
    }
  }

  // Create a new portfolio
  async createPortfolio(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, is_public, instruments } = req.body;
      const userId = req.user?.id;

      // Begin transaction
      await pool.query('BEGIN');

      // Create portfolio
      const portfolioResult = await pool.query(
        `INSERT INTO portfolios (name, description, user_id, is_public)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, description, is_public, created_at, updated_at`,
        [name, description, userId, is_public]
      );

      const portfolio = portfolioResult.rows[0];
      
      // Add instruments to portfolio
      if (instruments && instruments.length > 0) {
        const values = instruments.map((instrumentId: number) => {
          return `(${portfolio.id}, ${instrumentId})`;
        }).join(', ');

        await pool.query(
          `INSERT INTO portfolio_instruments (portfolio_id, instrument_id)
           VALUES ${values}
           ON CONFLICT (portfolio_id, instrument_id) DO NOTHING`
        );
      }

      // Set instruments array
      portfolio.instruments = instruments || [];

      // Commit transaction
      await pool.query('COMMIT');

      res.status(201).json(portfolio);
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      logger.error('Error in createPortfolio:', error);
      res.status(500).json({ message: 'Failed to create portfolio' });
    }
  }

  // Update a portfolio
  async updatePortfolio(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, is_public, instruments } = req.body;
      const userId = req.user?.id;

      // Check if portfolio exists and belongs to user
      const portfolioCheck = await pool.query(
        'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (portfolioCheck.rows.length === 0) {
        res.status(404).json({ message: 'Portfolio not found or you do not have permission to update it' });
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

      if (is_public !== undefined) {
        updateFields.push(`is_public = $${valueIndex++}`);
        values.push(is_public);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      // Update portfolio if there are fields to update
      if (updateFields.length > 1) { // > 1 because updated_at is always included
        const updateQuery = `
          UPDATE portfolios
          SET ${updateFields.join(', ')}
          WHERE id = $1
          RETURNING id, name, description, is_public, created_at, updated_at
        `;
        
        const portfolioResult = await pool.query(updateQuery, values);
        
        // Update instruments if provided
        if (instruments !== undefined) {
          // First delete all existing instruments
          await pool.query(
            'DELETE FROM portfolio_instruments WHERE portfolio_id = $1',
            [id]
          );
          
          // Then add the new instruments
          if (instruments.length > 0) {
            const instrumentValues = instruments.map((instrumentId: number) => {
              return `(${id}, ${instrumentId})`;
            }).join(', ');
            
            await pool.query(
              `INSERT INTO portfolio_instruments (portfolio_id, instrument_id)
               VALUES ${instrumentValues}
               ON CONFLICT (portfolio_id, instrument_id) DO NOTHING`
            );
          }
        }
        
        // Get updated instruments
        const instrumentsResult = await pool.query(
          `SELECT instrument_id FROM portfolio_instruments WHERE portfolio_id = $1`,
          [id]
        );
        
        const portfolio = portfolioResult.rows[0];
        portfolio.instruments = instrumentsResult.rows.map((row: PortfolioInstrument) => row.instrument_id);
        
        // Commit transaction
        await pool.query('COMMIT');
        
        res.status(200).json(portfolio);
      } else {
        // No fields to update, just return the portfolio with instruments
        await pool.query('ROLLBACK'); // No need for transaction
        
        const portfolioResult = await pool.query(
          `SELECT p.id, p.name, p.description, p.is_public, p.created_at, p.updated_at
           FROM portfolios p
           WHERE p.id = $1`,
          [id]
        );
        
        const instrumentsResult = await pool.query(
          `SELECT instrument_id FROM portfolio_instruments WHERE portfolio_id = $1`,
          [id]
        );
        
        const portfolio = portfolioResult.rows[0];
        portfolio.instruments = instrumentsResult.rows.map((row: PortfolioInstrument) => row.instrument_id);
        
        res.status(200).json(portfolio);
      }
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      logger.error('Error in updatePortfolio:', error);
      res.status(500).json({ message: 'Failed to update portfolio' });
    }
  }

  // Delete a portfolio
  async deletePortfolio(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check if portfolio exists and belongs to user
      const portfolioCheck = await pool.query(
        'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (portfolioCheck.rows.length === 0) {
        res.status(404).json({ message: 'Portfolio not found or you do not have permission to delete it' });
        return;
      }

      // Delete portfolio (cascade will handle deleting related records)
      await pool.query('DELETE FROM portfolios WHERE id = $1', [id]);

      res.status(200).json({ message: 'Portfolio deleted successfully' });
    } catch (error) {
      logger.error('Error in deletePortfolio:', error);
      res.status(500).json({ message: 'Failed to delete portfolio' });
    }
  }

  // Add an instrument to a portfolio
  async addInstrument(req: Request, res: Response): Promise<void> {
    try {
      const { id, instrumentId } = req.params;
      const userId = req.user?.id;

      // Check if portfolio exists and belongs to user
      const portfolioCheck = await pool.query(
        'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (portfolioCheck.rows.length === 0) {
        res.status(404).json({ message: 'Portfolio not found or you do not have permission to update it' });
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

      // Add instrument to portfolio
      await pool.query(
        `INSERT INTO portfolio_instruments (portfolio_id, instrument_id)
         VALUES ($1, $2)
         ON CONFLICT (portfolio_id, instrument_id) DO NOTHING`,
        [id, instrumentId]
      );

      res.status(200).json({ message: 'Instrument added to portfolio successfully' });
    } catch (error) {
      logger.error('Error in addInstrument:', error);
      res.status(500).json({ message: 'Failed to add instrument to portfolio' });
    }
  }

  // Remove an instrument from a portfolio
  async removeInstrument(req: Request, res: Response): Promise<void> {
    try {
      const { id, instrumentId } = req.params;
      const userId = req.user?.id;

      // Check if portfolio exists and belongs to user
      const portfolioCheck = await pool.query(
        'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (portfolioCheck.rows.length === 0) {
        res.status(404).json({ message: 'Portfolio not found or you do not have permission to update it' });
        return;
      }

      // Remove instrument from portfolio
      await pool.query(
        'DELETE FROM portfolio_instruments WHERE portfolio_id = $1 AND instrument_id = $2',
        [id, instrumentId]
      );

      res.status(200).json({ message: 'Instrument removed from portfolio successfully' });
    } catch (error) {
      logger.error('Error in removeInstrument:', error);
      res.status(500).json({ message: 'Failed to remove instrument from portfolio' });
    }
  }
} 