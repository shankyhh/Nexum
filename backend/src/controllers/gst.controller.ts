import { Response, NextFunction } from 'express';
import { gstService } from '../services/gst.service';
import { AuthRequest } from '../types';

export const gstController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await gstService.createReturn(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result, message: 'GST return created.' });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await gstService.updateReturn(req.params.id, req.user!.userId, req.body.data);
      res.json({ success: true, data: result, message: 'Return updated.' });
    } catch (err) { next(err); }
  },

  async file(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await gstService.fileReturn(req.params.id, req.user!.userId);
      res.json({ success: true, data: result, message: 'Return filed successfully.' });
    } catch (err) { next(err); }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await gstService.getReturns(req.user!.userId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        status: req.query.status as string,
        returnType: req.query.returnType as string,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await gstService.getReturnById(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async calculate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, data } = req.body;
      const result = type === 'GSTR3B'
        ? gstService.calculateGstr3bLiability(data)
        : gstService.calculateGstr1Tax(data);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async summary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await gstService.getSummary(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
