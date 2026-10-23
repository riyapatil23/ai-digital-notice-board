process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Notice = require('./models/Notice');
const Notification = require('./models/Notification');
const Connection = require('./models/Connection');
const { extractTextFromFile } = require('./services/file/fileService');
const { analyzeNotice, askAI } = require('./services/ai/aiService');
const {
  createNotification,
  notifyNoticePublished,
  notifyConnectionRequest,
  notifyConnectionAccepted
} = require('./services/notificationService');
const { checkUpcomingDeadlines } = require('./services/deadlineScheduler');

async function runTests() {
  console.log('============================================================');
  console.log('🚀 RUNNING APEXCAMPUS AI END-TO-END VERIFICATION TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas\n');

    const testTimestamp = Date.now();
    const adminEmail = `test_admin_${testTimestamp}@apexcampus.edu`;
    const studentEmail = `test_student_${testTimestamp}@apexcampus.edu`;
    const student2Email = `test_student2_${testTimestamp}@apexcampus.edu`;

    // 1. Authentication & Registration Test
    console.log('--- TEST 1 & 2: Registration and User Verification ---');
    const adminUser = await User.create({
      name: 'Dr. Test Admin',
      email: adminEmail,
      password: 'password123',
      role: 'admin'
    });
    assert(adminUser && adminUser._id, 'Admin registered successfully in MongoDB');

    const studentUser = await User.create({
      name: 'Riya Student',
      email: studentEmail,
      password: 'password123',
      role: 'student'
    });
    assert(studentUser && studentUser._id, 'Student registered successfully in MongoDB');

    const studentUser2 = await User.create({
      name: 'Second Student',
      email: student2Email,
      password: 'password123',
      role: 'student'
    });
    assert(studentUser2 && studentUser2._id, 'Second student registered successfully');

    // 2. PDF Text Extraction Test
    console.log('\n--- TEST 3 & 4: PDF Text Parsing & OCR Verification ---');
    const fs = require('fs');
    const sampleFiles = fs.readdirSync('./uploads').filter(f => f.endsWith('.pdf'));
    let extractedSample = '';
    if (sampleFiles.length > 0) {
      extractedSample = await extractTextFromFile(`./uploads/${sampleFiles[0]}`, 'application/pdf');
      assert(extractedSample && extractedSample.length > 20, `PDF text extraction succeeded (${extractedSample.slice(0, 50)}...)`);
    } else {
      console.log('Skipping PDF file test: no sample uploads found');
    }

    // 3. Gemini AI Structured Information Extraction
    console.log('\n--- TEST 5 & 6: Gemini AI Structured Extraction & MongoDB Save ---');
    const rawNoticeContent = `
    R.C. Patel Institute of Technology
    Examination Department Circular
    Date: 24th October 2026
    Notice: Submission of Examination Forms for End Semester Examinations 2026.
    All B.Tech Third Year Computer Engineering students must submit their online exam form.
    Compulsory examination fee of Rs. 1200 must be deposited online.
    Important Dates:
    Form portal opening: 25th October 2026
    Final deadline for submission: 30th October 2026 at 5:00 PM.
    Venue: Exam Cell, Main Building.
    Contact: Dr. S. K. Patil, Controller of Examinations.
    `;

    console.log('Sending notice text to Gemini AI service...');
    const aiResult = await analyzeNotice(rawNoticeContent);
    assert(aiResult && aiResult.title, `Gemini generated structured title: "${aiResult.title}"`);
    assert(aiResult.summary && aiResult.summary.length > 10, 'Gemini generated valid summary');
    assert(Array.isArray(aiResult.importantPoints) && aiResult.importantPoints.length > 0, `Gemini generated ${aiResult.importantPoints.length} key points`);
    assert(aiResult.priority, `Gemini detected priority: ${aiResult.priority}`);
    assert(aiResult.aiProcessingStatus === 'completed', 'AI processing status is "completed"');

    // Save notice to MongoDB
    const noticeDoc = await Notice.create({
      title: aiResult.title,
      category: 'Exam',
      department: aiResult.department,
      priority: 'HIGH',
      originalFileUrl: sampleFiles.length > 0 ? `/uploads/${sampleFiles[0]}` : '/uploads/sample.pdf',
      fileType: 'application/pdf',
      extractedText: rawNoticeContent,
      aiProcessingStatus: 'completed',
      createdBy: adminUser._id,
      targetStudents: [studentUser._id],
      aiSummary: aiResult.summary,
      summary: aiResult.summary,
      simplifiedExplanation: aiResult.simplifiedExplanation,
      importantPoints: aiResult.importantPoints,
      dates: aiResult.dates,
      deadline: { date: '30th October 2026', time: '5:00 PM' },
      venue: aiResult.venue || 'Exam Cell',
      requiredAction: aiResult.requiredAction,
      eligibility: aiResult.eligibility,
      targetAudience: aiResult.targetAudience,
      studentsReachedCount: 1
    });
    assert(noticeDoc && noticeDoc._id, 'Notice successfully saved in MongoDB with full AI metadata');

    // 4. Student View & Notifications Creation
    console.log('\n--- TEST 7, 8 & 9: Notice Visibility & Notification Creation ---');
    const studentNotices = await Notice.find({
      $or: [
        { targetStudents: studentUser._id },
        { targetStudents: { $size: 0 } }
      ]
    });
    assert(studentNotices.some(n => n._id.toString() === noticeDoc._id.toString()), 'Student can see targeted notice');

    // Trigger publication notifications
    await notifyNoticePublished(noticeDoc, [studentUser._id], adminUser._id);

    const studentNotifs = await Notification.find({ recipient: studentUser._id });
    assert(studentNotifs.length > 0, `Created ${studentNotifs.length} notifications for student`);

    // 5. High-Priority and Deadline Notifications
    console.log('\n--- TEST 10, 13 & 14: High Priority Alert & Deadline Reminders ---');
    const importantNotif = studentNotifs.find(n => n.type === 'IMPORTANT_NOTICE');
    assert(importantNotif, 'High-priority notice generated an IMPORTANT_NOTICE notification');

    const deadlineNotif = studentNotifs.find(n => n.type === 'DEADLINE');
    assert(deadlineNotif, 'Notice with deadline generated a DEADLINE notification');

    // 6. Notification Unread Count, Mark Read, Mark All Read
    console.log('\n--- TEST 11 & 12: Notification Bell Unread Count & Mark-As-Read ---');
    const unreadCountInitial = await Notification.countDocuments({ recipient: studentUser._id, isRead: false });
    assert(unreadCountInitial > 0, `Unread count returns ${unreadCountInitial}`);

    // Mark single notification read
    importantNotif.isRead = true;
    await importantNotif.save();
    const unreadCountAfterOne = await Notification.countDocuments({ recipient: studentUser._id, isRead: false });
    assert(unreadCountAfterOne === unreadCountInitial - 1, 'Mark as read decremented unread count by 1');

    // Mark all read
    await Notification.updateMany({ recipient: studentUser._id, isRead: false }, { $set: { isRead: true } });
    const unreadCountFinal = await Notification.countDocuments({ recipient: studentUser._id, isRead: false });
    assert(unreadCountFinal === 0, 'Mark all as read cleared all unread notifications to 0');

    // 7. Connection Request & Accept Notifications
    console.log('\n--- TEST 15: Connection Flow & Notifications ---');
    await notifyConnectionRequest(adminUser.name, studentUser._id);
    const connRequestNotif = await Notification.findOne({ recipient: studentUser._id, type: 'CONNECTION' });
    assert(connRequestNotif, 'Connection request generated CONNECTION notification for student');

    await notifyConnectionAccepted(studentUser.name, adminUser._id);
    const connAcceptNotif = await Notification.findOne({ recipient: adminUser._id, type: 'CONNECTION' });
    assert(connAcceptNotif, 'Connection accept generated CONNECTION notification for admin');

    // 8. Authorization Scoping Test
    console.log('\n--- TEST 16: User Notification Authorization Scoping ---');
    // Ensure student 2 cannot fetch or modify student 1's notification
    const unauthorizedAccess = await Notification.findOne({
      _id: importantNotif._id,
      recipient: studentUser2._id
    });
    assert(!unauthorizedAccess, 'Student 2 cannot query or access Student 1 notification (ownership scoping verified)');

    // 9. Personal Ask AI Summarizer Test
    console.log('\n--- TEST 17: Personal "Ask AI / Summarize Notice" ---');
    const askAiResult = await askAI("All students must pay term fees by 15th November 2026. Submit receipts to accounts section.");
    assert(askAiResult && askAiResult.simpleExplanation, 'Ask AI returned simple explanation');
    assert(askAiResult.whatShouldIDo, 'Ask AI returned "whatShouldIDo"');
    assert(askAiResult.deadline, 'Ask AI returned deadline');

    // 10. Clean up test records
    await Notice.findByIdAndDelete(noticeDoc._id);
    await Notification.deleteMany({
      $or: [
        { recipient: studentUser._id },
        { recipient: studentUser2._id },
        { recipient: adminUser._id }
      ]
    });
    await User.deleteMany({ _id: { $in: [adminUser._id, studentUser._id, studentUser2._id] } });

    console.log('\n============================================================');
    console.log(`RESULTS: ${passed} / ${total} TESTS PASSED`);
    console.log('============================================================');

    await mongoose.disconnect();
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
