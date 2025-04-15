DROP DATABASE IF EXISTS webrtc_db;
CREATE DATABASE webrtc_db;
\c webrtc_db;

CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

INSERT INTO product_categories (name, description) VALUES
    ('Mutual Funds', 'Professionally managed investment funds'),
    ('ETFs', 'Exchange-traded funds'),
    ('Bonds', 'Fixed income securities');

INSERT INTO financial_instruments (
    name, 
    description, 
    category_id, 
    minimum_investment, 
    risk_level, 
    features, 
    risks, 
    documents
) VALUES (
    'US Tech Growth ETF',
    'An ETF tracking leading US technology companies',
    2,
    1000,
    'moderate',
    '["Low fees", "High liquidity"]'::jsonb,
    '["Market risk"]'::jsonb,
    '["doc1.pdf"]'::jsonb
); 