import { Response, NextFunction } from 'express';
import { itrService } from '../services/itr.service';
import { AuthRequest } from '../types';

export const itrController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await itrService.createReturn(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result, message: 'ITR created.' });
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await itrService.updateReturn(req.params.id, req.user!.userId, req.body.data);
      res.json({ success: true, data: result, message: 'Return updated.' });
    } catch (err) { next(err); }
  },

  async file(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await itrService.fileReturn(req.params.id, req.user!.userId);
      res.json({ success: true, data: result, message: 'ITR filed successfully.' });
    } catch (err) { next(err); }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await itrService.getReturns(req.user!.userId, {
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
      const result = await itrService.getReturnById(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async calculate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = itrService.calculateTax(req.body);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async summary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await itrService.getSummary(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
