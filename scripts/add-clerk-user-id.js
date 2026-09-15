import "dotenv/config";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_NAME,
    port: Number(process.env.MYSQL_PORT)
});

try {
    const [columns] = await pool.execute(`
        SELECT COLUMN_NAME
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'users'
          AND column_name = 'clerk_user_id'
    `);

    if (columns.length === 0) {
        await pool.execute(`
            ALTER TABLE users
            ADD COLUMN clerk_user_id VARCHAR(255) NULL UNIQUE AFTER id
        `);
        console.log("Added users.clerk_user_id.");
    } else {
        console.log("users.clerk_user_id already exists.");
    }
} finally {
    await pool.end();
}
