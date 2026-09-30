import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { JobDurationPredictor } from '../services/ai/jobDurationPredictor.js';

export class AiController {
  static async predictDuration(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { machineType, areaInAcres, cropType, location, season } = req.body;

      if (!machineType || areaInAcres === undefined) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'machineType and areaInAcres are required',
          },
        });
        return;
      }

      const result = JobDurationPredictor.predict({
        machineType,
        areaInAcres: parseFloat(areaInAcres),
        cropType,
        location,
        season,
      });

      res.json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
