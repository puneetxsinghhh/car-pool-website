import mysql from "mysql2/promise"; // because our application already uses: async, await

import dotenv from "dotenv";

dotenv.config();

// MySQL connection pool.
// This belongs to Infrastructure because it knows
// how to connect to the MySQL database.
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_NAME,
    port: process.env.MYSQL_PORT
});

export default pool;
