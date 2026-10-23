const Notification = require('../models/Notification');
const { emitNotificationToUser } = require('./realtime/socketService');

/**
 * Creates a notification in MongoDB with deduplication protection,
 * and immediately broadcasts it to the connected user via Socket.IO.
 */
const createNotification = async ({
  recipient,
  title,
  message,
  type = 'NEW_NOTICE',
  notice = null,
  metadata = {}
}) => {
  try {
    if (!recipient) return null;

    // Deduplication check: if identical recipient + type + notice exists within the last 12 hours
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const query = {
      recipient,
      type,
      createdAt: { $gte: twelveHoursAgo }
    };
    if (notice) {
      query.notice = notice;
    }
    if (metadata?.dedupKey) {
      query['metadata.dedupKey'] = metadata.dedupKey;
    }

    const existing = await Notification.findOne(query);
    if (existing) {
      // Avoid duplicate spam
      return existing;
    }

    const doc = await Notification.create({
      recipient,
      title,
      message,
      type,
      notice,
      metadata,
      isRead: false
    });

    // Populate notice title for real-time client consumption if notice is present
    if (notice) {
      await doc.populate('notice', 'title category priority deadline');
    }

    // Broadcast immediately in real time
    emitNotificationToUser(recipient, doc);

    return doc;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Triggered when a notice is created/published.
 * Creates notifications for target students and notifies admin of publication.
 */
const notifyNoticePublished = async (notice, targetStudentIds = [], uploaderId = null) => {
  if (!notice) return;

  const title = notice.title || 'Official College Notice';
  const dept = notice.department && notice.department !== 'Not specified' ? `by ${notice.department}` : '';

  // 1. Notify target students of new notice
  for (const studentId of targetStudentIds) {
    await createNotification({
      recipient: studentId,
      title: 'New Notice Published',
      message: `New ${notice.category || ''} notice '${title}' has been published ${dept}.`.trim(),
      type: 'NEW_NOTICE',
      notice: notice._id,
      metadata: { priority: notice.priority, category: notice.category }
    });

    // 2. If HIGH priority, create an IMPORTANT_NOTICE notification
    if (notice.priority === 'HIGH') {
      await createNotification({
        recipient: studentId,
        title: 'Important Notice',
        message: `A high-priority notice requires your attention: ${title}`,
        type: 'IMPORTANT_NOTICE',
        notice: notice._id,
        metadata: { dedupKey: `high_priority_${notice._id}` }
      });
    }

    // 3. If deadline is present and specified, create DEADLINE notification
    const deadlineDate = notice.deadline?.date;
    if (deadlineDate && deadlineDate !== 'Not specified in the notice') {
      await createNotification({
        recipient: studentId,
        title: 'Deadline Reminder',
        message: `Notice '${title}' has an upcoming deadline: ${deadlineDate}${notice.deadline?.time ? ` (${notice.deadline.time})` : ''}`,
        type: 'DEADLINE',
        notice: notice._id,
        metadata: { dedupKey: `initial_deadline_${notice._id}` }
      });
    }
  }

  // 4. Notify publishing admin
  if (uploaderId) {
    await createNotification({
      recipient: uploaderId,
      title: 'Notice Published Successfully',
      message: `Your notice '${title}' was published to ${targetStudentIds.length} student(s).`,
      type: 'SYSTEM',
      notice: notice._id
    });
  }
};

/**
 * Notify admin/teacher of AI processing events
 */
const notifyAIProcessing = async (adminId, noticeId, status, noticeTitle = '', errorMsg = '') => {
  if (!adminId) return;

  let title = 'AI Processing';
  let message = 'Your uploaded notice is being analyzed by AI.';
  if (status === 'completed') {
    title = 'AI Processing Complete';
    message = `Your notice '${noticeTitle || 'Notice'}' has been analyzed successfully.`;
  } else if (status === 'failed') {
    title = 'AI Processing Failed';
    message = `AI could not analyze this notice${errorMsg ? `: ${errorMsg}` : ''}. Please retry.`;
  }

  return await createNotification({
    recipient: adminId,
    title,
    message,
    type: 'AI_PROCESSING',
    notice: noticeId
  });
};

/**
 * Notify recipient of incoming connection request
 */
const notifyConnectionRequest = async (senderName, recipientId) => {
  return await createNotification({
    recipient: recipientId,
    title: 'New Connection Request',
    message: `${senderName || 'An administrator'} sent you a connection request.`,
    type: 'CONNECTION'
  });
};

/**
 * Notify requester that their connection request was accepted
 */
const notifyConnectionAccepted = async (acceptorName, requesterId) => {
  return await createNotification({
    recipient: requesterId,
    title: 'Connection Accepted',
    message: `Your connection request was accepted by ${acceptorName || 'a student'}.`,
    type: 'CONNECTION'
  });
};

module.exports = {
  createNotification,
  notifyNoticePublished,
  notifyAIProcessing,
  notifyConnectionRequest,
  notifyConnectionAccepted
};
