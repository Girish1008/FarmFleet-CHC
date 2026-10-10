import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { store } from '../services/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { FarmerRequest, FarmerNotification, Booking } from '../types/index.js';
import crypto from 'crypto';

const createRequestSchema = z.object({
  requestedMachineType: z.string().min(1, 'Machine type is required'),
  areaInAcres: z.number().positive('Area must be greater than 0'),
  cropType: z.string().optional().nullable(),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  locationVillage: z.string().min(1, 'Village is required'),
  locationField: z.string().optional().nullable(),
  locationLandmark: z.string().optional().nullable(),
  specialInstructions: z.string().optional().nullable(),
});

export class FarmerController {
  static async listRequests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = req.user?.role;
      const farmerId = req.user?.userId;
      const { status, from, to } = req.query;

      // CHC Managers and Admins see all incoming requests across the center; Farmers see their own
      let requests = (userRole === 'ADMIN' || userRole === 'CHC_MANAGER')
        ? [...store.farmerRequests]
        : store.farmerRequests.filter(r => r.farmerId === farmerId);

      if (status) {
        requests = requests.filter(r => r.status === status);
      }
      if (from) {
        requests = requests.filter(r => new Date(r.preferredDate) >= new Date(from as string));
      }
      if (to) {
        requests = requests.filter(r => new Date(r.preferredDate) <= new Date(to as string));
      }

      // Populate farmer profile if missing
      requests = requests.map(r => ({
        ...r,
        farmer: r.farmer || store.users.find(u => u.id === r.farmerId),
      }));

      requests.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json({ data: requests });
    } catch (err) {
      next(err);
    }
  }

  static async getRequestById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const farmerId = req.user?.userId;

      const request = store.farmerRequests.find(r => r.id === id);
      if (!request) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Request ${id} not found`,
          },
        });
        return;
      }

      // Check ownership (unless admin/manager)
      if (req.user?.role === 'FARMER' && request.farmerId !== farmerId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own requests',
          },
        });
        return;
      }

      // Find any linked booking
      const linkedBooking = store.bookings.find(
        b =>
          b.farmerId === request.farmerId &&
          b.locationVillage === request.locationVillage &&
          b.cropType === request.cropType
      );

      res.json({
        data: {
          ...request,
          linkedBooking: linkedBooking || null,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async createRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = req.user?.userId!;
      const parsed = createRequestSchema.parse(req.body);

      const farmer = store.users.find(u => u.id === farmerId);

      const newRequest: FarmerRequest = {
        id: `req-${crypto.randomUUID().slice(0, 8)}`,
        farmerId,
        farmer,
        requestedMachineType: parsed.requestedMachineType.toUpperCase(),
        areaInAcres: parsed.areaInAcres,
        cropType: parsed.cropType || 'Wheat',
        preferredDate: new Date(parsed.preferredDate),
        locationVillage: parsed.locationVillage,
        locationField: parsed.locationField || null,
        locationLandmark: parsed.locationLandmark || null,
        status: 'PENDING',
        specialInstructions: parsed.specialInstructions || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.farmerRequests.push(newRequest);

      res.status(201).json({
        data: newRequest,
        message: 'Machinery request submitted to Custom Hiring Centre successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async listBookings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = req.user?.userId;
      const bookings = store.bookings
        .filter(b => b.farmerId === farmerId)
        .sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());

      res.json({ data: bookings });
    } catch (err) {
      next(err);
    }
  }

  static async getBookingById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const farmerId = req.user?.userId;

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

      if (req.user?.role === 'FARMER' && booking.farmerId !== farmerId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own bookings',
          },
        });
        return;
      }

      res.json({ data: booking });
    } catch (err) {
      next(err);
    }
  }

  static async cancelBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const farmerId = req.user?.userId;

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

      if (req.user?.role === 'FARMER' && booking.farmerId !== farmerId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only cancel your own bookings',
          },
        });
        return;
      }

      if (booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') {
        res.status(400).json({
          error: {
            code: 'CANNOT_CANCEL',
            message: 'Cannot cancel a booking that is already in progress or completed.',
          },
        });
        return;
      }

      booking.status = 'CANCELLED';
      booking.updatedAt = new Date();

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async listNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = req.user?.userId;
      const { unreadOnly } = req.query;

      let notifs = store.notifications.filter(n => n.farmerId === farmerId);
      if (unreadOnly === 'true') {
        notifs = notifs.filter(n => !n.read);
      }

      notifs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json({
        data: notifs,
        unreadCount: store.notifications.filter(n => n.farmerId === farmerId && !n.read).length,
      });
    } catch (err) {
      next(err);
    }
  }

  static async markNotificationRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const farmerId = req.user?.userId;

      const notif = store.notifications.find(n => n.id === id);
      if (!notif) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Notification ${id} not found`,
          },
        });
        return;
      }

      if (notif.farmerId !== farmerId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Unauthorized',
          },
        });
        return;
      }

      notif.read = true;
      res.json({ success: true, data: notif });
    } catch (err) {
      next(err);
    }
  }

  static async acceptRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { machineId, operatorId, scheduledStart, scheduledEnd } = req.body;

      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'CHC_MANAGER') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only Custom Hiring Centre Managers and Admins can accept farmer requests',
          },
        });
        return;
      }

      const request = store.farmerRequests.find(r => r.id === id);
      if (!request) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Request ${id} not found`,
          },
        });
        return;
      }

      // Update request status to APPROVED
      request.status = 'APPROVED';
      request.updatedAt = new Date();

      // Find appropriate machinery
      let machine = store.machines.find(m => m.id === machineId);
      if (!machine) {
        machine = store.machines.find(
          m => m.type.toUpperCase() === request.requestedMachineType.toUpperCase() && m.status === 'ACTIVE'
        ) || store.machines.find(m => m.status === 'ACTIVE') || store.machines[0];
      }

      // Find appropriate operator
      let operator = store.users.find(u => u.id === operatorId);
      if (!operator) {
        operator = store.users.find(u => u.role === 'OPERATOR') || undefined;
      }

      // Calculate schedule start and end
      const start = scheduledStart ? new Date(scheduledStart) : new Date(request.preferredDate);
      if (!scheduledStart) {
        start.setHours(9, 0, 0, 0);
      }
      const end = scheduledEnd ? new Date(scheduledEnd) : new Date(start.getTime() + 3 * 60 * 60 * 1000);

      // Check for existing booking or create new one in store.bookings
      let existingBooking = store.bookings.find(
        b => b.farmerId === request.farmerId &&
             b.locationVillage === request.locationVillage &&
             b.cropType === request.cropType &&
             b.status !== 'CANCELLED'
      );

      let booking: Booking;
      if (existingBooking) {
        existingBooking.status = 'APPROVED';
        if (machine) existingBooking.machineId = machine.id;
        if (operator) existingBooking.operatorId = operator.id;
        existingBooking.scheduledStart = start;
        existingBooking.scheduledEnd = end;
        existingBooking.updatedAt = new Date();
        booking = existingBooking;
      } else {
        const farmer = store.users.find(u => u.id === request.farmerId) || request.farmer;
        booking = {
          id: `bk-${crypto.randomUUID().slice(0, 8)}`,
          farmerId: request.farmerId,
          farmer: farmer,
          machineId: machine?.id || store.machines[0]?.id,
          machine: machine || store.machines[0],
          operatorId: operator?.id || null,
          operator: operator,
          areaInAcres: request.areaInAcres,
          cropType: request.cropType || 'Wheat',
          locationVillage: request.locationVillage,
          locationField: request.locationField || 'Field Plot 1',
          locationLandmark: request.locationLandmark || 'Near Primary School',
          scheduledStart: start,
          scheduledEnd: end,
          predictedDurationMinutes: 180,
          status: 'APPROVED',
          specialInstructions: request.specialInstructions || `Created from Farmer Request #${request.id}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.bookings.unshift(booking);
      }

      // Notify the farmer
      const notification: FarmerNotification = {
        id: `notif-${crypto.randomUUID().slice(0, 8)}`,
        farmerId: request.farmerId,
        title: 'Machinery Request Accepted',
        message: `Your request for ${request.requestedMachineType} (${request.areaInAcres} Acres) on ${new Date(request.preferredDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} has been approved and scheduled by the CHC team.`,
        type: 'REQUEST_APPROVED',
        read: false,
        createdAt: new Date(),
      };
      store.notifications.unshift(notification);

      res.json({
        data: {
          request,
          booking,
        },
        message: 'Farmer request accepted and scheduled into CHC bookings successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async rejectRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'CHC_MANAGER') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only Custom Hiring Centre Managers and Admins can reject farmer requests',
          },
        });
        return;
      }

      const request = store.farmerRequests.find(r => r.id === id);
      if (!request) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Request ${id} not found`,
          },
        });
        return;
      }

      request.status = 'REJECTED';
      request.updatedAt = new Date();

      // Notify the farmer
      const notification: FarmerNotification = {
        id: `notif-${crypto.randomUUID().slice(0, 8)}`,
        farmerId: request.farmerId,
        title: 'Machinery Request Declined',
        message: reason || `Your request for ${request.requestedMachineType} could not be scheduled at this time. Please contact the Custom Hiring Centre for assistance.`,
        type: 'JOB_CANCELLED',
        read: false,
        createdAt: new Date(),
      };
      store.notifications.unshift(notification);

      res.json({
        data: request,
        message: 'Farmer request rejected',
      });
    } catch (err) {
      next(err);
    }
  }
}
