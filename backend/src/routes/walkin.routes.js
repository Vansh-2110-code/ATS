const router = require('express').Router();
const ctrl = require('../controllers/walkin.controller');
const { auth, authorize, optionalAuth } = require('../middleware/auth.middleware');
const { walkinAuth } = require('../middleware/walkinAuth.middleware');
const { uploadResume } = require('../middleware/upload.middleware');

// ─── Existing Walk-In Queue Routes (Office Check-In) ──────────────
// Public registration — optionalAuth attaches req.user if a walkin session token is present
router.post('/register', optionalAuth, uploadResume.single('resume'), ctrl.register);

// Protected queue management
router.get('/queue', auth, ctrl.getQueue);
router.put('/:id/status', auth, authorize('recruiter', 'tl', 'manager', 'admin'), ctrl.updateStatus);
router.put('/:id/assign', auth, authorize('tl', 'manager', 'admin'), ctrl.assign);

// ═══════════════════════════════════════════════════════════════════
// SELF-REGISTRATION WALK-IN AUTHENTICATION ROUTES (New Module)
// ═══════════════════════════════════════════════════════════════════

// ─── Public Routes (No Auth Required) ───────────────────────────
// POST /api/walkin/signup - Register new walk-in candidate via web form
router.post('/signup', ctrl.walkInSignup);

// POST /api/walkin/login - Login walk-in candidate
router.post('/login', ctrl.walkInLogin);

// ─── Authenticated Routes (Requires Walk-in Auth Token) ────────
// POST /api/walkin/form - Submit walk-in application form with resume
router.post('/form', walkinAuth, uploadResume.single('resume'), ctrl.submitWalkInForm);

// GET /api/walkin/status - Get authenticated user's walk-in status
router.get('/status', walkinAuth, (req, res, next) => {
  req.params.id = req.walkinId;
  ctrl.getWalkInStatus(req, res, next);
});

// GET /api/walkin/:id/resume - Download resume by walk-in ID
router.get('/:id/resume', ctrl.downloadResume);

// PUT /api/walkin/password - Update walk-in password
router.put('/password', walkinAuth, ctrl.updateWalkInPassword);

// GET /api/walkin/:id (legacy) - Get walk-in status by ID (used by dashboard)
router.get('/:id', (req, res, next) => {
  ctrl.getWalkInStatus(req, res, next);
});

// ─── Demo Flow Routes (New Module) ───────────────────────────
// POST /api/walkin/demo-login - Login as a virtual demo user
router.post('/demo-login', ctrl.demoLogin);

// POST /api/walkin/register-demo - Register a candidate as a demo user
router.post('/register-demo', auth, authorize('demo_walkin'), uploadResume.single('resume'), ctrl.registerDemoCandidate);

module.exports = router;
