const router = require('express').Router();
const ctrl = require('../controllers/businessDevelopment.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', authorize('admin'), ctrl.list);
router.get('/stats', authorize('admin'), ctrl.getStats);
router.get('/export', authorize('admin'), ctrl.exportExcel);
router.get('/:id', authorize('admin'), ctrl.getOne);
router.post('/', authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.delete);

module.exports = router;
