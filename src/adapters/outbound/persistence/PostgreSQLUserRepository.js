import User from "../../../domain/entities/User.js";
import UserRepository from "../../../application/ports/UserRepository.js";

export default class PostgreSQLUserRepository extends UserRepository {

    constructor(pool) {
        super();
        this.pool = pool;
    }

    async create(user) {

        const query = `
            INSERT INTO users (name, email, role)
            VALUES ($1, $2, $3)
            RETURNING id, name, email, role
        `;

        const values = [
            user.name,
            user.email,
            user.role
        ];

        const result = await this.pool.query(query, values);

        return new User(result.rows[0]);
    }

    async findById(id) {

        const query = `
            SELECT id, name, email, role
            FROM users
            WHERE id = $1
        `;

        const result = await this.pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return new User(result.rows[0]);
    }
}