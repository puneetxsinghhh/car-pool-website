export default class CreateOutboxEvent {
  constructor(outboxRepository) {
    this.outboxRepository = outboxRepository;
  }

  async execute ({ eventType, payload}) {
     return await this.outboxRepository.save({
      eventType, 
      payload
     });
  }
}