const { Pool } = require("pg");
require("dotenv").config()
const pool = new Pool({
    connectionString: process.env.DATABASE_URL ,// || "postgresql://lyfe_m2gt_user:NSD97BvHI6KXMazAlUo4IiwLbUxv06Br@dpg-cv1uncpu0jms738ocsg0-a.oregon-postgres.render.com/lyfe_m2gt",
    ssl: { rejectUnauthorized: false },
});

async function createUsersTable() {
    try {
        const checkTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        `;
        const result = await pool.query(checkTableQuery);

        if (result.rows[0].exists) {
            console.log("Users table already exists.");

            // Add missing columns
            const alterQuery = `
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS dob DATE,
                ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
                ADD COLUMN IF NOT EXISTS country VARCHAR(100),
                ADD COLUMN IF NOT EXISTS state VARCHAR(100),
                ADD COLUMN IF NOT EXISTS address TEXT,
                ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
            `;
            await pool.query(alterQuery);
            console.log("Users table updated with additional fields.");
        } else {
            // Create table with all columns
            const createTableQuery = `
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    fullName VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    dob DATE,
                    gender VARCHAR(10),
                    country VARCHAR(100),
                    state VARCHAR(100),
                    address TEXT,
                    phone_number VARCHAR(20),
                    verification_token TEXT,
                    is_verified BOOLEAN DEFAULT false,
                    verification_token_created_at TIMESTAMP DEFAULT NOW(),
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `;
            await pool.query(createTableQuery);
            console.log("Users table created successfully.");
        }
    } catch (err) {
        console.error("Error creating or modifying table:", err);
    }
}

createUsersTable();

module.exports = pool;