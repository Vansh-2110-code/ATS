const router = require('express').Router();
const ctrl = require('../controllers/support.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

router.post('/chat', optionalAuth, ctrl.chatResponse);

module.exports = router;
