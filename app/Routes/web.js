import Router from './Router.js';
import SeniorCitizenController from '../Controllers/SeniorCitizenController.js';

const router = new Router();

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
