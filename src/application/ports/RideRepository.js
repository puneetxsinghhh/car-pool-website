export default class RideRepository {

    async create(ride) {
        throw new Error("create() must be implemented");
    }

    async findAll() {
        throw new Error("findAll() must be implemented");
    }

    async findById(id) {
        throw new Error("findById() must be implemented");
    }

    async update(ride) {
        throw new Error("update() must be implemented");
    }

    async findRideDetailsById(id) {
    throw new Error(
        "findRideDetailsById() must be implemented");
    }

    // Port for the complete ride-booking operation
    async joinRide(rideId, passengerId) {
        throw new Error("joinRide() must be implemented");
    }
    
}