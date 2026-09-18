export default class OutboxRepository {

  async save(event) {
    throw new Error ("save() must be implemented in the subclass");
  }

  async getPendingEvents() {
    throw new Error ("getPendingEvents() must be implemented in the subclass");
  }

  async markEventAsProcessed(eventId) {
    throw new Error ("markEventAsProcessed() must be implemented in the subclass");
  }
}