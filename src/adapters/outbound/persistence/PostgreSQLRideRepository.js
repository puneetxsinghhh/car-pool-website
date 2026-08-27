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

                    WHERE r.id = $1

                    ORDER BY p.id;
                    `;

                const result = await this.pool.query(query, [id]);

                return result.rows;
    }


    // transactional ride confirmation 
    async joinRide(rideId, passengerId) {

    const client = await this.pool.connect();

    try {

        // Start transaction
        await client.query("BEGIN");

        // -----------------------------------------
        // 1. Check ride and available seats
        // -----------------------------------------

        const rideQuery = `
            SELECT
                id,
                available_seats
            FROM rides
            WHERE id = $1
            FOR UPDATE
        `;

        const rideResult = await client.query(
            rideQuery,
            [rideId]
        );

        if (rideResult.rows.length === 0) {
            throw new Error("Ride not found");
        }

        const ride = rideResult.rows[0];

        if (ride.available_seats <= 0) {
            throw new Error("No available seats");
        }


        // -----------------------------------------
        // 2. Check duplicate booking
        // -----------------------------------------

        const bookingCheckQuery = `
            SELECT id
            FROM bookings
            WHERE ride_id = $1
              AND passenger_id = $2
        `;

        const bookingResult = await client.query(
            bookingCheckQuery,
            [rideId, passengerId]
        );

        if (bookingResult.rows.length > 0) {
            throw new Error(
                "Passenger already joined this ride"
            );
        }


        // -----------------------------------------
        // 3. Create booking
        // -----------------------------------------

        const createBookingQuery = `
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

        const newBooking =
            await client.query(
                createBookingQuery,
                [rideId, passengerId]
            );

        // -----------------------------------------
        // 4. Decrease available seats
        // -----------------------------------------

        const updateRideQuery = `
            UPDATE rides
            SET available_seats = available_seats - 1
            WHERE id = $1
        `;

        await client.query(
            updateRideQuery,
            [rideId]
        );


        // -----------------------------------------
        // 5. Commit transaction
        // -----------------------------------------

        await client.query("COMMIT");

        return newBooking.rows[0];

    } catch (error) {

        // -----------------------------------------
        // Rollback if anything fails
        // -----------------------------------------

        await client.query("ROLLBACK");

        throw error;

    } finally {

        // Release database connection
        client.release();
    }
}

}