const Notification = require('../models/Notification');
const User = require('../models/User');

const notificationService = {
  /**
   * Create a single notification for a specific user
   */
  async createNotification({ recipientId, type, title, message, entityId, entityType, navigateTo }) {
    try {
      const user = await User.findById(recipientId).select('role');
      if (!user) return null;

      const notification = new Notification({
        recipientId,
        recipientRole: user.role,
        type,
        title,
        message,
        entityId,
        entityType,
        navigateTo
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  },

  /**
   * Broadcast notification to multiple specific users
   */
  async createBulkNotifications({ recipientIds, type, title, message, entityId, entityType, navigateTo }) {
    try {
      const users = await User.find({ _id: { $in: recipientIds } }).select('role');
      if (!users.length) return;

      const notifications = users.map(user => ({
        recipientId: user._id,
        recipientRole: user.role,
        type,
        title,
        message,
        entityId,
        entityType,
        navigateTo,
        createdAt: new Date()
      }));

      await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
    }
  },

  /**
   * Notify all admins and managers
   */
  async notifyAdminsAndManagers({ type, title, message, entityId, entityType, navigateTo }) {
    try {
      const adminsAndManagers = await User.find({ role: { $in: ['admin', 'manager'] }, status: 'Active' }).select('_id');
      const recipientIds = adminsAndManagers.map(u => u._id);
      
      if (recipientIds.length > 0) {
        await this.createBulkNotifications({
          recipientIds, type, title, message, entityId, entityType, navigateTo
        });
      }
    } catch (error) {
      console.error('Error notifying admins and managers:', error);
    }
  },

  /**
   * Notify specific roles (e.g., all recruiters)
   */
  async notifyRole({ role, type, title, message, entityId, entityType, navigateTo }) {
    try {
      const users = await User.find({ role, status: 'Active' }).select('_id');
      const recipientIds = users.map(u => u._id);
      
      if (recipientIds.length > 0) {
        await this.createBulkNotifications({
          recipientIds, type, title, message, entityId, entityType, navigateTo
        });
      }
    } catch (error) {
      console.error('Error notifying role:', error);
    }
  }
};

module.exports = notificationService;
