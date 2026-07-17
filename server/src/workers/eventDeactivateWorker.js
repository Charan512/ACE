import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import Event from '../models/Event.js';

/**
 * Auto-Deactivation Worker
 *
 * Processes 'autoDeactivateEvent' jobs from the 'ace-event-deactivate' queue.
 * Sets isActive: false on the target event, removing it from the public
 * guest portal and member feed automatically once the event date passes.
 */
const eventDeactivateWorker = new Worker(
  'ace-event-deactivate',
  async (job) => {
    const { eventId } = job.data;

    const event = await Event.findById(eventId);

    if (!event) {
      console.log(`[AutoDeactivate] Event ${eventId} not found — may have been deleted. Skipping.`);
      return;
    }

    if (!event.isActive) {
      console.log(`[AutoDeactivate] Event "${event.title}" already inactive. Skipping.`);
      return;
    }

    await Event.findByIdAndUpdate(eventId, { $set: { isActive: false } });

    console.log(
      `[AutoDeactivate] SUCCESS: Event "${event.title}" (${eventId}) has been automatically deactivated ` +
      `— eventDate ${event.eventDate.toISOString()} has passed.`
    );
  },
  {
    connection: createRedisConnection(),
    concurrency: 5,
    settings: {
      stalledInterval: 300000,
      maxStalledCount: 1,
    }
  }
);

eventDeactivateWorker.on('failed', (job, err) => {
  console.error(`[AutoDeactivate] ERROR: Job ${job?.id} failed for event ${job?.data?.eventId}:`, err.message);
});

export default eventDeactivateWorker;
