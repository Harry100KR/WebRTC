-- Financial Instrument Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial Instruments
CREATE TABLE IF NOT EXISTS financial_instruments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES product_categories(id),
    interest_rate DECIMAL(5,2),
    term VARCHAR(50),
    minimum_investment DECIMAL(15,2),
    risk_level VARCHAR(20),
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    features JSONB,
    risks JSONB,
    documents JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_financial_instruments_category ON financial_instruments(category_id);
CREATE INDEX IF NOT EXISTS idx_financial_instruments_name ON financial_instruments(name);
CREATE INDEX IF NOT EXISTS idx_financial_instruments_risk_level ON financial_instruments(risk_level);
CREATE INDEX IF NOT EXISTS idx_financial_instruments_is_active ON financial_instruments(is_active);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_financial_instruments_fts ON financial_instruments 
    USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_financial_instruments_updated_at
    BEFORE UPDATE ON financial_instruments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default categories
INSERT INTO product_categories (name, description) VALUES
    ('Mutual Funds', 'Professionally managed investment funds that pool money from multiple investors'),
    ('ETFs', 'Exchange-traded funds that track indexes, commodities, or baskets of assets'),
    ('Bonds', 'Fixed-income securities that represent loans made by investors to borrowers'),
    ('Stocks', 'Shares of ownership in a company'),
    ('Derivatives', 'Financial contracts that derive their value from underlying assets'),
    ('Commodities', 'Raw materials or primary agricultural products'),
    ('Forex', 'Foreign exchange market instruments'),
    ('Cryptocurrencies', 'Digital or virtual currencies'),
    ('Real Estate', 'Property-based investment instruments')
ON CONFLICT (name) DO NOTHING; 