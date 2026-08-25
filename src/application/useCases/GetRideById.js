export default class GetRideById {
    constructor(rideRepository) {
        this.rideRepository = rideRepository;
    }

    async execute(id) {

        const ride = await this.rideRepository.findById(id);

        if (!ride) {
            throw new Error("Ride not found");
        }

        return ride;
    }
}