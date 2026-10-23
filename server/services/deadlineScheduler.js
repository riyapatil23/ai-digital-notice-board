const cron = require('node-cron');
const Notice = require('../models/Notice');
const { createNotification } = require('./notificationService');

/**
 * Checks all active notices with upcoming deadlines and generates reminder notifications
 * at 7 days, 3 days, and 1 day before the deadline.
 */
const checkUpcomingDeadlines = async () => {
  try {
    const notices = await Notice.find({
      'deadline.date': { $exists: true, $ne: 'Not specified in the notice', $nin: ['', null] }
    });

    const now = new Date();
    // Normalize to start of today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    for (const notice of notices) {
      const rawDate = notice.deadline?.date;
      if (!rawDate) continue;

      // Strip ordinal suffixes (15th, 1st, 2nd, etc.)
      const normalizedDateStr = rawDate.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
      const parsedDate = new Date(normalizedDateStr);
      if (isNaN(parsedDate.getTime())) continue;

      const deadlineDayStart = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()).getTime();
      const diffMs = deadlineDayStart - todayStart;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Remind at 7 days, 3 days, 1 day, and 0 days (due today)
      let reminderLabel = null;
      if (diffDays === 7) reminderLabel = '7 days';
      else if (diffDays === 3) reminderLabel = '3 days';
      else if (diffDays === 1) reminderLabel = '1 day';
      else if (diffDays === 0) reminderLabel = 'today';

      if (reminderLabel && Array.isArray(notice.targetStudents) && notice.targetStudents.length > 0) {
        for (const studentId of notice.targetStudents) {
          const dedupKey = `deadline_reminder_${notice._id}_${diffDays}d`;
          await createNotification({
            recipient: studentId,
            title: diffDays === 0 ? 'Urgent Deadline: Due Today' : `Deadline Reminder: Due in ${reminderLabel}`,
            message: `Notice '${notice.title}' deadline is ${diffDays === 0 ? 'today' : `in ${reminderLabel}`} (${rawDate}).`,
            type: 'DEADLINE',
            notice: notice._id,
            metadata: { dedupKey, daysRemaining: diffDays }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error during deadline reminder check:', error.message);
  }
};

const initDeadlineScheduler = () => {
  // Run once every hour at minute 0
  cron.schedule('0 * * * *', () => {
    // console.log('Running scheduled deadline reminder check...');
    checkUpcomingDeadlines();
  });

  // Also run a one-time check 5 seconds after server boot
  setTimeout(() => {
    checkUpcomingDeadlines();
  }, 5000);
};

module.exports = { initDeadlineScheduler, checkUpcomingDeadlines };
