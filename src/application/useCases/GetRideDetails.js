export default class GetRideDetails {
  constructor(rideRepository) {
    this.rideRepository = rideRepository;
  }

  async execute(rideId) {
    return await this.rideRepository.findRideDetailsById(rideId);
  }
 }