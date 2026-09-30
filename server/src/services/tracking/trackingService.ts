import { store } from '../db.js';
import { OperatorLocation, Booking } from '../../types/index.js';
import crypto from 'crypto';

export interface TrackingDataResponse {
  booking: {
    id: string;
    farmerName: string;
    farmerPhone?: string;
    machineName: string;
    machineType: string;
    operatorName?: string;
    operatorPhone?: string;
    village: string;
    field?: string;
    landmark?: string;
    status: string;
    scheduledStart: string;
    scheduledEnd: string;
    actualStart?: string | null;
  };
  fieldCoordinates: {
    latitude: number;
    longitude: number;
    label: string;
  };
  latestLocation: {
    latitude: number;
    longitude: number;
    speed: number | null;
    timestamp: string;
  } | null;
  path: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number | null;
  }>;
  distanceFromFieldMeters: number | null;
  lastUpdateAgoSeconds: number | null;
}

export class TrackingService {
  /**
   * Approximate village coordinate mapper for realistic Indian farming locations
   */
  static getVillageCoordinates(village: string): { latitude: number; longitude: number } {
    const v = (village || '').toLowerCase();
    if (v.includes('sultanpur')) return { latitude: 30.6548, longitude: 75.8342 };
    if (v.includes('bhagwanpur')) return { latitude: 30.672, longitude: 75.858 };
    if (v.includes('morinda')) return { latitude: 30.793, longitude: 76.495 };
    if (v.includes('khanna')) return { latitude: 30.705, longitude: 76.216 };
    // Default Punjab / Haryana agriculture coordinates
    return { latitude: 30.66, longitude: 75.84 };
  }

  /**
   * Record new GPS coordinate from operator device
   */
  static recordLocation(params: {
    bookingId: string;
    operatorId: string;
    latitude: number;
    longitude: number;
    speed?: number | null;
    timestamp?: Date | string;
  }): OperatorLocation {
    const booking = store.bookings.find(b => b.id === params.bookingId);
    if (!booking) {
      throw new Error(`Booking ${params.bookingId} not found`);
    }

    if (booking.operatorId && booking.operatorId !== params.operatorId) {
      throw new Error(`Unauthorized: User is not the assigned operator for booking ${params.bookingId}`);
    }

    const loc: OperatorLocation = {
      id: `loc-${crypto.randomUUID().slice(0, 8)}`,
      bookingId: params.bookingId,
      operatorId: params.operatorId,
      latitude: params.latitude,
      longitude: params.longitude,
      speed: params.speed || 0,
      timestamp: params.timestamp ? new Date(params.timestamp) : new Date(),
      createdAt: new Date(),
    };

    store.operatorLocations.push(loc);

    // Prune old coordinates for this booking: keep last 100 points
    const bookingLocs = store.operatorLocations.filter(l => l.bookingId === params.bookingId);
    if (bookingLocs.length > 100) {
      const idsToKeep = new Set(
        bookingLocs
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 100)
          .map(l => l.id)
      );
      store.operatorLocations = store.operatorLocations.filter(
        l => l.bookingId !== params.bookingId || idsToKeep.has(l.id)
      );
    }

    return loc;
  }

  /**
   * Get Live Tracking telemetry for CHC Manager
   */
  static getLiveTracking(bookingId: string): TrackingDataResponse {
    const booking = store.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const locations = store.operatorLocations
      .filter(l => l.bookingId === bookingId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const fieldCoords = this.getVillageCoordinates(booking.locationVillage);

    const latest = locations.length > 0 ? locations[locations.length - 1] : null;

    let distanceMeters: number | null = null;
    let lastUpdateSeconds: number | null = null;

    if (latest) {
      distanceMeters = Math.round(
        this.calculateHaversineDistance(
          latest.latitude,
          latest.longitude,
          fieldCoords.latitude,
          fieldCoords.longitude
        )
      );
      lastUpdateSeconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(latest.timestamp).getTime()) / 1000)
      );
    }

    return {
      booking: {
        id: booking.id,
        farmerName: booking.farmer?.name || 'Farmer',
        farmerPhone: booking.farmer?.phone || undefined,
        machineName: booking.machine?.name || 'Machine',
        machineType: booking.machine?.type || 'TRACTOR',
        operatorName: booking.operator?.name || 'Assigned Operator',
        operatorPhone: booking.operator?.phone || undefined,
        village: booking.locationVillage,
        field: booking.locationField || undefined,
        landmark: booking.locationLandmark || undefined,
        status: booking.status,
        scheduledStart: new Date(booking.scheduledStart).toISOString(),
        scheduledEnd: new Date(booking.scheduledEnd).toISOString(),
        actualStart: booking.actualStart ? new Date(booking.actualStart).toISOString() : null,
      },
      fieldCoordinates: {
        latitude: fieldCoords.latitude,
        longitude: fieldCoords.longitude,
        label: `${booking.locationVillage} - ${booking.locationField || 'Field'}`,
      },
      latestLocation: latest
        ? {
            latitude: latest.latitude,
            longitude: latest.longitude,
            speed: latest.speed ?? null,
            timestamp: new Date(latest.timestamp).toISOString(),
          }
        : null,
      path: locations.map(l => ({
        latitude: l.latitude,
        longitude: l.longitude,
        speed: l.speed ?? null,
        timestamp: new Date(l.timestamp).toISOString(),
      })),
      distanceFromFieldMeters: distanceMeters,
      lastUpdateAgoSeconds: lastUpdateSeconds,
    };
  }

  /**
   * Great-circle Haversine formula in meters
   */
  private static calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
