import User from "../../domain/entities/User.js";

export default class CreateUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute({ name, email, role }) {

        const user = new User({
            name,
            email,
            role
        });

        return await this.userRepository.create(user);
    }
}