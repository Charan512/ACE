import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import User from '../models/User.js';
import academicRolloverQueue from '../queues/academicRolloverQueue.js';

/**
 * Academic Rollover Worker — Runs every April 1st via a repeatable BullMQ cron job.
 *
 * Task A — Year Increment:
 *   Increments the `year` field for all members who are not yet in their final year.
 *   Members already at year 4 are not incremented (they graduate and get deleted below).
 *
 * Task B — Graduation-Based Deletion:
 *   Parses the 2-digit admission year prefix from each member's aceId.
 *   Computes the graduation year based on studentType:
 *     - 'regular' (4-year): Deletion Year = Admission Year + 4
 *     - 'lateral'  (3-year): Deletion Year = Admission Year + 3
 *   Any member whose Deletion Year <= Current Academic Year is permanently deleted.
 *
 *   Example (running April 1, 2027, academic year = 2026):
 *     - 22ACE regular: 2022 + 4 = 2026 → DELETE ✓
 *     - 23ACE lateral: 2023 + 3 = 2026 → DELETE ✓
 *     - 23ACE regular: 2023 + 4 = 2027 → KEEP  (graduates next year)
 *     - 24ACE lateral: 2024 + 3 = 2027 → KEEP
 *
 * Note: This worker only targets role: 'member'. SBMs, EBMs, and admins are never deleted.
 */
const academicRolloverWorker = new Worker(
  'ace-academic-rollover',
  async (job) => {
    console.log(`[AcademicRollover] Starting rollover job (id: ${job.id})...`);

    // Determine current academic year
    // Academic year starts April 1 — if running April 1 of year Y, the academic year that just
    // completed is Y-1 (e.g., April 1 2027 → academic year 2026 just ended)
    const now          = new Date();
    const calendarYear = now.getFullYear();
    // The academic year that JUST ENDED is one less than the current calendar year
    // because we run this job at the start of April (new academic year begins)
    const completedAcademicYear = calendarYear - 1;

    console.log(`[AcademicRollover] Calendar year: ${calendarYear}, Completed academic year: ${completedAcademicYear}`);

    // ── Task A: Increment year for all members still in progress ─────────────
    const yearIncrementResult = await User.updateMany(
      {
        role: 'member',
        year: { $gte: 1, $lt: 4 }, // Only promote years 1, 2, 3 → not 4 (they graduate)
      },
      { $inc: { year: 1 } }
    );
    console.log(`[AcademicRollover] ✓ Year increment: ${yearIncrementResult.modifiedCount} members promoted.`);

    // ── Task B: Identify and permanently delete graduating members ────────────
    // Fetch all members — we need to inspect each aceId prefix individually.
    // This is intentionally done in JS (not a MongoDB query) because we need
    // arithmetic on the parsed prefix, which is not native to MQL.
    const allMembers = await User.find({ role: 'member' })
      .select('_id aceId studentType name email')
      .lean();

    const toDelete = [];

    for (const member of allMembers) {
      if (!member.aceId) continue; // Guard: no aceId = legacy/incomplete account

      // Parse the 2-digit prefix, e.g., "26ACE0001" → "26" → 2026
      const prefixMatch = member.aceId.match(/^(\d{2})ACE/);
      if (!prefixMatch) continue;

      const admissionYearShort = parseInt(prefixMatch[1], 10); // e.g., 26
      // Convert to full year: 26 → 2026
      // Assumption: all years 00-99 map to 2000-2099 (safe until 2100)
      const admissionYear = 2000 + admissionYearShort;

      // Duration depends on program type
      const programDuration = member.studentType === 'lateral' ? 3 : 4;
      const graduationYear  = admissionYear + programDuration;

      // Delete if they have graduated as of the academic year that just completed
      // e.g., admissionYear=2022, duration=4 → graduation=2026 → delete when completedAcademicYear >= 2026
      if (graduationYear <= completedAcademicYear) {
        toDelete.push(member._id);
        console.log(
          `[AcademicRollover] 🎓 Graduating: ${member.aceId} (${member.email}) ` +
          `| Type: ${member.studentType} | Admitted: ${admissionYear} | Graduates: ${graduationYear}`
        );
      }
    }

    if (toDelete.length === 0) {
      console.log('[AcademicRollover] ✓ No graduating members found for deletion this cycle.');
      return;
    }

    const deleteResult = await User.deleteMany({ _id: { $in: toDelete } });
    console.log(
      `[AcademicRollover] ✓ Permanently deleted ${deleteResult.deletedCount} graduated member(s).`
    );
  },
  {
    connection:  createRedisConnection(),
    concurrency: 1, // Single-process — this is a destructive operation, no concurrency
    settings: {
      stalledInterval: 600000, // 10 minutes — large job, give it time
      maxStalledCount: 1,
    },
  }
);

// ── Register the April 1st repeatable cron schedule ──────────────────────────
// '0 0 1 4 *' = At 00:00 on April 1st every year
// Uses BullMQ's built-in cron so it survives server restarts — stored in Redis.
(async () => {
  try {
    await academicRolloverQueue.add(
      'academicRollover',
      {}, // No job-specific data — all logic derived inside the worker
      {
        repeat: {
          pattern: '0 0 1 4 *', // Every April 1st at midnight
          tz:      'Asia/Kolkata',
        },
        jobId: 'ace-academic-rollover-annual', // Idempotent: prevents duplicate schedules on restart
      }
    );
    console.log('[AcademicRollover] ✓ Annual April 1st cron job registered.');
  } catch (err) {
    console.error('[AcademicRollover] Failed to register cron job:', err.message);
  }
})();

// ── Event listeners ──────────────────────────────────────────────────────────
academicRolloverWorker.on('completed', (job) => {
  console.log(`[AcademicRollover] ✓ Job completed (id: ${job.id}).`);
});

academicRolloverWorker.on('failed', (job, err) => {
  console.error(`[AcademicRollover] ✗ Job failed (id: ${job?.id}): ${err.message}`);
});

export default academicRolloverWorker;
