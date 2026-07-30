const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/company.controller');

router.use(auth);

router.get('/', ctrl.list);
router.post('/', authorize('admin', 'manager'), ctrl.create);
router.put('/:id', authorize('admin', 'manager'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
