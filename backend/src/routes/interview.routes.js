const router = require('express').Router();
const ctrl = require('../controllers/interview.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', ctrl.list);
router.post('/', authorize('recruiter', 'tl', 'admin'), ctrl.create);
router.put('/:id/status', authorize('recruiter', 'tl', 'admin'), ctrl.updateStatus);

module.exports = router;
