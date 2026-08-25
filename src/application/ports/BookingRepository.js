export default class BookingRepository {

    async create(booking) {
        throw new Error("create() must be implemented");
    }

    async findByRideAndPassenger(rideId, passengerId) {
        throw new Error("findByRideAndPassenger() must be implemented");
    }

    async findByUserId(userId) {
        throw new Error("findByUserId() must be implemented");
    }
}