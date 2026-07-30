const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { auth } = require('../middleware/auth.middleware');

// All notification routes require authentication
router.use(auth);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
