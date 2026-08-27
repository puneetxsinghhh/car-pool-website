export default class UserRepository {

    async create(user) {
        throw new Error("create() must be implemented");
    }

    async findById(id) {
        throw new Error("findById() must be implemented");
    }

    async getDriverSummary(driverId) {
    throw new Error(
        "getDriverSummary() must be implemented"
    );
}
}