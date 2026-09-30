import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { store } from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Booking, BookingStatus, FarmerNotification } from '../types/index.js';
import { JobDurationPredictor } from '../services/ai/jobDurationPredictor.js';
import crypto from 'crypto';

const createBookingSchema = z.object({
  farmerId: z.string().optional(),
  farmerName: z.string().optional(),
  farmerPhone: z.string().optional(),
  machineId: z.string().min(1, 'Machine ID is required'),
  operatorId: z.string().optional().nullable(),
  areaInAcres: z.number().positive('Area must be greater than 0'),
  cropType: z.string().optional().nullable(),
  locationVillage: z.string().min(1, 'Village is required'),
  locationField: z.string().optional().nullable(),
  locationLandmark: z.string().optional().nullable(),
  scheduledStart: z.string().min(1, 'Scheduled start date/time is required'),
  scheduledEnd: z.string().min(1, 'Scheduled end date/time is required'),
  specialInstructions: z.string().optional().nullable(),
});

export class BookingsController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, machineId, farmerId, from, to, search, page = '1', limit = '10' } = req.query;

      let results = [...store.bookings];

      if (status) {
        results = results.filter(b => b.status === status);
      }
      if (machineId) {
        results = results.filter(b => b.machineId === machineId);
      }
      if (farmerId) {
        results = results.filter(b => b.farmerId === farmerId);
      }
      if (from) {
        const fromDate = new Date(from as string);
        results = results.filter(b => new Date(b.scheduledStart) >= fromDate);
      }
      if (to) {
        const toDate = new Date(to as string);
        results = results.filter(b => new Date(b.scheduledStart) <= toDate);
      }
      if (search) {
        const q = (search as string).toLowerCase();
        results = results.filter(
          b =>
            b.farmer?.name.toLowerCase().includes(q) ||
            b.locationVillage.toLowerCase().includes(q) ||
            b.machine?.name.toLowerCase().includes(q)
        );
      }

      // Sort newest first
      results.sort(
        (a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime()
      );

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const total = results.length;
      const paginated = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      res.json({
        data: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const booking = store.bookings.find(b => b.id === id);
      if (!booking) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Booking ${id} not found`,
          },
        });
        return;
      }

      res.json({ data: booking });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createBookingSchema.parse(req.body);

      // Validate scheduledEnd > scheduledStart
      const start = new Date(parsed.scheduledStart);
      const end = new Date(parsed.scheduledEnd);
      if (end.getTime() <= start.getTime()) {
        res.status(400).json({
          error: {
            code: 'INVALID_TIME_RANGE',
            message: 'Scheduled end time must be after scheduled start time',
          },
        });
        return;
      }

      // Resolve farmer
      let farmer = store.users.find(u => u.id === parsed.farmerId);
      if (!farmer && parsed.farmerPhone) {
        farmer = store.users.find(u => u.phone === parsed.farmerPhone);
      }
      if (!farmer) {
        // Create new farmer user if named in booking
        farmer = {
          id: `usr-farmer-${Date.now()}`,
          name: parsed.farmerName || 'Walk-in Farmer',
          email: `${(parsed.farmerName || 'farmer').toLowerCase().replace(/\s+/g, '')}@farmfleet.local`,
          phone: parsed.farmerPhone || '9800000000',
          role: 'FARMER',
          passwordHash: 'seeded',
          village: parsed.locationVillage,
          address: parsed.locationField || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.users.push(farmer);
      }

      const machine = store.machines.find(m => m.id === parsed.machineId);
      if (!machine) {
        res.status(400).json({
          error: {
            code: 'INVALID_MACHINE',
            message: `Machine with ID ${parsed.machineId} not found`,
          },
        });
        return;
      }

      const operator = parsed.operatorId ? store.users.find(u => u.id === parsed.operatorId) : null;

      // Predict duration
      const durationResult = JobDurationPredictor.predict({
        machineType: machine.type,
        areaInAcres: parsed.areaInAcres,
        cropType: parsed.cropType,
        location: parsed.locationVillage,
      });

      const newBooking: Booking = {
        id: `bk-${crypto.randomUUID().slice(0, 8)}`,
        farmerId: farmer.id,
        farmer,
        machineId: machine.id,
        machine,
        operatorId: operator ? operator.id : null,
        operator,
        areaInAcres: parsed.areaInAcres,
        cropType: parsed.cropType || 'Wheat',
        locationVillage: parsed.locationVillage,
        locationField: parsed.locationField || null,
        locationLandmark: parsed.locationLandmark || null,
        scheduledStart: start,
        scheduledEnd: end,
        predictedDurationMinutes: durationResult.predictedDurationMinutes,
        actualStart: null,
        actualEnd: null,
        status: operator ? 'ASSIGNED' : 'APPROVED',
        specialInstructions: parsed.specialInstructions || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.bookings.push(newBooking);

      // Create notification for farmer
      const notif: FarmerNotification = {
        id: `notif-${Date.now()}`,
        farmerId: farmer.id,
        type: 'JOB_SCHEDULED',
        title: 'Booking Scheduled',
        message: `Your booking for ${machine.name} on ${parsed.areaInAcres} acres in ${parsed.locationVillage} has been confirmed.`,
        relatedBookingId: newBooking.id,
        read: false,
        createdAt: new Date(),
      };
      store.notifications.push(notif);

      res.status(201).json({ data: newBooking });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const booking = store.bookings.find(b => b.id === id);
      if (!booking) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Booking ${id} not found`,
          },
        });
        return;
      }

      const updates = req.body;
      const hadActualTimes = !!(booking.actualStart && booking.actualEnd);

      if (updates.scheduledStart) booking.scheduledStart = new Date(updates.scheduledStart);
      if (updates.scheduledEnd) booking.scheduledEnd = new Date(updates.scheduledEnd);
      if (updates.status) booking.status = updates.status as BookingStatus;
      if (updates.operatorId !== undefined) {
        booking.operatorId = updates.operatorId;
        booking.operator = updates.operatorId
          ? store.users.find(u => u.id === updates.operatorId) || null
          : null;
      }
      if (updates.machineId) {
        booking.machineId = updates.machineId;
        booking.machine = store.machines.find(m => m.id === updates.machineId) || booking.machine;
      }
      if (updates.actualStart !== undefined) {
        booking.actualStart = updates.actualStart ? new Date(updates.actualStart) : null;
      }
      if (updates.actualEnd !== undefined) {
        booking.actualEnd = updates.actualEnd ? new Date(updates.actualEnd) : null;
      }
      if (updates.specialInstructions !== undefined) {
        booking.specialInstructions = updates.specialInstructions;
      }

      booking.updatedAt = new Date();

      // If job just completed with actual start and end, feed to duration prediction AI
      if (!hadActualTimes && booking.actualStart && booking.actualEnd) {
        const actualMinutes = Math.round(
          (new Date(booking.actualEnd).getTime() - new Date(booking.actualStart).getTime()) / 60000
        );
        if (actualMinutes > 5 && booking.machine) {
          JobDurationPredictor.recordActualJobDuration({
            machineType: booking.machine.type,
            areaInAcres: booking.areaInAcres,
            cropType: booking.cropType,
            location: booking.locationVillage,
            season: 'Rabi',
            actualDurationMinutes: actualMinutes,
          });
        }
      }

      res.json({ data: booking });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const booking = store.bookings.find(b => b.id === id);
      if (!booking) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Booking ${id} not found`,
          },
        });
        return;
      }

      booking.status = 'CANCELLED';
      booking.updatedAt = new Date();

      res.json({ success: true, message: `Booking ${id} cancelled successfully` });
    } catch (err) {
      next(err);
    }
  }
}
