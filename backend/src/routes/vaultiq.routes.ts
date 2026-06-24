import { Router } from 'express';
import { vaultiqController } from '../controllers/vaultiq.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Dashboard
router.get('/dashboard', vaultiqController.getDashboardStats);

// Clients
router.get('/clients', vaultiqController.listClients);
router.post('/clients', vaultiqController.createClient);
router.post('/clients/infer-risk', vaultiqController.inferRisk);
router.get('/clients/:id', vaultiqController.getClient);
router.patch('/clients/:id/status', vaultiqController.updateClientStatus);

// Data Assets
router.get('/assets', vaultiqController.listAssets);
router.post('/assets', vaultiqController.createAsset);
router.post('/assets/classify', vaultiqController.classifyDocument);

// Sharing Logs
router.get('/sharing-logs', vaultiqController.listSharingLogs);
router.post('/sharing-logs', vaultiqController.createSharingLog);
router.patch('/sharing-logs/:id/approval', vaultiqController.approveSharingLog);

// DPDP
router.get('/dpdp/:clientId/readiness', vaultiqController.getDpdpReadiness);
router.put('/dpdp/:clientId/register', vaultiqController.updateDpdpRegister);

// Retention
router.get('/retention', vaultiqController.getRetentionItems);

export default router;
