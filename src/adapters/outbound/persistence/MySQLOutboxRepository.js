import pool from "../../../infrastructure/database/mysqlDb.js";

export default class MySQLOutboxRepository {

    async save(connection, event) {

        const query = `
            INSERT INTO outbox_events
                (event_type, payload)
            VALUES (?, ?)
        `;

        const values = [
            event.eventType,
            JSON.stringify(event.payload)
        ];

        const [result] =
            await connection.execute(query, values);

        return {
            id: result.insertId,
            eventType: event.eventType,
            payload: event.payload,
            status: "PENDING"
        };
    }

    async getPendingEvents() {

        const query = `
            SELECT *
            FROM outbox_events
            WHERE status = 'PENDING'
            ORDER BY id ASC
        `;

        const [rows] = await pool.execute(query);

        return rows;
    }

    async markAsProcessed(eventId) {

        const query = `
            UPDATE outbox_events
            SET
                status = 'PROCESSED',
                processed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await pool.execute(query, [eventId]);
    }
}