const Notification = require('../models/Notification');
const TeamMember = require('../models/TeamMember');

exports.getNotifications = async (req, res, next) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const { role, _id: userId } = req.user;
    let query = {};

    if (role === 'admin') {
      // Admins see everything
      query = {};
    } else if (role === 'manager') {
      // Managers see everything except admin-specific systemic stuff
      // But for now, let's say they see all recruiter/TL/manager/walkin notifications
      query = { recipientRole: { $in: ['recruiter', 'tl', 'manager', 'walkin', 'spoc'] } };
    } else if (role === 'tl') {
      // TLs see their own + their team members' notifications
      const teamMembers = await TeamMember.find({ teamLeaderId: userId }).select('memberId');
      const memberIds = teamMembers.map(m => m.memberId);
      query = { recipientId: { $in: [userId, ...memberIds] } };
    } else {
      // Recruiters, SPOCs, Walkins see only their own
      query = { recipientId: userId };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const { role, _id: userId } = req.user;
    let query = { read: false };

    if (role === 'admin') {
      query = { read: false };
    } else if (role === 'manager') {
      query = { read: false, recipientRole: { $in: ['recruiter', 'tl', 'manager', 'walkin', 'spoc'] } };
    } else if (role === 'tl') {
      const teamMembers = await TeamMember.find({ teamLeaderId: userId }).select('memberId');
      const memberIds = teamMembers.map(m => m.memberId);
      query = { read: false, recipientId: { $in: [userId, ...memberIds] } };
    } else {
      query = { read: false, recipientId: userId };
    }

    const count = await Notification.countDocuments(query);
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Optional: Add authorization check here if needed (e.g., can only mark own or team's as read)

    notification.read = true;
    await notification.save();

    res.json({ message: 'Marked as read', notification });
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const { role, _id: userId } = req.user;
    let query = { read: false };

    if (role === 'admin') {
      query = { read: false };
    } else if (role === 'manager') {
      query = { read: false, recipientRole: { $in: ['recruiter', 'tl', 'manager', 'walkin', 'spoc'] } };
    } else if (role === 'tl') {
      const teamMembers = await TeamMember.find({ teamLeaderId: userId }).select('memberId');
      const memberIds = teamMembers.map(m => m.memberId);
      query = { read: false, recipientId: { $in: [userId, ...memberIds] } };
    } else {
      query = { read: false, recipientId: userId };
    }

    await Notification.updateMany(query, { $set: { read: true } });

    res.json({ message: 'All marked as read' });
  } catch (err) {
    next(err);
  }
};
