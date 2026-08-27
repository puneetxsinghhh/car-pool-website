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

        const query = `
            INSERT INTO users (name, email, role)
            VALUES (?, ?, ?)
        `;

        const values = [
            user.name,
            user.email,
            user.role
        ];

        const [result] = await this.pool.execute(query, values);

        return {
            id: result.insertId,
            name: user.name,
            email: user.email,
            role: user.role
        };
    }

    async findById(id) {

        const query = `
            SELECT id, name, email, role
            FROM users
            WHERE id = ?
        `;

        const [rows] = await this.pool.execute(query, [id]);

        return rows[0] || null;
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