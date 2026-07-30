const express = require('express');
const router = express.Router();
const { auth: authenticate } = require('../middleware/auth.middleware');
const Message = require('../models/Message');

// Get messages for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const { folder = 'inbox', candidateId } = req.query;
    const query = folder === 'sent' ? { from: req.user.id } : { to: req.user.id };
    if (folder && folder !== 'sent') query.folder = folder;
    if (candidateId) query.candidateId = candidateId;
    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message
router.post('/', authenticate, async (req, res) => {
  try {
    const { to, toName, candidateId, subject, body, messageType, jobId, templateData } = req.body;
    const msg = await Message.create({
      from: req.user.id,
      fromName: req.user.name,
      fromRole: req.user.role,
      to,
      toName,
      candidateId,
      subject,
      body,
      messageType: messageType || 'general',
      folder: messageType && messageType.includes('letter')
        ? (messageType === 'offer_letter' ? 'offer_letters' : 'interview_letters')
        : 'inbox',
      jobId,
      templateData,
    });
    res.status(201).json({ message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Message.countDocuments({ to: req.user.id, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
