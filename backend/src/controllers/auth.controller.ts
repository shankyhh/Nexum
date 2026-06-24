import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role, gstin, pan, phone } = req.body;
      const result = await authService.register({ email, password, name, role, gstin, pan, phone });
      res.status(201).json({ success: true, data: result, message: 'Account created successfully.' });
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({ success: true, data: result, message: 'Login successful.' });
    } catch (err) { next(err); }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, phone, gstin, pan } = req.body;
      const user = await authService.updateProfile(req.user!.userId, { name, phone, gstin, pan });
      res.json({ success: true, data: user, message: 'Profile updated.' });
    } catch (err) { next(err); }
  },

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const token = authService.refreshToken(req.user!.userId, req.user!.email, req.user!.role);
      res.json({ success: true, data: { token } });
    } catch (err) { next(err); }
  },
};
