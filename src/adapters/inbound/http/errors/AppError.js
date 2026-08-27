export default class AppError extends Error {

    constructor(message, statusCode) {

        super(message);

        this.statusCode = statusCode;

        // Keeps the correct error name.
        this.name = "AppError";
    }
}