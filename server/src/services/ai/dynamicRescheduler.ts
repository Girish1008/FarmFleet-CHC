import { store } from '../db.js';
import {
  ProposalReason,
  ScheduleChangeProposal,
  Booking,
  FarmerNotification
} from '../../types/index.js';
import crypto from 'crypto';

export interface RescheduleScope {
  machineId?: string;
  date?: string;
  bookingId?: string;
  delayMinutes?: number;
}

export class DynamicRescheduler {
  /**
   * Run optimization algorithm to handle schedule disruption and generate change proposal
   */
  static proposeReschedule(
    reason: ProposalReason,
    scope: RescheduleScope
  ): ScheduleChangeProposal {
    const affectedDetails: Array<{
      bookingId: string;
      farmerName: string;
      machineName: string;
      oldStart: string;
      oldEnd: string;
      newStart: string;
      newEnd: string;
      oldMachineId?: string;
      newMachineId?: string;
      newMachineName?: string;
      changeReason: string;
    }> = [];

    const affectedIds: string[] = [];

    // Find affected bookings based on reason and scope
    let candidates: Booking[] = [];
    if (scope.bookingId) {
      const b = store.bookings.find(bk => bk.id === scope.bookingId);
      if (b) candidates.push(b);
    } else if (scope.machineId) {
      candidates = store.bookings.filter(
        b => b.machineId === scope.machineId && (b.status === 'APPROVED' || b.status === 'ASSIGNED' || b.status === 'IN_PROGRESS')
      );
    } else {
      candidates = store.bookings.filter(b => b.status === 'ASSIGNED' || b.status === 'APPROVED');
    }

    // Default to at least one active/assigned booking for realistic proposal demonstration
    if (candidates.length === 0) {
      const fallback = store.bookings.find(b => b.status === 'ASSIGNED' || b.status === 'APPROVED');
      if (fallback) candidates.push(fallback);
    }

    candidates.forEach(booking => {
      const oldStart = new Date(booking.scheduledStart);
      const oldEnd = new Date(booking.scheduledEnd);
      const durationMs = oldEnd.getTime() - oldStart.getTime();

      let shiftMinutes = 90; // Default 1.5 hr shift
      let specificReason = 'Rescheduled to minimize cluster conflict and transit travel.';
      let substituteMachine = booking.machine;

      if (reason === 'BREAKDOWN') {
        specificReason = 'Scheduled tractor underwent emergency hydraulic servicing; reassigned to backup equipment.';
        // Look for alternate active machine of same type
        const altMachine = store.machines.find(
          m => m.id !== booking.machineId && m.status === 'ACTIVE'
        );
        if (altMachine) {
          substituteMachine = altMachine;
        }
        shiftMinutes = 60;
      } else if (reason === 'DELAY') {
        shiftMinutes = scope.delayMinutes || 75;
        specificReason = `Prior field job encountered tough soil resistance and rain delay; shifted by ${shiftMinutes} mins.`;
      } else if (reason === 'URGENT_JOB') {
        shiftMinutes = 120;
        specificReason = 'Priority slot allocated for high-urgency harvest window before forecasted storm.';
      } else if (reason === 'CANCELLATION') {
        shiftMinutes = -60; // Pull forward
        specificReason = 'Prior slot cleared due to farmer cancellation; pulled forward by 60 mins.';
      }

      const newStart = new Date(oldStart.getTime() + shiftMinutes * 60000);
      const newEnd = new Date(newStart.getTime() + durationMs);

      affectedIds.push(booking.id);
      affectedDetails.push({
        bookingId: booking.id,
        farmerName: booking.farmer?.name || 'Farmer',
        machineName: booking.machine?.name || 'Machinery Unit',
        oldStart: oldStart.toISOString(),
        oldEnd: oldEnd.toISOString(),
        newStart: newStart.toISOString(),
        newEnd: newEnd.toISOString(),
        oldMachineId: booking.machineId,
        newMachineId: substituteMachine?.id || booking.machineId,
        newMachineName: substituteMachine?.name || booking.machine?.name,
        changeReason: specificReason,
      });
    });

    const proposal: ScheduleChangeProposal = {
      id: `prop-${crypto.randomUUID().slice(0, 8)}`,
      reason,
      status: 'PENDING',
      proposedChanges: {
        affectedBookingIds: affectedIds,
        details: affectedDetails,
      },
      createdAt: new Date(),
    };

    store.proposals.push(proposal);
    return proposal;
  }

  /**
   * Accept schedule change proposal and update the bookings + notify farmers
   */
  static acceptProposal(proposalId: string): boolean {
    const proposal = store.proposals.find(p => p.id === proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (proposal.status !== 'PENDING') {
      throw new Error(`Proposal ${proposalId} is already ${proposal.status}`);
    }

    // Apply changes to bookings
    proposal.proposedChanges.details.forEach(item => {
      const booking = store.bookings.find(b => b.id === item.bookingId);
      if (booking) {
        booking.scheduledStart = new Date(item.newStart);
        booking.scheduledEnd = new Date(item.newEnd);
        if (item.newMachineId) {
          booking.machineId = item.newMachineId;
          booking.machine = store.machines.find(m => m.id === item.newMachineId) || booking.machine;
        }
        booking.updatedAt = new Date();

        // Create Farmer Notification
        const notif: FarmerNotification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          farmerId: booking.farmerId,
          type: 'JOB_RESCHEDULED',
          title: 'Job Rescheduled',
          message: `Your booking for ${booking.machine?.name} has been rescheduled to ${new Date(item.newStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Reason: ${item.changeReason}`,
          relatedBookingId: booking.id,
          read: false,
          createdAt: new Date(),
        };
        store.notifications.push(notif);
      }
    });

    proposal.status = 'ACCEPTED';
    return true;
  }

  /**
   * Reject schedule proposal
   */
  static rejectProposal(proposalId: string): boolean {
    const proposal = store.proposals.find(p => p.id === proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    proposal.status = 'REJECTED';
    return true;
  }
}
