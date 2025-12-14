import Router from './Router.js';
import SeniorCitizenController from '../Controllers/SeniorCitizenController.js';
import AuthController from '../Controllers/AuthController.js';
import UserController from '../Controllers/UserController.js';

const router = new Router();

// Authentication routes
router.post('/auth/login', { controller: AuthController, method: 'login' });
router.get('/auth/verify/{id}', { controller: AuthController, method: 'verify' });
router.post('/auth/me', { controller: AuthController, method: 'me' });

// User Management routes
router.get('/users', { controller: UserController, method: 'index' });
router.get('/users/{id}', { controller: UserController, method: 'show' });
router.post('/users', { controller: UserController, method: 'store' });
router.put('/users/{id}', { controller: UserController, method: 'update' });
router.delete('/users/{id}', { controller: UserController, method: 'destroy' });

// Senior Citizen routes - Static routes first
router.get('/senior-citizens/export', { controller: SeniorCitizenController, method: 'export' });
router.get('/senior-citizens/stats', { controller: SeniorCitizenController, method: 'stats' });
router.post('/senior-citizens/import', { controller: SeniorCitizenController, method: 'import' });

// Dynamic routes
router.get('/senior-citizens', { controller: SeniorCitizenController, method: 'index' });
router.get('/senior-citizens/{id}', { controller: SeniorCitizenController, method: 'show' });
router.post('/senior-citizens', { controller: SeniorCitizenController, method: 'store' });
router.put('/senior-citizens/{id}', { controller: SeniorCitizenController, method: 'update' });
router.delete('/senior-citizens/{id}', { controller: SeniorCitizenController, method: 'destroy' });
router.post('/senior-citizens/{id}/submit', { controller: SeniorCitizenController, method: 'submit' });

export default router;
