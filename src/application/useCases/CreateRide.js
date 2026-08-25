import Ride from "../../domain/entities/Ride.js";

export default class CreateRide {
    constructor(rideRepository, userRepository) {
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
    }

    async execute({
        driverId,
        origin,
        destination,
        totalSeats
    }) {

        const driver = await this.userRepository.findById(driverId);

        if (!driver) {
            throw new Error("Driver not found");
        }

        if (driver.role !== "DRIVER") {
            throw new Error("User is not registered as a driver");
        }

        const ride = new Ride({
            driverId,
            origin,
            destination,
            totalSeats,
            availableSeats: totalSeats
        });

        return await this.rideRepository.create(ride);
    }
}