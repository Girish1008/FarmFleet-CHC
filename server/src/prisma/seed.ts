import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FarmFleet Prisma Database Seeding...');

  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Admin@123', salt);
  const managerHash = bcrypt.hashSync('Manager@123', salt);
  const operatorHash = bcrypt.hashSync('Operator@123', salt);
  const farmerHash = bcrypt.hashSync('Farmer@123', salt);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@farmfleet.in' },
    update: {},
    create: {
      name: 'Sardar Gurpreet Singh',
      email: 'admin@farmfleet.in',
      phone: '9876543210',
      role: 'ADMIN',
      passwordHash: adminHash,
      village: 'Amritsar Central',
      address: 'CHC Hub 1, GT Road, Punjab',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@farmfleet.in' },
    update: {},
    create: {
      name: 'Ramesh Patel',
      email: 'manager@farmfleet.in',
      phone: '9876543211',
      role: 'CHC_MANAGER',
      passwordHash: managerHash,
      village: 'Khanna Agri Cluster',
      address: 'Custom Hiring Centre Office, Mandi Road',
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@farmfleet.in' },
    update: {},
    create: {
      name: 'Suresh Kumar',
      email: 'operator@farmfleet.in',
      phone: '9876543212',
      role: 'OPERATOR',
      passwordHash: operatorHash,
      village: 'Rampur Kalan',
      address: 'House #42, Main Street',
    },
  });

  const farmer = await prisma.user.upsert({
    where: { email: 'farmer@farmfleet.in' },
    update: {},
    create: {
      name: 'Rajesh Sharma',
      email: 'farmer@farmfleet.in',
      phone: '9876543213',
      role: 'FARMER',
      passwordHash: farmerHash,
      village: 'Sultanpur',
      address: 'Khasra #214, North Canal Bank',
    },
  });

  // Machines
  const tractor = await prisma.machine.create({
    data: {
      name: 'Mahindra 575 DI (50 HP High Torque)',
      type: 'TRACTOR',
      status: 'ACTIVE',
      chclId: 'chc-punjab-01',
    },
  });

  const rotavator = await prisma.machine.create({
    data: {
      name: 'Shaktiman 7ft Heavy Rotavator',
      type: 'ROTAVATOR',
      status: 'ACTIVE',
      chclId: 'chc-punjab-01',
    },
  });

  const seeder = await prisma.machine.create({
    data: {
      name: 'Super Seeder Combo 11-Tyne',
      type: 'SEEDER',
      status: 'ACTIVE',
      chclId: 'chc-punjab-01',
    },
  });

  // Bookings
  const today = new Date();
  const startTime = new Date(today);
  startTime.setHours(9, 0, 0, 0);
  const endTime = new Date(today);
  endTime.setHours(12, 0, 0, 0);

  const booking = await prisma.booking.create({
    data: {
      farmerId: farmer.id,
      machineId: tractor.id,
      operatorId: operator.id,
      areaInAcres: 5.5,
      cropType: 'Wheat',
      locationVillage: 'Sultanpur',
      locationField: 'North Field 4A',
      locationLandmark: 'Near Water Tank',
      scheduledStart: startTime,
      scheduledEnd: endTime,
      predictedDurationMinutes: 180,
      actualStart: startTime,
      status: 'IN_PROGRESS',
      specialInstructions: 'Deep ploughing for wheat sowing along canal line',
    },
  });

  // Operator Location Tracking
  await prisma.operatorLocation.create({
    data: {
      bookingId: booking.id,
      operatorId: operator.id,
      latitude: 30.6548,
      longitude: 75.8342,
      speed: 8.5,
      timestamp: new Date(),
    },
  });

  // Farmer Request
  await prisma.farmerRequest.create({
    data: {
      farmerId: farmer.id,
      requestedMachineType: 'SEEDER',
      areaInAcres: 8.0,
      cropType: 'Wheat',
      preferredDate: new Date(today.getTime() + 86400000),
      locationVillage: 'Sultanpur',
      locationField: 'Canal Acreage 2',
      status: 'PENDING',
      specialInstructions: 'Direct seeding after laser leveling',
    },
  });

  // Farmer Notification
  await prisma.farmerNotification.create({
    data: {
      farmerId: farmer.id,
      type: 'JOB_ASSIGNED',
      title: 'Tractor Assigned & En Route',
      message: 'Mahindra 575 DI with Operator Suresh Kumar is active on your North Field 4A.',
      relatedBookingId: booking.id,
      read: false,
    },
  });

  console.log('✅ Seed completed successfully with demo users, machines, and live bookings!');
}

main()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
