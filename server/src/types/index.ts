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

export type VoiceRecordingStatus = 'PROCESSING' | 'CONFIRMED' | 'REJECTED';

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
  passwordHash: string;
  village?: string | null;
  address?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Machine {
  id: string;
  type: string; // TRACTOR, ROTAVATOR, SEEDER, SPRAYER, HARVESTER
  name: string;
  status: MachineStatus;
  chclId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
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
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  predictedDurationMinutes?: number | null;
  actualStart?: Date | string | null;
  actualEnd?: Date | string | null;
  status: BookingStatus;
  specialInstructions?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FarmerRequest {
  id: string;
  farmerId: string;
  farmer?: User;
  requestedMachineType: string;
  areaInAcres: number;
  cropType?: string | null;
  preferredDate: Date | string;
  locationVillage: string;
  locationField?: string | null;
  locationLandmark?: string | null;
  status: RequestStatus;
  specialInstructions?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface VoiceRecording {
  id: string;
  bookingId?: string | null;
  audioUrl: string;
  transcript?: string | null;
  extractedData: VoiceBookingExtractedData;
  status: VoiceRecordingStatus;
  createdAt: Date | string;
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

export interface ScheduleChangeProposal {
  id: string;
  reason: ProposalReason;
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
      oldMachineId?: string;
      newMachineId?: string;
      newMachineName?: string;
      changeReason: string;
    }>;
  };
  status: ProposalStatus;
  createdAt: Date | string;
}

export interface JobDurationTrainingSample {
  id: string;
  machineType: string;
  areaInAcres: number;
  cropType?: string | null;
  location?: string | null;
  season?: string | null;
  actualDurationMinutes: number;
  createdAt: Date | string;
}

export interface OperatorLocation {
  id: string;
  bookingId: string;
  operatorId: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  timestamp: Date | string;
  createdAt: Date | string;
}

export interface FarmerNotification {
  id: string;
  farmerId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedRequestId?: string | null;
  relatedBookingId?: string | null;
  read: boolean;
  createdAt: Date | string;
}

export interface AuthJwtPayload {
  userId: string;
  role: Role;
  name: string;
  email: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ScheduleSlot {
  startTime: string;
  endTime: string;
  score: number;
  reason: string;
  estimatedTravelMinutes?: number;
}
