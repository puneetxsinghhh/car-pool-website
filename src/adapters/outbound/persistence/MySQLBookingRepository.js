import Booking from "../../../domain/entities/Booking.js";
import BookingRepository from "../../../application/ports/BookingRepository.js";
import mysqlPool from "../../../infrastructure/database/mysqlDb.js";

// Outbound Adapter:
// Implements the BookingRepository port using MySQL.
export default class MySQLBookingRepository extends BookingRepository {

    constructor() {
        super();

        this.pool = mysqlPool;
    }

    // Creates a new booking in MySQL.
    async create(booking) {

        const query = `
            INSERT INTO bookings (
                ride_id,
                passenger_id
            )
            VALUES (?, ?)
        `;

        const values = [
            booking.rideId,
            booking.passengerId
        ];

        const [result] = await this.pool.execute(
            query,
            values
        );

        return new Booking({
            id: result.insertId,
            rideId: booking.rideId,
            passengerId: booking.passengerId
        });
    }

    // Checks whether a passenger has already joined a ride.
    async findByRideAndPassenger(rideId, passengerId) {

        const query = `
            SELECT
                id,
                ride_id,
                passenger_id
            FROM bookings
            WHERE ride_id = ?
              AND passenger_id = ?
        `;

        const [rows] = await this.pool.execute(
            query,
            [rideId, passengerId]
        );

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];

        return new Booking({
            id: row.id,
            rideId: row.ride_id,
            passengerId: row.passenger_id
        });
    }

    // Gets all bookings made by a passenger.
    async findByUserId(userId) {

        const query = `
            SELECT
                b.id,
                b.ride_id,
                b.passenger_id
            FROM bookings b
            WHERE b.passenger_id = ?
            ORDER BY b.id
        `;

        const [rows] = await this.pool.execute(
            query,
            [userId]
        );

        return rows.map(row => new Booking({
            id: row.id,
            rideId: row.ride_id,
            passengerId: row.passenger_id
        }));
    }
}