export default class GetRides {
    constructor(rideRepository) {
        this.rideRepository = rideRepository;
    }

    async execute() {
        return await this.rideRepository.findAll();
    }
}