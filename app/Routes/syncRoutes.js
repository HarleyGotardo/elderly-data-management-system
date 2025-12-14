const Router = require('../Router');
const SyncController = require('../Controllers/SyncController');

const router = new Router();
const controller = new SyncController();

// Sync status routes
router.get('/sync/status/:lgu_id', controller.getSyncStatus.bind(controller));
router.get('/sync/history/:lgu_id', controller.getSyncHistory.bind(controller));

// USB export/import routes
router.post('/sync/export/:lgu_id', controller.exportToUSB.bind(controller));
router.post('/sync/import/:lgu_id', controller.importFromUSB.bind(controller));

// Online sync routes
router.post('/sync/force/:lgu_id', controller.forceSync.bind(controller));

// Admin duplicate detection routes
router.get('/sync/duplicates/check/:record_id', controller.checkDuplicates.bind(controller));
router.post('/sync/duplicates/mark', controller.markAsDuplicates.bind(controller));
router.get('/sync/duplicates/report', controller.getDuplicateReport.bind(controller));

// Admin status update routes
router.post('/sync/status-updates/:lgu_id', controller.generateStatusUpdates.bind(controller));
router.get('/sync/pending-updates', controller.getLGUsWithPendingUpdates.bind(controller));

module.exports = router;
