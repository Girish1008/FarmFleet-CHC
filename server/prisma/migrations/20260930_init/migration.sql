-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CHC_MANAGER', 'OPERATOR', 'FARMER');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'BROKEN');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VoiceRecordingStatus" AS ENUM ('PROCESSING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProposalReason" AS ENUM ('BREAKDOWN', 'DELAY', 'CANCELLATION', 'URGENT_JOB');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REQUEST_APPROVED', 'JOB_ASSIGNED', 'JOB_SCHEDULED', 'JOB_RESCHEDULED', 'JOB_COMPLETED', 'JOB_CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'FARMER',
    "passwordHash" TEXT NOT NULL,
    "village" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "MachineStatus" NOT NULL DEFAULT 'ACTIVE',
    "chclId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "operatorId" TEXT,
    "areaInAcres" DOUBLE PRECISION NOT NULL,
    "cropType" TEXT,
    "locationVillage" TEXT NOT NULL,
    "locationField" TEXT,
    "locationLandmark" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "predictedDurationMinutes" INTEGER,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "specialInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmer_requests" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "requestedMachineType" TEXT NOT NULL,
    "areaInAcres" DOUBLE PRECISION NOT NULL,
    "cropType" TEXT,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "locationVillage" TEXT NOT NULL,
    "locationField" TEXT,
    "locationLandmark" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "specialInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_recordings" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "audioUrl" TEXT NOT NULL,
    "transcript" TEXT,
    "extractedData" JSONB NOT NULL,
    "status" "VoiceRecordingStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_change_proposals" (
    "id" TEXT NOT NULL,
    "reason" "ProposalReason" NOT NULL,
    "proposedChanges" JSONB NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_change_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_duration_training_samples" (
    "id" TEXT NOT NULL,
    "machineType" TEXT NOT NULL,
    "areaInAcres" DOUBLE PRECISION NOT NULL,
    "cropType" TEXT,
    "location" TEXT,
    "season" TEXT,
    "actualDurationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_duration_training_samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_locations" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmer_notifications" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedRequestId" TEXT,
    "relatedBookingId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmer_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "operator_locations_bookingId_timestamp_idx" ON "operator_locations"("bookingId", "timestamp");

-- CreateIndex
CREATE INDEX "operator_locations_operatorId_timestamp_idx" ON "operator_locations"("operatorId", "timestamp");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_requests" ADD CONSTRAINT "farmer_requests_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_recordings" ADD CONSTRAINT "voice_recordings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_locations" ADD CONSTRAINT "operator_locations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_locations" ADD CONSTRAINT "operator_locations_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_notifications" ADD CONSTRAINT "farmer_notifications_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
