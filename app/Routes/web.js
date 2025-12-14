import Router from './Router.js';
import SeniorCitizenController from '../Controllers/SeniorCitizenController.js';
import AuthController from '../Controllers/AuthController.js';
import UserController from '../Controllers/UserController.js';
import SyncController from '../Controllers/SyncController.js';

const router = new Router();

// Authentication routes
router.post('/api/auth/login', { controller: AuthController, method: 'login' });
router.get('/api/auth/verify/{id}', { controller: AuthController, method: 'verify' });
router.post('/api/auth/me', { controller: AuthController, method: 'me' });

// User Management routes
router.get('/api/users', { controller: UserController, method: 'index' });
router.get('/api/users/{id}', { controller: UserController, method: 'show' });
router.post('/api/users', { controller: UserController, method: 'store' });
router.put('/api/users/{id}', { controller: UserController, method: 'update' });
router.delete('/api/users/{id}', { controller: UserController, method: 'destroy' });

// Senior Citizen routes - Static routes first
router.get('/api/senior-citizens/export', { controller: SeniorCitizenController, method: 'export' });
router.get('/api/senior-citizens/stats', { controller: SeniorCitizenController, method: 'stats' });
router.post('/api/senior-citizens/import', { controller: SeniorCitizenController, method: 'import' });

// Dynamic routes
router.get('/api/senior-citizens', { controller: SeniorCitizenController, method: 'index' });
router.get('/api/senior-citizens/{id}', { controller: SeniorCitizenController, method: 'show' });
router.post('/api/senior-citizens', { controller: SeniorCitizenController, method: 'store' });
router.put('/api/senior-citizens/{id}', { controller: SeniorCitizenController, method: 'update' });
router.delete('/api/senior-citizens/{id}', { controller: SeniorCitizenController, method: 'destroy' });
router.post('/api/senior-citizens/{id}/submit', { controller: SeniorCitizenController, method: 'submit' });

// Sync routes
router.get('/api/sync/status/{lgu_id}', { controller: SyncController, method: 'getSyncStatus' });
router.get('/api/sync/history/{lgu_id}', { controller: SyncController, method: 'getSyncHistory' });
router.post('/api/sync/export/{lgu_id}', { controller: SyncController, method: 'exportToUSB' });
router.post('/api/sync/import/{lgu_id}', { controller: SyncController, method: 'importFromUSB' });
router.post('/api/sync/force/{lgu_id}', { controller: SyncController, method: 'forceSync' });
router.post('/api/sync/submit/{record_id}', { controller: SyncController, method: 'submitToAdmin' });
router.get('/api/sync/connectivity/{lgu_id}', { controller: SyncController, method: 'checkConnectivity' });

// Admin duplicate detection routes
router.get('/api/sync/duplicates/check/{record_id}', { controller: SyncController, method: 'checkDuplicates' });
router.post('/api/sync/duplicates/mark', { controller: SyncController, method: 'markAsDuplicates' });
router.get('/api/sync/duplicates/report', { controller: SyncController, method: 'getDuplicateReport' });

// Admin status update routes
router.post('/api/sync/status-updates/{lgu_id}', { controller: SyncController, method: 'generateStatusUpdates' });
router.get('/api/sync/pending-updates', { controller: SyncController, method: 'getLGUsWithPendingUpdates' });

// Supabase sync routes
router.post('/api/sync/upload/{lgu_id}', { controller: SyncController, method: 'syncToSupabase' });
router.post('/api/sync/full/{lgu_id}', { controller: SyncController, method: 'fullSync' });

export default router;
