export default class RideController {

    constructor(
        createRide,
        getRides,
        getRideById,
        joinRide, 
        getRideDetails
    ) {
        this.createRide = createRide;
        this.getRides = getRides;
        this.getRideById = getRideById;
        this.joinRide = joinRide;
        this.getRideDetailsUseCase = getRideDetails;
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
            debugger;
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

    async getRideDetails(req, res, next) {
        try {
            const rideId = Number(req.params.id);

            const result = await this.getRideDetailsUseCase.execute(rideId);

            res.status(200).json(result);
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