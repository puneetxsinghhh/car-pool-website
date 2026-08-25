import UserRepository from "../../../application/ports/UserRepository.js";
import mysqlPool from "../../../infrastructure/database/mysqlDb.js";

// Outbound Adapter:
// Implements the UserRepository port using MySQL.
export default class MySQLUserRepository extends UserRepository {

    constructor() {
        super();

        this.pool = mysqlPool;
    }

    async create(user) {

        const query = `
            INSERT INTO users (name, email, role)
            VALUES (?, ?, ?)
        `;

        const values = [
            user.name,
            user.email,
            user.role
        ];

        const [result] = await this.pool.execute(query, values);

        return {
            id: result.insertId,
            name: user.name,
            email: user.email,
            role: user.role
        };
    }

    async findById(id) {

        const query = `
            SELECT id, name, email, role
            FROM users
            WHERE id = ?
        `;

        const [rows] = await this.pool.execute(query, [id]);

        return rows[0] || null;
    }

    async findAll() {

        const query = `
            SELECT id, name, email, role
            FROM users
            ORDER BY id
        `;

        const [rows] = await this.pool.execute(query);

        return rows;
    }
}