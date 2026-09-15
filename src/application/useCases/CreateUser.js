import User from "../../domain/entities/User.js";

export default class CreateUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute({ name, email, role, clerkUserId = null }) {

        const user = new User({
            name,
            email,
            role,
            clerkUserId
        });

        return await this.userRepository.create(user);
    }
}
