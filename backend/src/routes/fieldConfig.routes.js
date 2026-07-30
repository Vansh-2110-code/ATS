const router = require('express').Router();
const ctrl = require('../controllers/fieldConfig.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

// Admin only routes
router.use(auth);
router.use(authorize('admin'));

// Order matters: specific routes BEFORE generic ones
// Configuration endpoints
router.get('/all', ctrl.getAllConfigs);                              // GET all configs
router.post('/reset', ctrl.resetToDefaults);                        // RESET to defaults

// Preset endpoints (BEFORE /:role so /presets/list isn't caught as role='presets')
router.get('/presets/list', ctrl.getPresets);                       // GET presets for role
router.post('/presets', ctrl.savePreset);                           // SAVE new preset
router.delete('/presets/:presetId', ctrl.deletePreset);             // DELETE preset

// Generic role-based endpoints (LAST)
router.get('/:role', ctrl.getConfig);                               // GET config for role
router.put('/:role', ctrl.updateConfig);                            // UPDATE config for role

module.exports = router;

