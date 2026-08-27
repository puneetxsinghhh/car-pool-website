export default class GetDriverSummary {

    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(driverId) {

        return await this.userRepository
            .getDriverSummary(driverId);
    }
}