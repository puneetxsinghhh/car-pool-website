export default class GetUserByClerkUserId {

    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(clerkUserId) {
        return await this.userRepository.findByClerkUserId(clerkUserId);
    }
}
