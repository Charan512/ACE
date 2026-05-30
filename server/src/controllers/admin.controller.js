import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { emailQueue, treasurerQueue } from '../queues/index.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * @desc    Get dashboard metrics (Total Members, Total Revenue, Active Queue Jobs)
 * @route   GET /api/admin/stats
 * @access  Private (Admin Only)
 */
export const getDashboardStats = catchAsync(async (req, res, next) => {
  // 1. Total Members: count of users with role 'member'
  const totalMembers = await User.countDocuments({ role: 'member' });

  // 2. Total Revenue: sum of all paid transactions (amount is stored in paise, so divide by 100)
  const revenueAggregation = await Transaction.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalRevenuePaise = revenueAggregation[0]?.total || 0;
  const totalRevenue = totalRevenuePaise / 100;

  // 3. Active Jobs: count waiting/active jobs from email and treasurer queues
  let activeJobs = 0;
  try {
    const emailCounts = await emailQueue.getJobCounts('waiting', 'active');
    const treasurerCounts = await treasurerQueue.getJobCounts('waiting', 'active');
    
    activeJobs =
      (emailCounts.waiting || 0) +
      (emailCounts.active || 0) +
      (treasurerCounts.waiting || 0) +
      (treasurerCounts.active || 0);
  } catch (error) {
    console.error('[AdminStats] Failed to retrieve BullMQ job counts:', error.message);
    // fallback gracefully rather than failing the stats request
  }

  res.status(200).json({
    success: true,
    data: {
      totalMembers,
      totalRevenue,
      activeJobs,
    },
  });
});
