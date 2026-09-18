export default class OutboxProcessor {

    constructor(outboxRepository) {
        this.outboxRepository = outboxRepository;
    }

    async processPendingEvents() {

        const events =
            await this.outboxRepository.getPendingEvents();

        for (const event of events) {

            try {
                console.log(
                    `Processing event ${event.id}: ${event.event_type}`
                );

                const payload =
                    typeof event.payload === "string"? 
                    JSON.parse(event.payload)
                    : event.payload;

                console.log("Event payload:", payload);

                // // Temporary failure simulation 
                // if (event.id === 90) {
                //   throw new Error("simulated processing failure");
                // }

                await this.outboxRepository.markAsProcessed(
                    event.id
                );

                console.log(
                    `Event ${event.id} processed successfully`
                );

            } catch (error) {
                console.error(
                    `Failed to process event ${event.id}:`,
                    error.message
                );
            }
        }
    }
}