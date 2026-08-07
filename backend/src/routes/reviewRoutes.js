const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);
router.use(restrictTo('admin', 'tl', 'manager'));

router.get('/', reviewController.getReviews);
router.post('/', reviewController.createReview);
router.get('/:id', reviewController.getReview);
router.patch('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
