import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  User,
  Machine,
  Booking,
  FarmerRequest,
  VoiceRecording,
  ScheduleChangeProposal,
  JobDurationTrainingSample,
  OperatorLocation,
  FarmerNotification,
  Role,
  BookingStatus
} from '../types/index.js';

export const prisma = new PrismaClient();

let isPrismaConnected = false;

// Check Prisma DB connection on startup
export async function initDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    // Quick test query
    await prisma.user.count();
    isPrismaConnected = true;
    console.log('[Database] Connected successfully to PostgreSQL via Prisma ORM.');
    return true;
  } catch (err: any) {
    isPrismaConnected = false;
    console.warn(
      '[Database] PostgreSQL connection not active or unreachable (' +
        (err?.message || 'unknown error') +
        '). Operating in high-performance in-memory local data store mode.'
    );
    return false;
  }
}

// In-Memory Seed Data Store (ensures full out-of-the-box functionality)
class InMemoryStore {
  users: User[] = [];
  machines: Machine[] = [];
  bookings: Booking[] = [];
  farmerRequests: FarmerRequest[] = [];
  voiceRecordings: VoiceRecording[] = [];
  proposals: ScheduleChangeProposal[] = [];
  trainingSamples: JobDurationTrainingSample[] = [];
  operatorLocations: OperatorLocation[] = [];
  notifications: FarmerNotification[] = [];

  constructor() {
    this.seedDefaultData();
  }

  seedDefaultData() {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Admin@123', salt);
    const managerHash = bcrypt.hashSync('Manager@123', salt);
    const operatorHash = bcrypt.hashSync('Operator@123', salt);
    const farmerHash = bcrypt.hashSync('Farmer@123', salt);

    // Users
    this.users = [
      {
        id: 'usr-admin-1',
        name: 'Sardar Gurpreet Singh',
        email: 'admin@farmfleet.in',
        phone: '9876543210',
        role: 'ADMIN',
        passwordHash: adminHash,
        village: 'Amritsar Central',
        address: 'CHC Hub 1, GT Road, Punjab',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr-manager-1',
        name: 'Ramesh Patel',
        email: 'manager@farmfleet.in',
        phone: '9876543211',
        role: 'CHC_MANAGER',
        passwordHash: managerHash,
        village: 'Khanna Agri Cluster',
        address: 'Custom Hiring Centre Office, Mandi Road',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr-operator-1',
        name: 'Suresh Kumar',
        email: 'operator@farmfleet.in',
        phone: '9876543212',
        role: 'OPERATOR',
        passwordHash: operatorHash,
        village: 'Rampur Kalan',
        address: 'House #42, Main Street',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr-operator-2',
        name: 'Balwinder Singh',
        email: 'balwinder@farmfleet.in',
        phone: '9876543214',
        role: 'OPERATOR',
        passwordHash: operatorHash,
        village: 'Morinda',
        address: 'Village Post Morinda',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr-farmer-1',
        name: 'Rajesh Sharma',
        email: 'farmer@farmfleet.in',
        phone: '9876543213',
        role: 'FARMER',
        passwordHash: farmerHash,
        village: 'Sultanpur',
        address: 'Khasra #214, North Canal Bank',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usr-farmer-2',
        name: 'Harpreet Kaur',
        email: 'harpreet@farmfleet.in',
        phone: '9876543215',
        role: 'FARMER',
        passwordHash: farmerHash,
        village: 'Bhagwanpur',
        address: 'Farm Plot 18B',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Machines
    this.machines = [
      {
        id: 'mac-1',
        name: 'Mahindra 575 DI (50 HP High Torque)',
        type: 'TRACTOR',
        status: 'ACTIVE',
        chclId: 'chc-punjab-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'mac-2',
        name: 'Shaktiman 7ft Heavy Rotavator',
        type: 'ROTAVATOR',
        status: 'ACTIVE',
        chclId: 'chc-punjab-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'mac-3',
        name: 'Super Seeder Combo 11-Tyne',
        type: 'SEEDER',
        status: 'ACTIVE',
        chclId: 'chc-punjab-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'mac-4',
        name: 'Preet 987 Self-Propelled Harvester',
        type: 'HARVESTER',
        status: 'MAINTENANCE',
        chclId: 'chc-punjab-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'mac-5',
        name: 'Mitra Bullet High Pressure Orchard Sprayer',
        type: 'SPRAYER',
        status: 'ACTIVE',
        chclId: 'chc-punjab-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Today timestamps
    const now = new Date();
    const todayMorning = new Date(now);
    todayMorning.setHours(8, 30, 0, 0);

    const todayAfternoon = new Date(now);
    todayAfternoon.setHours(13, 0, 0, 0);

    const todayEvening = new Date(now);
    todayEvening.setHours(16, 30, 0, 0);

    // Bookings
    this.bookings = [
      {
        id: 'bk-101',
        farmerId: 'usr-farmer-1',
        farmer: this.users.find(u => u.id === 'usr-farmer-1'),
        machineId: 'mac-1',
        machine: this.machines.find(m => m.id === 'mac-1'),
        operatorId: 'usr-operator-1',
        operator: this.users.find(u => u.id === 'usr-operator-1'),
        areaInAcres: 5.5,
        cropType: 'Wheat',
        locationVillage: 'Sultanpur',
        locationField: 'North Field 4A',
        locationLandmark: 'Near Water Tank',
        scheduledStart: todayMorning,
        scheduledEnd: new Date(todayMorning.getTime() + 180 * 60000),
        predictedDurationMinutes: 195,
        actualStart: todayMorning,
        actualEnd: null,
        status: 'IN_PROGRESS',
        specialInstructions: 'Deep ploughing needed along irrigation ditch.',
        createdAt: new Date(now.getTime() - 86400000),
        updatedAt: new Date(),
      },
      {
        id: 'bk-102',
        farmerId: 'usr-farmer-2',
        farmer: this.users.find(u => u.id === 'usr-farmer-2'),
        machineId: 'mac-2',
        machine: this.machines.find(m => m.id === 'mac-2'),
        operatorId: 'usr-operator-2',
        operator: this.users.find(u => u.id === 'usr-operator-2'),
        areaInAcres: 3.0,
        cropType: 'Mustard',
        locationVillage: 'Bhagwanpur',
        locationField: 'East Plot 12',
        locationLandmark: 'Beside Primary School',
        scheduledStart: todayAfternoon,
        scheduledEnd: new Date(todayAfternoon.getTime() + 120 * 60000),
        predictedDurationMinutes: 110,
        actualStart: null,
        actualEnd: null,
        status: 'ASSIGNED',
        specialInstructions: 'Fine seedbed pulverization for mustard sowing.',
        createdAt: new Date(now.getTime() - 43200000),
        updatedAt: new Date(),
      },
      {
        id: 'bk-103',
        farmerId: 'usr-farmer-1',
        farmer: this.users.find(u => u.id === 'usr-farmer-1'),
        machineId: 'mac-3',
        machine: this.machines.find(m => m.id === 'mac-3'),
        operatorId: null,
        areaInAcres: 8.0,
        cropType: 'Paddy',
        locationVillage: 'Sultanpur',
        locationField: 'Sector 2 Canal Line',
        locationLandmark: 'Substation Gate',
        scheduledStart: new Date(now.getTime() + 86400000),
        scheduledEnd: new Date(now.getTime() + 86400000 + 240 * 60000),
        predictedDurationMinutes: 240,
        actualStart: null,
        actualEnd: null,
        status: 'APPROVED',
        specialInstructions: 'Direct seeding in moist soil.',
        createdAt: new Date(now.getTime() - 20000000),
        updatedAt: new Date(),
      },
      {
        id: 'bk-104',
        farmerId: 'usr-farmer-2',
        farmer: this.users.find(u => u.id === 'usr-farmer-2'),
        machineId: 'mac-5',
        machine: this.machines.find(m => m.id === 'mac-5'),
        operatorId: 'usr-operator-1',
        operator: this.users.find(u => u.id === 'usr-operator-1'),
        areaInAcres: 2.5,
        cropType: 'Cotton',
        locationVillage: 'Bhagwanpur',
        locationField: 'Plot 7',
        locationLandmark: 'Old Banyan Tree',
        scheduledStart: new Date(now.getTime() - 172800000),
        scheduledEnd: new Date(now.getTime() - 172800000 + 90 * 60000),
        predictedDurationMinutes: 75,
        actualStart: new Date(now.getTime() - 172800000),
        actualEnd: new Date(now.getTime() - 172800000 + 80 * 60000),
        status: 'COMPLETED',
        specialInstructions: 'Bio-pesticide spray for pink bollworm.',
        createdAt: new Date(now.getTime() - 250000000),
        updatedAt: new Date(),
      },
    ];

    // Farmer Requests
    this.farmerRequests = [
      {
        id: 'req-201',
        farmerId: 'usr-farmer-1',
        farmer: this.users.find(u => u.id === 'usr-farmer-1'),
        requestedMachineType: 'HARVESTER',
        areaInAcres: 10.0,
        cropType: 'Paddy',
        preferredDate: new Date(now.getTime() + 172800000),
        locationVillage: 'Sultanpur',
        locationField: 'Block C 10-Acre Plot',
        locationLandmark: 'Near Canal Bridge',
        status: 'PENDING',
        specialInstructions: 'Crop mature; urgent harvesting required before upcoming rainfall.',
        createdAt: new Date(now.getTime() - 10000000),
        updatedAt: new Date(),
      },
      {
        id: 'req-202',
        farmerId: 'usr-farmer-2',
        farmer: this.users.find(u => u.id === 'usr-farmer-2'),
        requestedMachineType: 'ROTAVATOR',
        areaInAcres: 4.5,
        cropType: 'Wheat',
        preferredDate: new Date(now.getTime() + 259200000),
        locationVillage: 'Bhagwanpur',
        locationField: 'West Acreage',
        locationLandmark: 'Opposite Milk Chilling Center',
        status: 'APPROVED',
        specialInstructions: 'Two passes required for fine tilth.',
        createdAt: new Date(now.getTime() - 36000000),
        updatedAt: new Date(),
      },
    ];

    // Operator Locations for Live Tracking (Sultanpur field coordinates: ~30.655, 75.835 Punjab)
    const baseLat = 30.6548;
    const baseLng = 75.8342;
    this.operatorLocations = [
      {
        id: 'loc-1',
        bookingId: 'bk-101',
        operatorId: 'usr-operator-1',
        latitude: baseLat,
        longitude: baseLng,
        speed: 8.5,
        timestamp: new Date(now.getTime() - 180000),
        createdAt: new Date(now.getTime() - 180000),
      },
      {
        id: 'loc-2',
        bookingId: 'bk-101',
        operatorId: 'usr-operator-1',
        latitude: baseLat + 0.0012,
        longitude: baseLng + 0.0008,
        speed: 9.2,
        timestamp: new Date(now.getTime() - 120000),
        createdAt: new Date(now.getTime() - 120000),
      },
      {
        id: 'loc-3',
        bookingId: 'bk-101',
        operatorId: 'usr-operator-1',
        latitude: baseLat + 0.0025,
        longitude: baseLng + 0.0019,
        speed: 7.8,
        timestamp: new Date(now.getTime() - 60000),
        createdAt: new Date(now.getTime() - 60000),
      },
      {
        id: 'loc-4',
        bookingId: 'bk-101',
        operatorId: 'usr-operator-1',
        latitude: baseLat + 0.0031,
        longitude: baseLng + 0.0028,
        speed: 8.0,
        timestamp: now,
        createdAt: now,
      },
    ];

    // Notifications
    this.notifications = [
      {
        id: 'notif-1',
        farmerId: 'usr-farmer-1',
        type: 'JOB_ASSIGNED',
        title: 'Tractor Assigned & On Route',
        message: 'Mahindra 575 DI with Operator Suresh Kumar is active on your North Field 4A.',
        relatedBookingId: 'bk-101',
        read: false,
        createdAt: new Date(now.getTime() - 3600000),
      },
      {
        id: 'notif-2',
        farmerId: 'usr-farmer-1',
        type: 'REQUEST_APPROVED',
        title: 'Request Approved',
        message: 'Your machinery request for Super Seeder on 8 acres has been approved.',
        relatedRequestId: 'req-201',
        read: false,
        createdAt: new Date(now.getTime() - 7200000),
      },
    ];

    // Schedule change proposal (Dynamic Rescheduling demo)
    this.proposals = [
      {
        id: 'prop-501',
        reason: 'BREAKDOWN',
        status: 'PENDING',
        proposedChanges: {
          affectedBookingIds: ['bk-102'],
          details: [
            {
              bookingId: 'bk-102',
              farmerName: 'Harpreet Kaur',
              machineName: 'Shaktiman 7ft Heavy Rotavator',
              oldStart: todayAfternoon.toISOString(),
              oldEnd: new Date(todayAfternoon.getTime() + 120 * 60000).toISOString(),
              newStart: todayEvening.toISOString(),
              newEnd: new Date(todayEvening.getTime() + 120 * 60000).toISOString(),
              newMachineId: 'mac-2',
              newMachineName: 'Shaktiman 7ft Heavy Rotavator (Repaired & Tested)',
              changeReason: 'Hydraulic hose replacement completed at CHC workshop.',
            },
          ],
        },
        createdAt: new Date(now.getTime() - 1800000),
      },
    ];

    // AI Job duration training samples
    this.trainingSamples = [
      { id: 'ts-1', machineType: 'TRACTOR', areaInAcres: 5.0, cropType: 'Wheat', location: 'Sultanpur', season: 'Rabi', actualDurationMinutes: 185, createdAt: new Date() },
      { id: 'ts-2', machineType: 'ROTAVATOR', areaInAcres: 3.0, cropType: 'Mustard', location: 'Bhagwanpur', season: 'Rabi', actualDurationMinutes: 98, createdAt: new Date() },
      { id: 'ts-3', machineType: 'SEEDER', areaInAcres: 8.0, cropType: 'Paddy', location: 'Sultanpur', season: 'Kharif', actualDurationMinutes: 230, createdAt: new Date() },
      { id: 'ts-4', machineType: 'HARVESTER', areaInAcres: 6.0, cropType: 'Wheat', location: 'Morinda', season: 'Rabi', actualDurationMinutes: 210, createdAt: new Date() },
      { id: 'ts-5', machineType: 'SPRAYER', areaInAcres: 4.0, cropType: 'Cotton', location: 'Khanna', season: 'Kharif', actualDurationMinutes: 65, createdAt: new Date() },
    ];
  }
}

export const store = new InMemoryStore();
