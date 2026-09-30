import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { TrackingService } from '../services/tracking/trackingService.js';

export class TrackingController {
  static async getBookingTracking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookingId } = req.params;
      const trackingData = TrackingService.getLiveTracking(bookingId);

      res.json({
        data: trackingData,
      });
    } catch (err) {
      next(err);
    }
  }
}
