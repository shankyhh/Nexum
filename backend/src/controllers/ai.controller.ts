import { Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { AuthRequest } from '../types';

export const aiController = {
  async chat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { message, module, conversationId } = req.body;
      if (!message?.trim()) {
        res.status(400).json({ success: false, message: 'Message is required.' });
        return;
      }
      const result = await aiService.chat(req.user!.userId, message, module, conversationId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async listConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await aiService.getConversations(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async getConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await aiService.getConversation(req.params.id, req.user!.userId);
      if (!result) {
        res.status(404).json({ success: false, message: 'Conversation not found.' });
        return;
      }
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async deleteConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ok = await aiService.deleteConversation(req.params.id, req.user!.userId);
      if (!ok) { res.status(404).json({ success: false, message: 'Conversation not found.' }); return; }
      res.json({ success: true, message: 'Conversation deleted.' });
    } catch (err) { next(err); }
  },
};
