import RideRepository from "../../../application/ports/RideRepository.js";
import mysqlPool from "../../../infrastructure/database/mysqlDb.js";

// Outbound Adapter:
// Implements the RideRepository port using MySQL.
export default class MySQLRideRepository extends RideRepository {

    constructor() {
        super();

        this.pool = mysqlPool;
    }

    // Create a new ride in MySQL
    async create(ride) {

        const query = `
            INSERT INTO rides (
                driver_id,
                origin,
                destination,
                total_seats,
                available_seats
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        const values = [
            ride.driverId,
            ride.origin,
            ride.destination,
            ride.totalSeats,
            ride.availableSeats
        ];

        const [result] = await this.pool.execute(query, values);

        return {
            id: result.insertId,
            driverId: ride.driverId,
            origin: ride.origin,
            destination: ride.destination,
            totalSeats: ride.totalSeats,
            availableSeats: ride.availableSeats
        };
    }

    // Get all rides from MySQL
    async findAll() {

        const query = `
            SELECT
                id,
                driver_id AS driverId,
                origin,
                destination,
                total_seats AS totalSeats,
                available_seats AS availableSeats
            FROM rides
            ORDER BY id
        `;

        const [rows] = await this.pool.execute(query);

        return rows;
    }

    // Find one ride by ID
    async findById(id) {

        const query = `
            SELECT
                id,
                driver_id AS driverId,
                origin,
                destination,
                total_seats AS totalSeats,
                available_seats AS availableSeats
            FROM rides
            WHERE id = ?
        `;

        const [rows] = await this.pool.execute(query, [id]);

        return rows[0] || null;
    }

    // Update an existing ride
    async update(ride) {

        const query = `
            UPDATE rides
            SET
                driver_id = ?,
                origin = ?,
                destination = ?,
                total_seats = ?,
                available_seats = ?
            WHERE id = ?
        `;

        const values = [
            ride.driverId,
            ride.origin,
            ride.destination,
            ride.totalSeats,
            ride.availableSeats,
            ride.id
        ];

        await this.pool.execute(query, values);

        return this.findById(ride.id);
    }
}