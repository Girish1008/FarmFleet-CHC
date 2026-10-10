import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { VoiceBookingService } from '../services/ai/voiceBooking.js';

export class VoiceBookingController {
  static async process(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      const audioBuffer = file ? file.buffer : null;
      const fileName = file ? file.originalname : 'recorded_call.webm';
      const mimeType = file ? file.mimetype : 'audio/webm';
      const language = (req.body?.language as string) || 'en';
      const clientTranscript = (req.body?.transcript as string) || undefined;

      const result = await VoiceBookingService.processVoiceAudio(
        audioBuffer,
        fileName,
        mimeType,
        req.user?.userId,
        language,
        clientTranscript
      );

      res.status(200).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async confirm(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { voiceRecordingId, overrides } = req.body;
      if (!voiceRecordingId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'voiceRecordingId is required',
          },
        });
        return;
      }

      const booking = await VoiceBookingService.confirmVoiceBooking(voiceRecordingId, overrides);
      res.status(201).json({
        data: booking,
        message: 'Voice booking confirmed and scheduled successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async reject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { voiceRecordingId } = req.body;
      if (!voiceRecordingId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'voiceRecordingId is required',
          },
        });
        return;
      }

      await VoiceBookingService.rejectVoiceBooking(voiceRecordingId);
      res.json({
        success: true,
        message: 'Voice recording and transcript rejected and purged successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}
