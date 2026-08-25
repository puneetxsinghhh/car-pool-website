import Booking from "../../../domain/entities/Booking.js";
import BookingRepository from "../../../application/ports/BookingRepository.js";

export default class PostgreSQLBookingRepository extends BookingRepository  {

    constructor(pool) {
        super();
        this.pool = pool;
    }

    async create(booking) {

        const query = `
            INSERT INTO bookings (
                ride_id,
                passenger_id
            )
            VALUES ($1, $2)
            RETURNING
                id,
                ride_id,
                passenger_id
        `;

        const values = [
            booking.rideId,
            booking.passengerId
        ];

        const result = await this.pool.query(query, values);

        return new Booking({
            id: result.rows[0].id,
            rideId: result.rows[0].ride_id,
            passengerId: result.rows[0].passenger_id
        });
    }

    async findByRideAndPassenger(rideId, passengerId) {

        const query = `
            SELECT
                id,
                ride_id,
                passenger_id
            FROM bookings
            WHERE ride_id = $1
              AND passenger_id = $2
        `;

        const result = await this.pool.query(
            query,
            [rideId, passengerId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];

        return new Booking({
            id: row.id,
            rideId: row.ride_id,
            passengerId: row.passenger_id
        });
    }

    async findByUserId(userId) {

        const query = `
            SELECT
                b.id,
                b.ride_id,
                b.passenger_id
            FROM bookings b
            WHERE b.passenger_id = $1
            ORDER BY b.id
        `;

        const result = await this.pool.query(query, [userId]);

        return result.rows.map(row => new Booking({
            id: row.id,
            rideId: row.ride_id,
            passengerId: row.passenger_id
        }));
    }
}
