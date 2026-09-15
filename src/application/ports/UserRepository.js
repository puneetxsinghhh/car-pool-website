export default class UserRepository {

    async create(user) {
        throw new Error("create() must be implemented");
    }

    async findById(id) {
        throw new Error("findById() must be implemented");
    }

    async findByClerkUserId(clerkUserId) {
        throw new Error("findByClerkUserId() must be implemented");
    }

    async findByEmail(email) {
        throw new Error("findByEmail() must be implemented");
    }

    async linkClerkUserId(userId, clerkUserId) {
        throw new Error("linkClerkUserId() must be implemented");
    }

    async getDriverSummary(driverId) {
    throw new Error(
        "getDriverSummary() must be implemented"
    );
}
}
