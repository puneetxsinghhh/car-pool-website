export default class Ride {
  constructor({ id = null, driverId, origin, destination, totalSeats, availableSeats }) {
    this.id = id;
    this.driverId = driverId;
    this.origin = origin;
    this.destination = destination;
    this.totalSeats = totalSeats;
    this.availableSeats = availableSeats;
  }

  join() {
    if (this.availableSeats <= 0) {
      throw new Error("No available seats");
    }
    this.availableSeats--;
  }
}