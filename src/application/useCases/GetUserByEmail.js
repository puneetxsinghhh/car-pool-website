export default class GetUserByEmail {

    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(email) {
        return await this.userRepository.findByEmail(email);
    }
}
