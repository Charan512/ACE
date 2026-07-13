import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

/**
 * Event Auto-Deactivation Queue
 *
 * Schedules a delayed job for each event that fires at eventDate.
 * When triggered, the worker sets isActive: false, hiding the event
 * from the public guest portal automatically.
 *
 * Job name: 'autoDeactivateEvent'
 * Job data: { eventId: string }
 *
 * NEVER use setTimeout/setInterval — BullMQ delayed jobs only.
 */
const eventDeactivateQueue = new Queue('ace-event-deactivate', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail:     { count: 100 },
  },
});

export default eventDeactivateQueue;
