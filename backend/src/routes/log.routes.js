const router = require('express').Router();
const ctrl = require('../controllers/log.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);
router.use(authorize('admin'));

router.get('/', ctrl.list);
router.get('/export', ctrl.exportLogs);

module.exports = router;
