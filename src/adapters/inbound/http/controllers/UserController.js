export default class UserController {

    constructor(createUser, getUserRides) {
        this.createUser = createUser;
        this.getUserRides = getUserRides;
    }

    async create(req, res, next) {
        try {
            const user = await this.createUser.execute(req.body);

            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    }

    async getRides(req, res, next) {
        try {
            const rides = await this.getUserRides.execute(
                Number(req.params.id)
            );

            res.status(200).json(rides);
        } catch (error) {
            next(error);
        }
    }
}