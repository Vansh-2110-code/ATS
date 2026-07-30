const Task = require('../models/Task');
const User = require('../models/User');

// GET /api/tasks/for-candidate/:candidateId — all tasks linked to a candidate (any role)
exports.forCandidate = async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const tasks = await Task.find({ candidateId })
      .sort('-createdAt')
      .populate('assignedTo', 'name role')
      .populate('assignedBy', 'name role');
    res.json({ tasks, total: tasks.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks
exports.list = async (req, res, next) => {
  try {
    const { status, assignedTo, priority, page = 1, limit = 50 } = req.query;
    const query = {};

    // Non-admins see tasks assigned to them
    if (req.user.role !== 'admin') {
      query.assignedTo = req.user._id; // Check if user is in assignedTo array
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit))
        .populate('assignedTo', 'name role employeeId')
        .populate('assignedBy', 'name role'),
      Task.countDocuments(query),
    ]);

    res.json({ tasks, total });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks
exports.create = async (req, res, next) => {
  try {
    const { 
      title, description, assignedTo, dueDate, priority, notes, 
      candidateId, candidateName, taskCategory,
      jrNumbers, jrNames
    } = req.body;
    if (!title || !assignedTo || (Array.isArray(assignedTo) && assignedTo.length === 0)) {
      return res.status(400).json({ message: 'title and at least one assignee are required' });
    }

    // Handle both single string and array of IDs
    const assigneeIds = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    // Validate all assignees exist
    const assignees = await User.find({ _id: { $in: assigneeIds } });
    if (assignees.length !== assigneeIds.length) {
      return res.status(404).json({ message: 'One or more assigned users not found' });
    }

    const assigneeNames = assignees.map(u => u.name);

    const task = await Task.create({
      title,
      description: description || '',
      assignedTo: assigneeIds,
      assignedToNames: assigneeNames,
      assignedBy: req.user._id,
      assignedByName: req.user.name,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || 'Medium',
      notes: notes || '',
      taskCategory: taskCategory || 'General',
      jrNumbers: jrNumbers || [],
      jrNames: jrNames || [],
      entityType: req.body.entityType || (candidateId ? 'candidate' : 'general'),
      entityId: req.body.entityId || candidateId,
      ...(candidateId && { candidateId, candidateName: candidateName || '' }),
    });

    // --- Notification Logic ---
    try {
      const notificationService = require('../utils/notification.service');
      const TeamMember = require('../models/TeamMember');

      // 1. Collect all direct recipients
      const recipients = new Set(assigneeIds.map(id => id.toString()));

      // 2. If assignees are recruiters, find their Team Leaders to notify them as well
      const teamMappings = await TeamMember.find({ memberId: { $in: assigneeIds }, removedAt: null }).select('teamLeaderId');
      teamMappings.forEach(m => recipients.add(m.teamLeaderId.toString()));

      // 3. Notify all Admins as well (if they are not the ones who assigned it)
      const admins = await User.find({ role: 'admin', status: 'Active' }).select('_id');
      admins.forEach(a => recipients.add(a._id.toString()));

      // 4. Remove the person who assigned the task from recipients (don't notify yourself)
      recipients.delete(req.user._id.toString());

      if (recipients.size > 0) {
        await notificationService.createBulkNotifications({
          recipientIds: Array.from(recipients),
          type: 'info',
          title: 'New Task Assigned',
          message: `${req.user.name} assigned a new task: "${title}"`,
          entityId: task._id,
          entityType: 'Task',
          navigateTo: '/admin/tasks'
        });
      }
    } catch (notifyErr) {
      console.error('Task notification failed:', notifyErr);
      // Don't fail the request if notification fails
    }

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id
exports.update = async (req, res, next) => {
  try {
    const updatable = ['title', 'description', 'dueDate', 'priority', 'status', 'notes', 'jrNumbers', 'jrNames', 'taskCategory'];
    const update = {};
    updatable.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    if (update.status === 'Completed') update.completedAt = new Date();

    const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
exports.remove = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/team-summary - Admin view of team tasks
exports.teamSummary = async (req, res, next) => {
  try {
    const users = await User.find({ status: 'Active' }).select('name role employeeId');
    const summary = await Promise.all(users.map(async (u) => {
      // Count tasks where user is in assignedTo array
      const [pending, inProgress, completed] = await Promise.all([
        Task.countDocuments({ assignedTo: u._id, status: 'Pending' }),
        Task.countDocuments({ assignedTo: u._id, status: 'In Progress' }),
        Task.countDocuments({ assignedTo: u._id, status: 'Completed' }),
      ]);
      return {
        userId: u._id,
        memberName: u.name,
        role: u.role,
        employeeId: u.employeeId,
        pending,
        inProgress,
        completed,
        total: pending + inProgress + completed,
      };
    }));
    res.json({ summary });
  } catch (err) {
    next(err);
  }
};
