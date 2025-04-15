import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config();

// Configuration for connecting to PostgreSQL with superuser privileges
const initPool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres' // Connect to default database first
});

async function initializeDatabase() {
  try {
    console.log('Testing database connection...');
    await initPool.query('SELECT NOW()');
    console.log('Database connection successful');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'webrtc_db';
    const result = await initPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`Creating database ${dbName}...`);
      await initPool.query(`CREATE DATABASE ${dbName}`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }

    // Create user if it doesn't exist
    try {
      await initPool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1) THEN
            EXECUTE format('CREATE USER %I WITH PASSWORD %L', $1, $2);
          END IF;
        END
        $$;
      `, [process.env.DB_USER, process.env.DB_PASSWORD]);
      
      await initPool.query(`ALTER USER ${process.env.DB_USER} WITH CREATEDB;`);
      console.log('User setup completed');
    } catch (error) {
      console.log('User already exists or could not be created:', error);
    }

    // Close the initial connection
    await initPool.end();

    // Connect to the created database as postgres user
    const dbPool = new Pool({
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: dbName
    });

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema...');
    await dbPool.query(schema);
    console.log('Schema executed successfully');

    // Grant privileges to webrtc_user
    await dbPool.query(`
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${process.env.DB_USER};
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${process.env.DB_USER};
    `);
    console.log('Privileges granted successfully');

    // Insert sample data if the tables are empty
    const categoryCount = await dbPool.query('SELECT COUNT(*) FROM product_categories');
    if (categoryCount.rows[0].count === '0') {
      console.log('Inserting sample data...');
      const sampleData = [
        {
          name: 'US Tech Growth ETF',
          description: 'An ETF tracking leading US technology companies',
          category_id: 2, // ETFs category
          minimum_investment: 1000,
          risk_level: 'moderate',
          features: ['Low fees', 'High liquidity', 'Diversified exposure'],
          risks: ['Market risk', 'Sector concentration risk'],
          documents: ['/documents/us-tech-etf-prospectus.pdf']
        },
        {
          name: 'Global Bond Fund',
          description: 'A diversified portfolio of international government and corporate bonds',
          category_id: 3, // Bonds category
          interest_rate: 4.5,
          term: '5 years',
          minimum_investment: 5000,
          risk_level: 'low',
          features: ['Regular income', 'Capital preservation', 'International diversification'],
          risks: ['Interest rate risk', 'Currency risk'],
          documents: ['/documents/global-bond-prospectus.pdf']
        }
      ];

      for (const product of sampleData) {
        await dbPool.query(`
          INSERT INTO financial_instruments (
            name, description, category_id, interest_rate, term,
            minimum_investment, risk_level, features, risks, documents
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          product.name,
          product.description,
          product.category_id,
          product.interest_rate || null,
          product.term || null,
          product.minimum_investment,
          product.risk_level,
          JSON.stringify(product.features),
          JSON.stringify(product.risks),
          JSON.stringify(product.documents)
        ]);
      }
      console.log('Sample data inserted successfully');
    }

    await dbPool.end();
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase(); 