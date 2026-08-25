export default class RideController {

    constructor(
        createRide,
        getRides,
        getRideById,
        joinRide
    ) {
        this.createRide = createRide;
        this.getRides = getRides;
        this.getRideById = getRideById;
        this.joinRide = joinRide;
    }

    async create(req, res, next) {
        try {
            const ride = await this.createRide.execute(req.body);

            res.status(201).json(ride);
        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const rides = await this.getRides.execute();

            res.status(200).json(rides);
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const ride = await this.getRideById.execute(
                Number(req.params.id)
            );

            res.status(200).json(ride);
        } catch (error) {
            next(error);
        }
    }

    async join(req, res, next) {
        try {
            const booking = await this.joinRide.execute({
                rideId: Number(req.params.id),
                passengerId: req.body.passengerId
            });

            res.status(201).json(booking);
        } catch (error) {
            next(error);
        }
    }
}