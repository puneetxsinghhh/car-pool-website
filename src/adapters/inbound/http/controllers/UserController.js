export default class UserController {

    constructor(createUser, getUserRides, getDriverSummary) {
        this.createUser = createUser;
        this.getUserRides = getUserRides;
        this.getDriverSummaryUseCase = getDriverSummary;
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

    async getDriverSummary(req, res, next) {

    try {

        const driverId =
            Number(req.params.id);

        const summary =
            await this.getDriverSummaryUseCase.execute(
                driverId
            );

        if (!summary) {

            return res.status(404).json({
                message: "Driver not found"
            });
        }

        res.status(200).json(summary);

    } 
    catch (error) {

        next(error);
     }
    }

}