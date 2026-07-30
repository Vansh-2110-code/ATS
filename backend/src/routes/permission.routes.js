const router = require('express').Router();
const ctrl = require('../controllers/permission.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);
router.use(authorize('admin'));

router.get('/', ctrl.getAll);
router.put('/', ctrl.update);

module.exports = router;
