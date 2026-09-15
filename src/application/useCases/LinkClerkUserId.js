export default class LinkClerkUserId {

    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(userId, clerkUserId) {
        return await this.userRepository.linkClerkUserId(
            userId,
            clerkUserId
        );
    }
}
