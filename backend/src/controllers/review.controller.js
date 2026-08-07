const Review = require('../models/Review');
const { getDateRange } = require('../utils/helpers');

exports.getReviews = async (req, res, next) => {
  try {
    const { dateRange = 'month', startDate, endDate, employee } = req.query;
    const { start, end } = getDateRange(dateRange, startDate, endDate);
    
    const filter = {
      reviewPeriodStart: { $gte: start },
      reviewPeriodEnd: { $lte: end }
    };
    
    if (employee) {
      filter.employee = employee;
    }
    
    const reviews = await Review.find(filter)
      .populate('employee', 'name employeeId')
      .populate('reviewer', 'name')
      .sort('-createdAt');
      
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const { employee, reviewPeriodStart, reviewPeriodEnd, rating, comments, metrics } = req.body;
    
    const review = await Review.create({
      employee,
      reviewer: req.user._id,
      reviewPeriodStart,
      reviewPeriodEnd,
      rating,
      comments,
      metrics
    });
    
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};

exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('employee', 'name employeeId')
      .populate('reviewer', 'name');
      
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (err) {
    next(err);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};
