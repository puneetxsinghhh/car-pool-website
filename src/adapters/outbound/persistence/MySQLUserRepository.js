import UserRepository from "../../../application/ports/UserRepository.js";
import mysqlPool from "../../../infrastructure/database/mysqlDb.js";

// Outbound Adapter:
// Implements the UserRepository port using MySQL.
export default class MySQLUserRepository extends UserRepository {

    constructor() {
        super();

        this.pool = mysqlPool;
    }

    async create(user) {

    console.log("🔥 MySQL create() called");

    const [dbInfo] = await this.pool.query(
        "SELECT DATABASE() AS databaseName"
    );

    console.log(
        "📌 Node is connected to:",
        dbInfo[0].databaseName
    );

    const query = `
        INSERT INTO users (clerk_user_id, name, email, role)
        VALUES (?, ?, ?, ?)
    `;

    const values = [
        user.clerkUserId,
        user.name,
        user.email,
        user.role
    ];

    console.log("📦 INSERT values:", values);

    const [result] = await this.pool.execute(query, values);

    const [check] = await this.pool.execute(
    "SELECT * FROM users WHERE id = ?",
    [result.insertId]
    );

    console.log("🔍 INSERTED ROW:", check);

    console.log("✅ INSERT successful. ID:", result.insertId);

    return {
        id: result.insertId,
        clerkUserId: user.clerkUserId,
        name: user.name,
        email: user.email,
        role: user.role
    };
}

    async findById(id) {

        const query = `
            SELECT id, clerk_user_id, name, email, role
            FROM users
            WHERE id = ?
        `;

        const [rows] = await this.pool.execute(query, [id]);

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];

        return {
            id: row.id,
            clerkUserId: row.clerk_user_id,
            name: row.name,
            email: row.email,
            role: row.role
        };
    }

    async findByClerkUserId(clerkUserId) {

        const query = `
            SELECT id, clerk_user_id, name, email, role
            FROM users
            WHERE clerk_user_id = ?
        `;

        const [rows] = await this.pool.execute(query, [clerkUserId]);

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];

        return {
            id: row.id,
            clerkUserId: row.clerk_user_id,
            name: row.name,
            email: row.email,
            role: row.role
        };
    }

    async findByEmail(email) {

        const query = `
            SELECT id, clerk_user_id, name, email, role
            FROM users
            WHERE email = ?
        `;

        const [rows] = await this.pool.execute(query, [email]);

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];

        return {
            id: row.id,
            clerkUserId: row.clerk_user_id,
            name: row.name,
            email: row.email,
            role: row.role
        };
    }

    async linkClerkUserId(userId, clerkUserId) {

        const query = `
            UPDATE users
            SET clerk_user_id = ?
            WHERE id = ?
              AND clerk_user_id IS NULL
        `;

        const [result] = await this.pool.execute(query, [
            clerkUserId,
            userId
        ]);

        if (result.affectedRows === 0) {
            throw new Error("User is already linked to a Clerk account");
        }

        return await this.findByClerkUserId(clerkUserId);
    }

    async findAll() {

        const query = `
            SELECT id, name, email, role
            FROM users
            ORDER BY id
        `;

        const [rows] = await this.pool.execute(query);

        return rows;
    }

    async getDriverSummary(driverId) {

    const query = `
        SELECT
            u.id AS driver_id,
            u.name AS driver_name,

            COUNT(DISTINCT r.id) AS total_rides,

            COUNT(DISTINCT b.passenger_id)
                AS total_passengers,

            COALESCE(
                SUM(r.total_seats),
                0
            ) AS total_seats,

            COALESCE(
                SUM(r.available_seats),
                0
            ) AS available_seats

        FROM users u

        LEFT JOIN rides r
            ON u.id = r.driver_id

        LEFT JOIN bookings b
            ON r.id = b.ride_id

        WHERE u.id = ?
          AND u.role = 'DRIVER'

        GROUP BY
            u.id,
            u.name
    `;

    const [rows] = await this.pool.query(
        query,
        [driverId]
    );

    if (rows.length === 0) {
        return null;
    }

    const row = rows[0];

    return {
        driverId: row.driver_id,
        driverName: row.driver_name,
        totalRides: Number(row.total_rides),
        totalPassengers: Number(row.total_passengers),
        totalSeats: Number(row.total_seats),
        availableSeats: Number(row.available_seats)
    };
    }
    
}
