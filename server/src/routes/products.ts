import express, { Request, Response } from 'express';
import { cacheMiddleware, pgPool } from '../config/database';
import { validateRequest } from '../middleware/validateRequest';
import { body, query } from 'express-validator';

const router = express.Router();

// Validation middleware for search parameters
const searchValidation = [
  query('search').optional().isString(),
  query('category').optional().isInt(),
  query('minInvestment').optional().isFloat({ min: 0 }),
  query('maxInvestment').optional().isFloat({ min: 0 }),
  query('riskLevel').optional().isString(),
  query('page').optional().isInt({ min: 1 }).default(1),
  query('limit').optional().isInt({ min: 1, max: 100 }).default(20),
  validateRequest
];

// Get all categories
router.get('/categories', cacheMiddleware(300), async (req: Request, res: Response) => {
  try {
    const result = await pgPool.query(
      'SELECT * FROM product_categories ORDER BY name'
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Search and filter products
router.get('/', searchValidation, cacheMiddleware(60), async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      minInvestment,
      maxInvestment,
      riskLevel,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const params: any[] = [];
    let whereClause = 'WHERE is_active = true';
    
    // Build search conditions
    if (search) {
      params.push(search);
      whereClause += ` AND (
        to_tsvector('english', name || ' ' || 
          COALESCE(description, '') || ' ' || 
          COALESCE(risk_level, '') || ' ' || 
          COALESCE(term, '') || ' ' ||
          COALESCE(features::text, '') || ' ' ||
          COALESCE(risks::text, '')
        ) @@ websearch_to_tsquery('english', $${params.length})
        OR
        name ILIKE '%' || $${params.length} || '%'
        OR
        description ILIKE '%' || $${params.length} || '%'
      )`;
    }
    
    if (category) {
      params.push(category);
      whereClause += ` AND category_id = $${params.length}`;
    }
    
    if (minInvestment) {
      params.push(minInvestment);
      whereClause += ` AND minimum_investment >= $${params.length}`;
    }
    
    if (maxInvestment) {
      params.push(maxInvestment);
      whereClause += ` AND minimum_investment <= $${params.length}`;
    }
    
    if (riskLevel) {
      params.push(riskLevel);
      whereClause += ` AND risk_level = $${params.length}`;
    }
    
    // Add pagination parameters
    params.push(limit, offset);

    const query = `
      SELECT 
        f.*,
        c.name as category_name,
        c.description as category_description,
        COUNT(*) OVER() as total_count
      FROM financial_instruments f
      JOIN product_categories c ON f.category_id = c.id
      ${whereClause}
      ORDER BY f.name
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    console.log('Executing query:', query);
    console.log('Query parameters:', params);

    const result = await pgPool.query(query, params);
    
    const totalCount = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / Number(limit));

    res.json({
      data: result.rows.map(row => ({
        ...row,
        total_count: undefined // Remove count from individual items
      })),
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        total_pages: totalPages
      }
    });
  } catch (error: any) {
    console.error('Error searching products:', error);
    res.status(500).json({ 
      error: 'Failed to search products',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      query: process.env.NODE_ENV === 'development' ? req.query : undefined
    });
  }
});

// Get product by ID
router.get('/:id', cacheMiddleware(300), async (req: Request, res: Response) => {
  try {
    const result = await pgPool.query(`
      SELECT 
        f.*,
        c.name as category_name,
        c.description as category_description
      FROM financial_instruments f
      JOIN product_categories c ON f.category_id = c.id
      WHERE f.id = $1 AND f.is_active = true
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product validation
const createProductValidation = [
  body('name').isString().notEmpty().trim(),
  body('description').isString().optional(),
  body('category_id').isInt().notEmpty(),
  body('interest_rate').isFloat({ min: 0 }).optional(),
  body('term').isString().optional(),
  body('minimum_investment').isFloat({ min: 0 }).optional(),
  body('risk_level').isString().optional(),
  body('currency').isString().isLength({ min: 3, max: 3 }).optional(),
  body('features').isArray().optional(),
  body('risks').isArray().optional(),
  body('documents').isArray().optional(),
  validateRequest
];

// Create new product
router.post('/', createProductValidation, async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category_id,
      interest_rate,
      term,
      minimum_investment,
      risk_level,
      currency,
      features,
      risks,
      documents,
      metadata
    } = req.body;

    const result = await pgPool.query(`
      INSERT INTO financial_instruments (
        name, description, category_id, interest_rate, term,
        minimum_investment, risk_level, currency, features,
        risks, documents, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      name, description, category_id, interest_rate, term,
      minimum_investment, risk_level, currency, JSON.stringify(features),
      JSON.stringify(risks), JSON.stringify(documents), JSON.stringify(metadata)
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router; 