import { Response, NextFunction } from 'express';
import { vaultiqService } from '../services/vaultiq.service';
import { AuthRequest } from '../types';

export const vaultiqController = {
  // ─── Clients ───────────────────────────────────────────────────────────────
  async createClient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultiqService.createClient(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result, message: 'Client engagement created.' });
    } catch (err) { next(err); }
  },

  async listClients(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultiqService.getClients(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async getClient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultiqService.getClientById(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async updateClientStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultiqService.updateClientStatus(req.params.id, req.user!.userId, req.body.status);
      res.json({ success: true, data: result, message: 'Client status updated.' });
    } catch (err) { next(err); }
  },

  async inferRisk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { services, industry, employees } = req.body;
      const result = vaultiqService.inferRisk(services, industry, employees);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  // ─── Assets ─────────────────────────────────────────────────────────────────
  async createAsset(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultiqService.createDataAsset(req.body);
      res.status(201).json({ success: true, data: result, message: 'Data asset registered.' });
    } catch (err) { next(err); }
  },

  async listAssets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultiqService.getAssets({
        vaultClientId: req.query.clientId as string,
        classification: req.query.classification as string,
        disposal: req.query.disposal as string,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async classifyDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fileName, categories } = req.body;
      const result = vaultiqService.classifyDocument(fileName, categories || []);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  // ─── Sharing Logs ──────────────────────────────────────────────────────────
  async createSharingLog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultiqService.createSharingLog(req.body);
      res.status(201).json({ success: true, data: result, message: 'Sharing log created.' });
    } catch (err) { next(err); }
  },

  async listSharingLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultiqService.getSharingLogs({
        vaultClientId: req.query.clientId as string,
        approval: req.query.approval as string,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async approveSharingLog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultiqService.updateSharingLogApproval(req.params.id, req.body.approval);
      res.json({ success: true, data: result, message: `Sharing ${req.body.approval.toLowerCase()}.` });
    } catch (err) { next(err); }
  },

  // ─── DPDP ──────────────────────────────────────────────────────────────────
  async updateDpdpRegister(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { registerType, status, notes } = req.body;
      const result = await vaultiqService.updateDpdpRegister(req.params.clientId, registerType, status, notes);
      res.json({ success: true, data: result, message: 'DPDP register updated.' });
    } catch (err) { next(err); }
  },

  async getDpdpReadiness(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultiqService.getDpdpReadiness(req.params.clientId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  // ─── Retention ─────────────────────────────────────────────────────────────
  async getRetentionItems(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultiqService.getRetentionItems();
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultiqService.getDashboardStats(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
