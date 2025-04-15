import express from 'express';
import multer from 'multer';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { authMiddleware } from '../middleware/auth';
import RecordingService from '../services/recordingService';
import { db } from '../config/database';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const recordingService = new RecordingService(db);

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
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No recording file provided' });
      }

      const { sessionId, type } = req.body;
      const recordingPath = await recordingService.storeRecording(
        sessionId,
        req.file.buffer,
        type,
        req.user.id
      );

      res.json({ success: true, path: recordingPath });
    } catch (error) {
      console.error('Error uploading recording:', error);
      res.status(500).json({ error: 'Failed to upload recording' });
    }
  }
);

// Get recording
router.get(
  '/:recordingId',
  authMiddleware,
  [
    param('recordingId').isUUID().withMessage('Invalid recording ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { recordingId } = req.params;
      const recording = await recordingService.getRecording(recordingId, req.user.id);

      res.setHeader('Content-Type', recording.mimeType);
      res.send(recording.data);
    } catch (error) {
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
  authMiddleware,
  [
    param('recordingId').isUUID().withMessage('Invalid recording ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { recordingId } = req.params;
      await recordingService.deleteRecording(recordingId, req.user.id);
      res.json({ success: true });
    } catch (error) {
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
  '/consent/:sessionId',
  authMiddleware,
  [
    param('sessionId').isUUID().withMessage('Invalid session ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const query = `
        SELECT consent_type, consented
        FROM recording_consent
        WHERE session_id = $1 AND user_id = $2
      `;
      const result = await db.query(query, [sessionId, req.user.id]);
      
      res.json(result.rows[0] || { consented: false });
    } catch (error) {
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
  async (req, res) => {
    try {
      const { sessionId, type, consented } = req.body;
      const query = `
        INSERT INTO recording_consent (
          session_id,
          user_id,
          consent_type,
          consented,
          consent_timestamp,
          consent_ip
        ) VALUES ($1, $2, $3, $4, NOW(), $5)
        ON CONFLICT (session_id, user_id)
        DO UPDATE SET
          consent_type = EXCLUDED.consent_type,
          consented = EXCLUDED.consented,
          consent_timestamp = EXCLUDED.consent_timestamp,
          consent_ip = EXCLUDED.consent_ip
      `;

      await db.query(query, [
        sessionId,
        req.user.id,
        type,
        consented,
        req.ip
      ]);

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating consent:', error);
      res.status(500).json({ error: 'Failed to update consent' });
    }
  }
);

export default router; 