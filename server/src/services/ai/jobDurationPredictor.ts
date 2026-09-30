import { store } from '../db.js';
import { JobDurationTrainingSample } from '../../types/index.js';

export interface DurationPredictionInput {
  machineType: string;
  areaInAcres: number;
  cropType?: string | null;
  location?: string | null;
  season?: string | null;
}

export interface DurationPredictionResult {
  predictedDurationMinutes: number;
  confidenceScore: number; // 0.0 to 1.0
  breakdown: {
    baseRateMinutesPerAcre: number;
    cropMultiplier: number;
    locationMultiplier: number;
    sampleCountUsed: number;
  };
}

export class JobDurationPredictor {
  // Baseline minutes per acre across standard machinery
  private static baseMinutesPerAcre: Record<string, number> = {
    TRACTOR: 38,
    ROTAVATOR: 32,
    SEEDER: 26,
    HARVESTER: 35,
    SPRAYER: 16,
  };

  // Crop soil resistance and canopy multipliers
  private static cropFactors: Record<string, number> = {
    Wheat: 1.0,
    Paddy: 1.25, // wetter soil, higher traction drag
    Mustard: 0.95,
    Sugarcane: 1.4, // heavy biomass / stubble
    Cotton: 1.1,
    Maize: 1.05,
    Potato: 1.2,
  };

  // Terrain / location multipliers (e.g., clayey canal belts vs sandy loams)
  private static locationFactors: Record<string, number> = {
    Sultanpur: 1.05,
    Bhagwanpur: 0.98,
    Morinda: 1.02,
    Khanna: 1.0,
    Amritsar: 1.08,
  };

  /**
   * Predict duration in minutes with confidence score
   */
  static predict(input: DurationPredictionInput): DurationPredictionResult {
    const machine = (input.machineType || 'TRACTOR').toUpperCase();
    const baseRate = this.baseMinutesPerAcre[machine] || 35;
    const cropMultiplier = input.cropType ? this.cropFactors[input.cropType] || 1.0 : 1.0;
    const locationMultiplier = input.location ? this.locationFactors[input.location] || 1.0 : 1.0;

    // Check historical training samples for empirical calibration
    const matchingSamples = store.trainingSamples.filter(
      s => s.machineType.toUpperCase() === machine
    );

    let historicalCalibration = 1.0;
    let sampleCount = matchingSamples.length;

    if (sampleCount > 0) {
      const avgActualRate =
        matchingSamples.reduce((sum, s) => sum + s.actualDurationMinutes / s.areaInAcres, 0) /
        sampleCount;
      // Blend 70% empirical with 30% baseline
      historicalCalibration = avgActualRate / baseRate;
    }

    const calibratedRate = baseRate * (0.3 + 0.7 * historicalCalibration);
    const rawMinutes = input.areaInAcres * calibratedRate * cropMultiplier * locationMultiplier;

    // Rounded to nearest 5 minutes
    const predictedDurationMinutes = Math.max(15, Math.round(rawMinutes / 5) * 5);

    // Confidence score based on sample richness and field area sanity
    let confidence = 0.85;
    if (sampleCount >= 5) confidence += 0.08;
    if (input.cropType && this.cropFactors[input.cropType]) confidence += 0.04;
    confidence = Math.min(0.98, Math.max(0.65, confidence));

    return {
      predictedDurationMinutes,
      confidenceScore: parseFloat(confidence.toFixed(2)),
      breakdown: {
        baseRateMinutesPerAcre: Math.round(calibratedRate),
        cropMultiplier,
        locationMultiplier,
        sampleCountUsed: sampleCount,
      },
    };
  }

  /**
   * Record actual job duration to continually train and refine model
   */
  static recordActualJobDuration(sample: Omit<JobDurationTrainingSample, 'id' | 'createdAt'>): void {
    const id = `ts-${Date.now()}`;
    store.trainingSamples.push({
      id,
      ...sample,
      createdAt: new Date(),
    });
    console.log(`[JobDurationPredictor] Trained model with new sample (${sample.machineType}, ${sample.areaInAcres}ac -> ${sample.actualDurationMinutes}min)`);
  }
}
