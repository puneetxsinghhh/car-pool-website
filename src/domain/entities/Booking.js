export default class Booking {
    constructor({
        id = null,
        rideId,
        passengerId
    }) {
        this.id = id;
        this.rideId = rideId;
        this.passengerId = passengerId;
    }
}