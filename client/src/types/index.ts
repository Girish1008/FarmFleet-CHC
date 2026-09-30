export type Role = 'ADMIN' | 'CHC_MANAGER' | 'OPERATOR' | 'FARMER';

export type MachineStatus = 'ACTIVE' | 'MAINTENANCE' | 'BROKEN';

export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type RequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED';

export type ProposalReason = 'BREAKDOWN' | 'DELAY' | 'CANCELLATION' | 'URGENT_JOB';
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type NotificationType =
  | 'REQUEST_APPROVED'
  | 'JOB_ASSIGNED'
  | 'JOB_SCHEDULED'
  | 'JOB_RESCHEDULED'
  | 'JOB_COMPLETED'
  | 'JOB_CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  village?: string | null;
  address?: string | null;
}

export interface Machine {
  id: string;
  type: string;
  name: string;
  status: MachineStatus;
  chclId?: string | null;
}

export interface Booking {
  id: string;
  farmerId: string;
  farmer?: User;
  machineId: string;
  machine?: Machine;
  operatorId?: string | null;
  operator?: User | null;
  areaInAcres: number;
  cropType?: string | null;
  locationVillage: string;
  locationField?: string | null;
  locationLandmark?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  predictedDurationMinutes?: number | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  status: BookingStatus;
  specialInstructions?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FarmerRequest {
  id: string;
  farmerId: string;
  farmer?: User;
  requestedMachineType: string;
  areaInAcres: number;
  cropType?: string | null;
  preferredDate: string;
  locationVillage: string;
  locationField?: string | null;
  locationLandmark?: string | null;
  status: RequestStatus;
  specialInstructions?: string | null;
  createdAt: string;
  updatedAt: string;
  linkedBooking?: Booking | null;
}

export interface ScheduleSlot {
  startTime: string;
  endTime: string;
  score: number;
  reason: string;
  estimatedTravelMinutes?: number;
}

export interface ScheduleChangeProposal {
  id: string;
  reason: ProposalReason;
  status: ProposalStatus;
  proposedChanges: {
    affectedBookingIds: string[];
    details: Array<{
      bookingId: string;
      farmerName: string;
      machineName: string;
      oldStart: string;
      oldEnd: string;
      newStart: string;
      newEnd: string;
      newMachineId?: string;
      newMachineName?: string;
      changeReason: string;
    }>;
  };
  createdAt: string;
}

export interface OperatorLocation {
  id?: string;
  bookingId: string;
  operatorId?: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  timestamp: string;
}

export interface Notification {
  id: string;
  farmerId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedRequestId?: string | null;
  relatedBookingId?: string | null;
  read: boolean;
  createdAt: string;
}

export interface VoiceBookingExtractedData {
  farmerName?: string;
  farmerPhone?: string;
  machineType?: string;
  areaInAcres?: number;
  cropType?: string;
  preferredDate?: string;
  timeWindow?: 'morning' | 'afternoon' | 'evening' | 'custom';
  village?: string;
  field?: string;
  landmark?: string;
  specialNotes?: string;
  confidence?: number;
}

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
    status: BookingStatus;
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
