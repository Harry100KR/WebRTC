import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { authMiddleware, validateRecordingAccess } from '../middleware/auth';
import RecordingService from '../services/recordingService';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const recordingService = new RecordingService(pool);

// Upload recording
router.post(
  '/upload',
  authMiddleware,
  upload.single('recording'),
  [
    body('sessionId').isUUID().withMessage('Invalid session ID'),
    body('type').isIn(['video', 'screen', 'both']).withMessage('Invalid recording type')
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const userId = req.user.id.toString();
      if (!req.file) {
        return res.status(400).json({ error: 'No recording file provided' });
      }

      const { sessionId, type } = req.body;
      const recordingPath = await recordingService.storeRecording(
        sessionId,
        req.file.buffer,
        type,
        userId
      );

      res.json({ success: true, path: recordingPath });
    } catch (error: any) {
      console.error('Error uploading recording:', error);
      res.status(500).json({ error: 'Failed to upload recording' });
    }
  }
);

// Get recording
router.get(
  '/:recordingId',
  validateRecordingAccess,
  [
    param('recordingId').isUUID().withMessage('Invalid recording ID')
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const { recordingId } = req.params;
      const userId = req.user.id.toString();
      const recording = await recordingService.getRecording(recordingId, userId);

      res.setHeader('Content-Type', recording.mimeType);
      res.send(recording.data);
    } catch (error: any) {
      if (error.message === 'Access denied') {
        res.status(403).json({ error: 'Access denied' });
      } else if (error.message === 'Recording not found') {
        res.status(404).json({ error: 'Recording not found' });
      } else {
        console.error('Error retrieving recording:', error);
        res.status(500).json({ error: 'Failed to retrieve recording' });
      }
    }
  }
);

// Delete recording
router.delete(
  '/:recordingId',
  validateRecordingAccess,
  [
    param('recordingId').isUUID().withMessage('Invalid recording ID')
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const { recordingId } = req.params;
      const userId = req.user.id.toString();
      await recordingService.deleteRecording(recordingId, userId);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === 'Access denied') {
        res.status(403).json({ error: 'Access denied' });
      } else if (error.message === 'Recording not found') {
        res.status(404).json({ error: 'Recording not found' });
      } else {
        console.error('Error deleting recording:', error);
        res.status(500).json({ error: 'Failed to delete recording' });
      }
    }
  }
);

// Get recording consent status
router.get(
  '/consent-status/:sessionId',
  authMiddleware,
  [
    param('sessionId').isUUID().withMessage('Invalid session ID')
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { sessionId } = req.params;
      const query = `
        SELECT consented
        FROM recording_consent
        WHERE session_id = $1 AND user_id = $2
      `;
      const result = await pool.query(query, [sessionId, req.user.id.toString()]);
      
      res.json(result.rows[0] || { consented: false });
    } catch (error: any) {
      console.error('Error checking consent status:', error);
      res.status(500).json({ error: 'Failed to check consent status' });
    }
  }
);

// Update recording consent
router.post(
  '/consent',
  authMiddleware,
  [
    body('sessionId').isUUID().withMessage('Invalid session ID'),
    body('type').isIn(['video', 'screen', 'both']).withMessage('Invalid consent type'),
    body('consented').isBoolean().withMessage('Invalid consent value')
  ],
  validateRequest,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { sessionId, type, consented } = req.body;
      const query = `
        INSERT INTO recording_consent (session_id, user_id, type, consented)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (session_id, user_id, type)
        DO UPDATE SET consented = $4
      `;

      await pool.query(query, [
        sessionId,
        req.user.id.toString(),
        type,
        consented
      ]);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating consent:', error);
      res.status(500).json({ error: 'Failed to update consent' });
    }
  }
);

export default router; 