import Booking from "../../domain/entities/Booking.js";

export default class JoinRide {
    constructor(
        rideRepository,
        userRepository,
        bookingRepository
    ) {
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    async execute({ rideId, passengerId }) {

        // 1. Check passenger exists
        const passenger = await this.userRepository.findById(passengerId);

        if (!passenger) {
            throw new Error("Passenger not found");
        }

        // 2. Check user is a passenger
        if (passenger.role !== "PASSENGER") {
            throw new Error("User is not registered as a passenger");
        }

        // 3. Find the ride
        const ride = await this.rideRepository.findById(rideId);

        if (!ride) {
            throw new Error("Ride not found");
        }

        // 4. Check duplicate booking
        const existingBooking =
            await this.bookingRepository.findByRideAndPassenger(
                rideId,
                passengerId
            );

        if (existingBooking) {
            throw new Error("Passenger already joined this ride");
        }

        // 5. Let the domain enforce the seat rule
        ride.join();

        // 6. Create booking
        const booking = new Booking({
            rideId,
            passengerId
        });

        // 7. Save updated ride
        await this.rideRepository.update(ride);

        // 8. Save booking
        return await this.bookingRepository.create(booking);
    }
}