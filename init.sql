-- Initialize IQX Stocks Database
-- This script will be run when the PostgreSQL container starts for the first time

-- Create database (already created by POSTGRES_DB environment variable)
-- CREATE DATABASE iqx_stocks;

-- Connect to the database
\c iqx_stocks;

-- Create Vietnamese text search configuration (optional, for better Vietnamese search)
-- CREATE TEXT SEARCH CONFIGURATION vietnamese (COPY = simple);

-- Grant privileges to the user (already done by Docker)
-- GRANT ALL PRIVILEGES ON DATABASE iqx_stocks TO iqx_user;

-- Create extension for better text search (optional)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE EXTENSION IF NOT EXISTS unaccent;

-- The tables will be created automatically by the application
-- when it starts up through the initializeDatabase function

-- Insert some initial data if needed
-- This is just a placeholder - the actual data will be populated
-- by the sync-data script

-- Create indexes for better performance (these will also be created by the app)
-- But we can add some additional ones here if needed

-- Log the initialization
SELECT 'IQX Stocks Database initialized successfully' AS status;
