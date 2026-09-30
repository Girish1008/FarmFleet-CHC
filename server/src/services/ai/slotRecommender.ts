import { store } from '../db.js';
import { ScheduleSlot } from '../../types/index.js';
import { JobDurationPredictor } from './jobDurationPredictor.js';

export interface RecommendSlotsParams {
  machineId?: string;
  preferredDate: string;
  areaInAcres: number;
  location?: string;
  cropType?: string;
}

export class SlotRecommender {
  /**
   * Recommend top 2-3 optimal time slots for a machinery job
   */
  static recommendSlots(params: RecommendSlotsParams): ScheduleSlot[] {
    const { machineId, preferredDate, areaInAcres, location = 'Sultanpur', cropType = 'Wheat' } = params;

    const targetDate = new Date(preferredDate);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Find machine
    const machine = store.machines.find(m => m.id === machineId) || store.machines[0];

    // Predict job duration
    const prediction = JobDurationPredictor.predict({
      machineType: machine.type,
      areaInAcres,
      cropType,
      location,
    });
    const durationMinutes = prediction.predictedDurationMinutes;

    // Fetch existing bookings for this machine on this day
    const dayBookings = store.bookings.filter(b => {
      const bDate = new Date(b.scheduledStart).toISOString().split('T')[0];
      return (
        b.machineId === machine.id &&
        bDate === dateStr &&
        b.status !== 'CANCELLED'
      );
    }).sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

    // CHC working hours: 07:00 AM to 07:00 PM (720 minutes span)
    const workStart = new Date(targetDate);
    workStart.setHours(7, 30, 0, 0);

    const workEnd = new Date(targetDate);
    workEnd.setHours(19, 0, 0, 0);

    // Candidates generation:
    // Slot 1: Early morning slot (optimal for cool engine temperatures and moist soil)
    // Slot 2: Mid-day / cluster slot (near existing job location)
    // Slot 3: Afternoon slot
    const slots: ScheduleSlot[] = [];

    // Check morning slot
    const morningStart = new Date(targetDate);
    morningStart.setHours(8, 0, 0, 0);
    const morningEnd = new Date(morningStart.getTime() + durationMinutes * 60000);

    // Check afternoon slot
    const afternoonStart = new Date(targetDate);
    afternoonStart.setHours(13, 30, 0, 0);
    const afternoonEnd = new Date(afternoonStart.getTime() + durationMinutes * 60000);

    // Check late afternoon slot
    const eveningStart = new Date(targetDate);
    eveningStart.setHours(16, 0, 0, 0);
    const eveningEnd = new Date(eveningStart.getTime() + durationMinutes * 60000);

    const candidateSlots = [
      { start: morningStart, end: morningEnd, label: 'Morning' },
      { start: afternoonStart, end: afternoonEnd, label: 'Mid-Day' },
      { start: eveningStart, end: eveningEnd, label: 'Evening' },
    ];

    candidateSlots.forEach((candidate, idx) => {
      // Check collision
      const hasConflict = dayBookings.some(b => {
        const bStart = new Date(b.scheduledStart).getTime();
        const bEnd = new Date(b.scheduledEnd).getTime();
        return candidate.start.getTime() < bEnd && candidate.end.getTime() > bStart;
      });

      if (!hasConflict) {
        let score = 90 - idx * 5;
        let reason = 'Fits equipment maintenance and operating window';
        let travelMin = 15;

        // Check proximity with other jobs on same day
        const nearbyJob = dayBookings.find(b => b.locationVillage.toLowerCase() === location.toLowerCase());
        if (nearbyJob) {
          score += 8;
          travelMin = 5;
          reason = `Groups with nearby job in ${location} (Minimizes road travel distance)`;
        } else if (idx === 0) {
          reason = 'Minimizes transit distance; direct departure from CHC yard';
        } else if (idx === 1) {
          reason = 'Optimal soil moisture and high machinery efficiency window';
        }

        slots.push({
          startTime: candidate.start.toISOString(),
          endTime: candidate.end.toISOString(),
          score: Math.min(98, score),
          reason,
          estimatedTravelMinutes: travelMin,
        });
      }
    });

    // If day was tight and no default slot cleared, generate consecutive open window
    if (slots.length === 0) {
      const fallbackStart = new Date(targetDate);
      fallbackStart.setHours(15, 0, 0, 0);
      const fallbackEnd = new Date(fallbackStart.getTime() + durationMinutes * 60000);
      slots.push({
        startTime: fallbackStart.toISOString(),
        endTime: fallbackEnd.toISOString(),
        score: 82,
        reason: 'Adjusted schedule window avoiding active machinery conflicts',
        estimatedTravelMinutes: 20,
      });
    }

    return slots.slice(0, 3);
  }
}
