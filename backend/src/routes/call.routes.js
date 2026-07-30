const router = require('express').Router();
const ctrl = require('../controllers/call.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);

router.post('/initiate', authorize('recruiter', 'tl', 'admin'), ctrl.initiate);
router.put('/:id/end', authorize('recruiter', 'tl', 'admin'), ctrl.endCall);
router.post('/:id/log', authorize('recruiter', 'tl', 'admin'), ctrl.logOutcome);
router.get('/candidate/:candidateId', ctrl.getCandidateCalls);
router.get('/my', ctrl.getMyCalls);

module.exports = router;
