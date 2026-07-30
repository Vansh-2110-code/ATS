const router = require('express').Router();
const ctrl = require('../controllers/resumeScan.controller');
const { auth, authorize } = require('../middleware/auth.middleware');
const { uploadResume } = require('../middleware/upload.middleware');

router.use(auth);

router.post('/scan', authorize('recruiter', 'tl', 'admin'), uploadResume.single('resume'), ctrl.scan);
router.post('/scan-with-jd', authorize('recruiter', 'tl', 'admin'), uploadResume.single('resume'), ctrl.scanWithJD);

module.exports = router;
