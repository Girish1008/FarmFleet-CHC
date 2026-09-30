import axios, { AxiosError } from 'axios';
import {
  User,
  Booking,
  FarmerRequest,
  Machine,
  ScheduleSlot,
  ScheduleChangeProposal,
  Notification,
  VoiceBookingExtractedData,
  TrackingDataResponse,
  ProposalReason,
} from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Bearer token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('farmfleet_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for 401 handling
apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('farmfleet_token');
      localStorage.removeItem('farmfleet_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: async (credentials: { emailOrPhone: string; password: string }) => {
      const res = await apiClient.post<{ token: string; user: User }>('/auth/login', credentials);
      return res.data;
    },
    me: async () => {
      const res = await apiClient.get<{ user: User }>('/auth/me');
      return res.data.user;
    },
  },

  bookings: {
    list: async (params?: {
      status?: string;
      machineId?: string;
      farmerId?: string;
      from?: string;
      to?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const res = await apiClient.get<{
        data: Booking[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>('/bookings', { params });
      return res.data;
    },
    getById: async (id: string) => {
      const res = await apiClient.get<{ data: Booking }>(`/bookings/${id}`);
      return res.data.data;
    },
    create: async (payload: Partial<Booking> & { farmerName?: string; farmerPhone?: string }) => {
      const res = await apiClient.post<{ data: Booking }>('/bookings', payload);
      return res.data.data;
    },
    update: async (id: string, payload: Partial<Booking>) => {
      const res = await apiClient.patch<{ data: Booking }>(`/bookings/${id}`, payload);
      return res.data.data;
    },
    delete: async (id: string) => {
      const res = await apiClient.delete<{ success: boolean; message: string }>(`/bookings/${id}`);
      return res.data;
    },
  },

  voice: {
    process: async (formData: FormData) => {
      const res = await apiClient.post<{
        data: {
          voiceRecordingId: string;
          transcript: string;
          extractedData: VoiceBookingExtractedData;
        };
      }>('/voice-booking/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
    confirm: async (payload: { voiceRecordingId: string; overrides?: Partial<Booking> }) => {
      const res = await apiClient.post<{ data: Booking; message: string }>('/voice-booking/confirm', payload);
      return res.data.data;
    },
    reject: async (payload: { voiceRecordingId: string }) => {
      const res = await apiClient.post<{ success: boolean; message: string }>('/voice-booking/reject', payload);
      return res.data;
    },
  },

  schedule: {
    get: async (params?: { machineId?: string; operatorId?: string; date?: string }) => {
      const res = await apiClient.get<{ data: Booking[] }>('/schedule', { params });
      return res.data.data;
    },
    recommendSlots: async (params: {
      machineId?: string;
      preferredDate: string;
      areaInAcres: number;
      location?: string;
      cropType?: string;
    }) => {
      const res = await apiClient.get<{ data: ScheduleSlot[] }>('/schedule/recommend-slots', { params });
      return res.data.data;
    },
    listProposals: async () => {
      const res = await apiClient.get<{ data: ScheduleChangeProposal[] }>('/schedule/proposals');
      return res.data.data;
    },
    proposeReschedule: async (payload: { reason: ProposalReason; scope?: any }) => {
      const res = await apiClient.post<{ data: ScheduleChangeProposal; message: string }>(
        '/schedule/propose-reschedule',
        payload
      );
      return res.data.data;
    },
    acceptReschedule: async (payload: { proposalId: string }) => {
      const res = await apiClient.post<{ success: boolean; message: string }>(
        '/schedule/accept-reschedule',
        payload
      );
      return res.data;
    },
    rejectReschedule: async (payload: { proposalId: string }) => {
      const res = await apiClient.post<{ success: boolean; message: string }>(
        '/schedule/reject-reschedule',
        payload
      );
      return res.data;
    },
  },

  ai: {
    predictDuration: async (payload: {
      machineType: string;
      areaInAcres: number;
      cropType?: string;
      location?: string;
      season?: string;
    }) => {
      const res = await apiClient.post<{
        data: {
          predictedDurationMinutes: number;
          confidenceScore: number;
          breakdown: any;
        };
      }>('/ai/predict-duration', payload);
      return res.data.data;
    },
  },

  farmer: {
    getRequests: async (params?: { status?: string; from?: string; to?: string }) => {
      const res = await apiClient.get<{ data: FarmerRequest[] }>('/farmer/requests', { params });
      return res.data.data;
    },
    createRequest: async (payload: Partial<FarmerRequest>) => {
      const res = await apiClient.post<{ data: FarmerRequest; message: string }>('/farmer/requests', payload);
      return res.data.data;
    },
    getRequestById: async (id: string) => {
      const res = await apiClient.get<{ data: FarmerRequest }>(`/farmer/requests/${id}`);
      return res.data.data;
    },
    getBookings: async () => {
      const res = await apiClient.get<{ data: Booking[] }>('/farmer/bookings');
      return res.data.data;
    },
    getBookingById: async (id: string) => {
      const res = await apiClient.get<{ data: Booking }>(`/farmer/bookings/${id}`);
      return res.data.data;
    },
    cancelBooking: async (id: string) => {
      const res = await apiClient.post<{ success: boolean; message: string }>(`/farmer/bookings/${id}/cancel`);
      return res.data;
    },
    getNotifications: async (params?: { unreadOnly?: boolean }) => {
      const res = await apiClient.get<{ data: Notification[]; unreadCount: number }>('/farmer/notifications', {
        params: { unreadOnly: params?.unreadOnly ? 'true' : undefined },
      });
      return res.data;
    },
    markNotificationRead: async (id: string) => {
      const res = await apiClient.patch<{ success: boolean; data: Notification }>(
        `/farmer/notifications/${id}/read`
      );
      return res.data.data;
    },
  },

  operator: {
    getTasks: async () => {
      const res = await apiClient.get<{ data: Booking[] }>('/operator/tasks');
      return res.data.data;
    },
    updateTask: async (id: string, payload: { status: string }) => {
      const res = await apiClient.patch<{ data: Booking; message: string }>(`/operator/tasks/${id}`, payload);
      return res.data.data;
    },
    getActiveJob: async () => {
      const res = await apiClient.get<{ data: Booking | null }>('/operator/active-job');
      return res.data.data;
    },
    recordLocation: async (payload: {
      bookingId: string;
      latitude: number;
      longitude: number;
      speed?: number;
      timestamp?: string;
    }) => {
      const res = await apiClient.post<{ data: any; message: string }>('/operator/location', payload);
      return res.data.data;
    },
  },

  tracking: {
    getBookingTracking: async (bookingId: string) => {
      const res = await apiClient.get<{ data: TrackingDataResponse }>(`/chc/tracking/${bookingId}`);
      return res.data.data;
    },
  },

  machines: {
    list: async (params?: { type?: string; status?: string }) => {
      const res = await apiClient.get<{ data: Machine[] }>('/machines', { params });
      return res.data.data;
    },
    create: async (payload: Partial<Machine>) => {
      const res = await apiClient.post<{ data: Machine }>('/machines', payload);
      return res.data.data;
    },
    update: async (id: string, payload: Partial<Machine>) => {
      const res = await apiClient.patch<{ data: Machine }>(`/machines/${id}`, payload);
      return res.data.data;
    },
  },

  users: {
    list: async (params?: { role?: string }) => {
      const res = await apiClient.get<{ data: User[] }>('/users', { params });
      return res.data.data;
    },
  },
};
