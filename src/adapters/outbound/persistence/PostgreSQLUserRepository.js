import User from "../../../domain/entities/User.js";
import UserRepository from "../../../application/ports/UserRepository.js";

export default class PostgreSQLUserRepository extends UserRepository {

    constructor(pool) {
        super();
        this.pool = pool;
    }

    async create(user) {

        const query = `
            INSERT INTO users (name, email, role)
            VALUES ($1, $2, $3)
            RETURNING id, name, email, role
        `;

        const values = [
            user.name,
            user.email,
            user.role
        ];

        const result = await this.pool.query(query, values);

        return new User(result.rows[0]);
    }

    async findById(id) {

        const query = `
            SELECT id, name, email, role
            FROM users
            WHERE id = $1
        `;

        const result = await this.pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return new User(result.rows[0]);
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

        WHERE u.id = $1
          AND u.role = 'DRIVER'

        GROUP BY
            u.id,
            u.name;
    `;

    const result = await this.pool.query(
        query,
        [driverId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

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