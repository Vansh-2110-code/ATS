const router = require('express').Router();
const ctrl = require('../controllers/job.controller');
const { auth, authorize } = require('../middleware/auth.middleware');
const { uploadJD, uploadImport } = require('../middleware/upload.middleware');

router.use(auth);

router.get('/companies', authorize('admin', 'manager', 'tl'), ctrl.companies);
router.get('/hr-contacts', authorize('admin', 'tl'), ctrl.getHRContacts);
router.get('/:id/candidates', authorize('admin', 'manager', 'tl'), ctrl.candidatesForJob);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
// Bulk create — must be before /:id
router.post('/bulk', authorize('tl', 'admin', 'manager'), uploadImport.single('file'), ctrl.bulkCreate);
router.post('/', authorize('tl', 'admin', 'manager'), uploadJD.single('jdFile'), ctrl.create);
// Admin, Manager, and TL can edit posted jobs
router.put('/:id', authorize('tl', 'admin', 'manager'), uploadJD.single('jdFile'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);
router.post('/:id/extract-keywords', authorize('tl', 'admin', 'manager'), ctrl.extractKeywords);

module.exports = router;
