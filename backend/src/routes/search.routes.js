const router = require('express').Router();
const ctrl = require('../controllers/search.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);
router.get('/global', authorize('recruiter', 'tl', 'manager', 'admin', 'spoc'), ctrl.globalSearch);

module.exports = router;
