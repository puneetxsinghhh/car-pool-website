import RideRepository from "../../../application/ports/RideRepository.js";
import mysqlPool from "../../../infrastructure/database/mysqlDb.js";
import Ride from "../../../domain/entities/Ride.js";

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
                driver_id,
                origin,
                destination,
                total_seats,
                available_seats
            FROM rides
            WHERE available_seats > 0
            ORDER BY id
        `;

        const [rows] = await this.pool.execute(query);

        return rows.map(row => new Ride({
            id: row.id,
            driverId: row.driver_id,
            origin: row.origin,
            destination: row.destination,
            totalSeats: row.total_seats,
            availableSeats: row.available_seats
        }));
    }

    // Find one ride by ID
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
            WHERE id = ?
        `;

        const [rows] = await this.pool.execute(query, [id]);

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];

        return new Ride({
            id: row.id,
            driverId: row.driver_id,
            origin: row.origin,
            destination: row.destination,
            totalSeats: row.total_seats,
            availableSeats: row.available_seats
        });
    }


    // Update an existing ride
    async update(ride) {

        const query = `
            UPDATE rides
            SET
                available_seats = ?
            WHERE id = ?
        `;

        const values = [
            ride.availableSeats,
            ride.id
        ];

        await this.pool.execute(query, values);

        return this.findById(ride.id);
    }


    // find the ride Details by ID
    async findRideDetailsById(id) {

        const query = `
            SELECT
                r.id AS ride_id,
                r.origin,
                r.destination,
                r.total_seats,
                r.available_seats,

                d.id AS driver_id,
                d.name AS driver_name,
                d.email AS driver_email,

                p.id AS passenger_id,
                p.name AS passenger_name,
                p.email AS passenger_email

            FROM rides r

            INNER JOIN users d
                ON r.driver_id = d.id

            LEFT JOIN bookings b
                ON r.id = b.ride_id

            LEFT JOIN users p
                ON b.passenger_id = p.id

            WHERE r.id = ?

            ORDER BY p.id
        `;

        const [rows] = await this.pool.query(
            query,
            [id]
        );

        if (rows.length === 0) {
            return null;
        }

        const firstRow = rows[0];

        return {
            id: firstRow.ride_id,

            origin: firstRow.origin,
            destination: firstRow.destination,

            totalSeats: firstRow.total_seats,
            availableSeats: firstRow.available_seats,

            driver: {
                id: firstRow.driver_id,
                name: firstRow.driver_name,
                email: firstRow.driver_email
            },

            passengers: rows
                .filter(row => row.passenger_id !== null)
                .map(row => ({
                    id: row.passenger_id,
                    name: row.passenger_name,
                    email: row.passenger_email
                }))
        };
    }


    async joinRide(rideId, passengerId) {

    // Get a dedicated connection from the pool
    const connection =
        await this.pool.getConnection();

    try {

        // -----------------------------------------
        // 1. Start transaction
        // -----------------------------------------
        await connection.beginTransaction();

        
        // -----------------------------------------
        // 2. Check ride and available seats
        // -----------------------------------------

        const rideQuery = `
            SELECT
                id,
                available_seats
            FROM rides
            WHERE id = ?
            FOR UPDATE
        `;

        const [rideRows] =
            await connection.execute(
                rideQuery,
                [rideId]
            );

        if (rideRows.length === 0) {
            throw new Error("Ride not found");
        }

        const ride = rideRows[0];

        if (ride.available_seats <= 0) {
            throw new Error("No available seats");
        }


        // -----------------------------------------
        // 3. Check duplicate booking
        // -----------------------------------------

        const bookingCheckQuery = `
            SELECT id
            FROM bookings
            WHERE ride_id = ?
              AND passenger_id = ?
        `;

        const [bookingRows] =
            await connection.execute(
                bookingCheckQuery,
                [rideId, passengerId]
            );

        if (bookingRows.length > 0) {
            throw new Error(
                "Passenger already joined this ride"
            );
        }

        // -----------------------------------------
        // 4. Create booking
        // -----------------------------------------

        const createBookingQuery = `
            INSERT INTO bookings (
                ride_id,
                passenger_id
            )
            VALUES (?, ?)
        `;

        const [bookingResult] =
            await connection.execute(
                createBookingQuery,
                [rideId, passengerId]
            );


        // -----------------------------------------
        // 5. Decrease available seats
        // -----------------------------------------

        const updateRideQuery = `
            UPDATE rides
            SET available_seats = available_seats - 1
            WHERE id = ?
        `;

        await connection.execute(
            updateRideQuery,
            [rideId]
        );


        // -----------------------------------------
        // 6. Commit transaction
        // -----------------------------------------

        await connection.commit();


        // Return booking information
        return {
            id: bookingResult.insertId,
            rideId: rideId,
            passengerId: passengerId
        };


    } catch (error) {

        // -----------------------------------------
        // Rollback if anything fails
        // -----------------------------------------

        await connection.rollback();

        throw error;


    } finally {

        // Return connection to the pool
        connection.release();
    }
}


}