import RideRepository from "../../../application/ports/RideRepository.js";
import Ride from "../../../domain/entities/Ride.js";

export default class PostgreSQLRideRepository extends RideRepository {

    constructor(pool) {
        super();
        this.pool = pool;
    }

    async create(ride) {

        const query = `
            INSERT INTO rides (
                driver_id,
                origin,
                destination,
                total_seats,
                available_seats
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                driver_id,
                origin,
                destination,
                total_seats,
                available_seats
        `;

        const values = [
            ride.driverId,
            ride.origin,
            ride.destination,
            ride.totalSeats,
            ride.availableSeats
        ];

        const result = await this.pool.query(query, values);

        return new Ride({
            id: result.rows[0].id,
            driverId: result.rows[0].driver_id,
            origin: result.rows[0].origin,
            destination: result.rows[0].destination,
            totalSeats: result.rows[0].total_seats,
            availableSeats: result.rows[0].available_seats
        });
    }

    async findAll() {

        const query = `
            SELECT
                id,
                driver_id,
                origin,
                destination,
                total_seats,
                available_seats
            FROM rides
            WHERE available_seats > 0
            ORDER BY id
        `;

        const result = await this.pool.query(query);

        return result.rows.map(row => new Ride({
            id: row.id,
            driverId: row.driver_id,
            origin: row.origin,
            destination: row.destination,
            totalSeats: row.total_seats,
            availableSeats: row.available_seats
        }));
    }

    async findById(id) {

        const query = `
            SELECT
                id,
                driver_id,
                origin,
                destination,
                total_seats,
                available_seats
            FROM rides
            WHERE id = $1
        `;

        const result = await this.pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];

        return new Ride({
            id: row.id,
            driverId: row.driver_id,
            origin: row.origin,
            destination: row.destination,
            totalSeats: row.total_seats,
            availableSeats: row.available_seats
        });
    }

    async update(ride) {

        const query = `
            UPDATE rides
            SET available_seats = $1
            WHERE id = $2
            RETURNING
                id,
                driver_id,
                origin,
                destination,
                total_seats,
                available_seats
        `;

        const values = [
            ride.availableSeats,
            ride.id
        ];

        const result = await this.pool.query(query, values);

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];

        return new Ride({
            id: row.id,
            driverId: row.driver_id,
            origin: row.origin,
            destination: row.destination,
            totalSeats: row.total_seats,
            availableSeats: row.available_seats
        });
    }
}