import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { store } from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { TrackingService } from '../services/tracking/trackingService.js';
import { JobDurationPredictor } from '../services/ai/jobDurationPredictor.js';
import { FarmerNotification } from '../types/index.js';

const locationSchema = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().optional().nullable(),
  timestamp: z.string().optional(),
});

export class OperatorController {
  static async getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = req.user?.userId;
      const tasks = store.bookings
        .filter(b => b.operatorId === operatorId)
        .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

      res.json({ data: tasks });
    } catch (err) {
      next(err);
    }
  }

  static async updateTaskStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const operatorId = req.user?.userId;
      const { status } = req.body;

      const booking = store.bookings.find(b => b.id === id);
      if (!booking) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Booking/Task ${id} not found`,
          },
        });
        return;
      }

      if (booking.operatorId !== operatorId && req.user?.role !== 'ADMIN' && req.user?.role !== 'CHC_MANAGER') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You are not assigned to this job task',
          },
        });
        return;
      }

      const now = new Date();

      if (status === 'IN_PROGRESS') {
        booking.status = 'IN_PROGRESS';
        if (!booking.actualStart) {
          booking.actualStart = now;
        }

        // Notify farmer
        const notif: FarmerNotification = {
          id: `notif-${Date.now()}`,
          farmerId: booking.farmerId,
          type: 'JOB_ASSIGNED',
          title: 'Machinery Operation Started',
          message: `${booking.machine?.name} has begun work on your field in ${booking.locationVillage}.`,
          relatedBookingId: booking.id,
          read: false,
          createdAt: now,
        };
        store.notifications.push(notif);
      } else if (status === 'COMPLETED') {
        booking.status = 'COMPLETED';
        booking.actualEnd = now;

        // Feed to AI duration training model
        if (booking.actualStart && booking.machine) {
          const durationMinutes = Math.max(
            10,
            Math.round((now.getTime() - new Date(booking.actualStart).getTime()) / 60000)
          );
          JobDurationPredictor.recordActualJobDuration({
            machineType: booking.machine.type,
            areaInAcres: booking.areaInAcres,
            cropType: booking.cropType,
            location: booking.locationVillage,
            season: 'Rabi',
            actualDurationMinutes: durationMinutes,
          });
        }

        // Notify farmer
        const notif: FarmerNotification = {
          id: `notif-${Date.now()}`,
          farmerId: booking.farmerId,
          type: 'JOB_COMPLETED',
          title: 'Field Operation Completed',
          message: `Your booking for ${booking.machine?.name} (${booking.areaInAcres} acres) has been successfully completed.`,
          relatedBookingId: booking.id,
          read: false,
          createdAt: now,
        };
        store.notifications.push(notif);
      } else if (status) {
        booking.status = status;
      }

      booking.updatedAt = now;

      res.json({
        data: booking,
        message: `Job status updated to ${booking.status}`,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getActiveJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = req.user?.userId;
      const activeJob = store.bookings.find(
        b => b.operatorId === operatorId && b.status === 'IN_PROGRESS'
      );

      res.json({ data: activeJob || null });
    } catch (err) {
      next(err);
    }
  }

  static async recordLocation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const operatorId = req.user?.userId!;
      const parsed = locationSchema.parse(req.body);

      const record = TrackingService.recordLocation({
        bookingId: parsed.bookingId,
        operatorId,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        speed: parsed.speed,
        timestamp: parsed.timestamp,
      });

      res.status(201).json({
        data: record,
        message: 'Location telemetry ingested successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}
