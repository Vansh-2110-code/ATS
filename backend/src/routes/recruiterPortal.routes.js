const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/recruiterPortal.controller');

router.use(auth);

router.get('/', ctrl.list);
router.post('/', authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
