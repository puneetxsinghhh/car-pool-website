export default class JoinRide {

    constructor(
        rideRepository,
        userRepository
    ) {
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
    }

    async execute(rideId, passengerId) {

        // 1. Verify passenger
        const passenger =
            await this.userRepository.findById(passengerId);

        if (!passenger) {
            throw new Error("Passenger not found");
        }

        if (passenger.role !== "PASSENGER") {
            throw new Error(
                "User is not registered as a passenger"
            );
        }

        // 2. Get ride
        const ride =
            await this.rideRepository.findById(rideId);

        if (!ride) {
            throw new Error("Ride not found");
        }

        // 3. Domain business rule
        ride.join();

        // 4. Atomic persistence operation
        return await this.rideRepository.joinRide(
            rideId,
            passengerId
        );
    }
}