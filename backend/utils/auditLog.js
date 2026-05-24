const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const logAction = async (userId, action, ipAddress, details = '') => {
    try {
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES ($1, $2, $3, $4)',
            [userId, action, ipAddress, details]
        );
    } catch (err) {
        console.error('Audit log error:', err.message);
    }
};

module.exports = { logAction };
