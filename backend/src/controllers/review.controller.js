const Review = require('../models/Review');
const User = require('../models/User');
const { getDateRange } = require('../utils/helpers');

// GET /api/reviews
exports.getReviews = async (req, res, next) => {
  try {
    const { dateRange = 'month', startDate, endDate, from, to, employee } = req.query;
    const filter = {};

    const rangeType = (dateRange || 'month').toLowerCase();
    const effectiveStart = startDate || from;
    const effectiveEnd = endDate || to;

    if (rangeType !== 'all') {
      const { start, end } = getDateRange(rangeType, effectiveStart, effectiveEnd);
      filter.createdAt = { $gte: start, $lte: end };
    }

    if (employee && employee !== 'All' && employee !== 'all') {
      filter.employee = employee;
    }

    // TL scoping
    if (req.user.role === 'tl') {
      const TeamMember = require('../models/TeamMember');
      const teamMembers = await TeamMember.find({ tlId: req.user._id }).select('employeeId');
      const memberUserIds = teamMembers.map(m => m.employeeId);
      memberUserIds.push(req.user._id);
      if (!filter.employee) {
        filter.employee = { $in: memberUserIds };
      }
    }

    const reviews = await Review.find(filter)
      .populate('employee', 'name employeeId role designation')
      .populate('reviewer', 'name role')
      .sort('-createdAt');

    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews
exports.createReview = async (req, res, next) => {
  try {
    const { employee, reviewPeriodStart, reviewPeriodEnd, rating, comments, metrics } = req.body;

    if (!employee) {
      return res.status(400).json({ message: 'Employee is required' });
    }

    const targetUser = await User.findById(employee);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target employee not found' });
    }

    // Role-based permission enforcement:
    // - Team Lead (tl) can only review Recruiters
    // - Manager & Admin can review Recruiters and Team Leads
    const creatorRole = req.user.role;
    const targetRole = targetUser.role;

    if (creatorRole === 'tl' && targetRole !== 'recruiter') {
      return res.status(403).json({
        message: 'Team Leaders are only permitted to submit performance reviews for Recruiters.'
      });
    }

    if (creatorRole !== 'admin' && creatorRole !== 'manager' && creatorRole !== 'tl') {
      return res.status(403).json({ message: 'Not authorized to create performance reviews.' });
    }

    const review = await Review.create({
      employee,
      reviewer: req.user._id,
      reviewPeriodStart: reviewPeriodStart || new Date(),
      reviewPeriodEnd: reviewPeriodEnd || new Date(),
      rating,
      comments,
      metrics
    });

    const populatedReview = await Review.findById(review._id)
      .populate('employee', 'name employeeId role designation')
      .populate('reviewer', 'name role');

    res.status(201).json(populatedReview);
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/:id
exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('employee', 'name employeeId role designation')
      .populate('reviewer', 'name role');

    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/reviews/:id
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('employee', 'name employeeId role designation')
      .populate('reviewer', 'name role');

    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    next(err);
  }
};
