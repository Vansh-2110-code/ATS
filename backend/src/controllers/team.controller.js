const User = require('../models/User');
const TeamMember = require('../models/TeamMember');

// ─── Get Team Members ──────────────────────────────────
exports.getTeamMembers = async (req, res) => {
  try {
    const { tlId } = req.query;
    const tlUser = req.user;
    
    // Admin can specify tlId, otherwise defaults to current user (TL)
    const targetTlId = (tlUser.role === 'admin' || tlUser.role === 'manager') && tlId ? tlId : tlUser._id;

    let formattedMembers = [];

    if (tlUser.role === 'admin' && (!tlId || tlId === 'all')) {
      // Admin preview mode: show all active recruiters
      const allRecruiters = await User.find({ role: 'recruiter', status: { $ne: 'Suspended' } }).lean().exec();
      formattedMembers = allRecruiters.map(r => ({
        _id: r._id,
        name: r.name,
        email: r.email,
        employeeId: r.employeeId,
        role: r.role,
      }));
    } else {
      const members = await TeamMember.find({ teamLeaderId: targetTlId, removedAt: null })
        .populate('memberId', 'name email employeeId role status')
        .lean()
        .exec();

      formattedMembers = members
        .filter(m => m && m.memberId && m.memberId.status !== 'Suspended')
        .map(m => ({
          _id: m.memberId._id || m.memberId,
          name: m.memberId.name || 'Recruiter',
          email: m.memberId.email || '',
          employeeId: m.memberId.employeeId || '',
          role: m.memberId.role || 'recruiter',
        }));
    }

    res.json({ success: true, members: formattedMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Add Team Member ───────────────────────
exports.addTeamMember = async (req, res) => {
  try {
    const { employeeId, tlId } = req.body;
    const currentUser = req.user;
    const mongoose = require('mongoose');

    // Admin can specify tlId, otherwise defaults to current user
    const targetTlId = (currentUser.role === 'admin' || currentUser.role === 'manager') && tlId ? tlId : currentUser._id;

    // Find the recruiter by _id or employeeId
    let recruiterQuery = { role: 'recruiter', status: { $ne: 'Suspended' } };
    if (mongoose.Types.ObjectId.isValid(employeeId)) {
      recruiterQuery._id = employeeId;
    } else {
      recruiterQuery.employeeId = employeeId;
    }

    const recruiter = await User.findOne(recruiterQuery);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found or is suspended' });
    }

    // Check if already assigned to ANY team leader
    const existing = await TeamMember.findOne({
      memberId: recruiter._id,
    });

    if (existing) {
      return res.status(400).json({ message: 'Recruiter is already assigned to a Team Leader' });
    }

    // Create team member record
    const teamMember = new TeamMember({
      teamLeaderId: targetTlId,
      memberId: recruiter._id,
      addedAt: new Date(),
    });

    await teamMember.save();
    res.json({ success: true, message: 'Recruiter added to team', member: recruiter });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Remove Team Member ──────────────────
exports.removeTeamMember = async (req, res) => {
  try {
    const { employeeId, tlId } = req.body;
    const currentUser = req.user;
    const mongoose = require('mongoose');

    const targetTlId = (currentUser.role === 'admin' || currentUser.role === 'manager') && tlId ? tlId : currentUser._id;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(employeeId)) {
      query._id = employeeId;
    } else {
      query.employeeId = employeeId;
    }

    const recruiter = await User.findOne(query);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    const result = await TeamMember.findOneAndDelete({
      teamLeaderId: targetTlId,
      memberId: recruiter._id,
    });

    if (!result) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    res.json({ success: true, message: 'Recruiter removed from team' });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Team Leaders (for Admin/Manager) ──────────────────────
exports.getTeamLeaders = async (req, res) => {
  try {
    const leaders = await User.find({ role: 'tl', status: { $ne: 'Suspended' } })
      .select('name email employeeId role _id')
      .lean()
      .exec();

    res.json({ success: true, leaders });
  } catch (error) {
    console.error('Error fetching team leaders:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Add Team Leader (Admin/Manager nominates TL) ────────────────
exports.addTeamLeader = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const mongoose = require('mongoose');

    let query = { status: { $ne: 'Suspended' } };
    if (mongoose.Types.ObjectId.isValid(employeeId)) {
      query._id = employeeId;
    } else {
      query.employeeId = employeeId;
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ message: 'Employee not found or is suspended' });
    }

    // Check if already TL
    if (user.role === 'tl') {
      return res.status(400).json({ message: 'Already a Team Lead' });
    }

    // Update role to TL
    user.role = 'tl';
    user.promotedAt = new Date();
    await user.save();

    res.json({ success: true, message: 'Employee promoted to Team Lead', user });
  } catch (error) {
    console.error('Error adding team leader:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Remove Team Leader (Admin/Manager demotes TL) ──────────────
exports.removeTeamLeader = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const mongoose = require('mongoose');

    let query = {};
    if (mongoose.Types.ObjectId.isValid(employeeId)) {
      query._id = employeeId;
    } else {
      query.employeeId = employeeId;
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (user.role !== 'tl') {
      return res.status(400).json({ message: 'Employee is not a Team Lead' });
    }

    // Revert to recruiter role
    user.role = 'recruiter';
    user.demotedAt = new Date();
    await user.save();

    // Remove their team members association (optional: keep for history)
    await TeamMember.deleteMany({ teamLeaderId: user._id });

    res.json({ success: true, message: 'Team Lead demoted to Recruiter', user });
  } catch (error) {
    console.error('Error removing team leader:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Available Employees (for assignment) ─────────────────────
exports.getAvailableEmployees = async (req, res) => {
  try {
    const { role } = req.query;

    let query = { status: { $ne: 'Suspended' } };
    if (role === 'recruiter') {
      query.role = 'recruiter';
    } else if (role === 'tl') {
      query.role = { $in: ['recruiter'] };
    }

    const employees = await User.find(query)
      .select('name email employeeId role status _id')
      .lean()
      .exec();

    // Filter out recruiters who are ALREADY assigned to ANY Team Leader
    if (role === 'recruiter') {
      const assignedRecords = await TeamMember.find({})
        .select('memberId')
        .lean()
        .exec();

      const assignedSet = new Set(assignedRecords.map(m => m.memberId ? m.memberId.toString() : ''));
      const available = employees.filter(emp => !assignedSet.has(emp._id.toString()));

      return res.json({ success: true, employees: available });
    }

    // Filter out employees who are ALREADY Team Leaders
    if (role === 'tl') {
      const existingTLs = await User.find({ role: 'tl' }).select('_id').lean();
      const tlSet = new Set(existingTLs.map(t => t._id.toString()));
      const available = employees.filter(emp => !tlSet.has(emp._id.toString()));

      return res.json({ success: true, employees: available });
    }

    res.json({ success: true, employees });
  } catch (error) {
    console.error('Error fetching available employees:', error);
    res.status(500).json({ message: error.message });
  }
};

