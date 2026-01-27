import { SoilData, CropRecommendation, FertilizerRecommendation, FertilizerStage } from './types';

// Crop data extracted from the CSV dataset
interface CropDataset {
  label: string;
  n_min: number;
  n_max: number;
  p_min: number;
  p_max: number;
  k_min: number;
  k_max: number;
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
  ph_min: number;
  ph_max: number;
  rainfall_min: number;
  rainfall_max: number;
}

// Aggregated ranges from Crop_recommendation.csv dataset
const cropDatabase: CropDataset[] = [
  { label: 'rice', n_min: 60, n_max: 99, p_min: 35, p_max: 60, k_min: 35, k_max: 45, temp_min: 20, temp_max: 27, humidity_min: 80, humidity_max: 85, ph_min: 5.0, ph_max: 8.0, rainfall_min: 180, rainfall_max: 300 },
  { label: 'maize', n_min: 60, n_max: 100, p_min: 35, p_max: 60, k_min: 15, k_max: 25, temp_min: 18, temp_max: 27, humidity_min: 55, humidity_max: 75, ph_min: 5.5, ph_max: 7.5, rainfall_min: 60, rainfall_max: 110 },
  { label: 'chickpea', n_min: 20, n_max: 60, p_min: 55, p_max: 80, k_min: 75, k_max: 85, temp_min: 17, temp_max: 22, humidity_min: 14, humidity_max: 20, ph_min: 6.5, ph_max: 8.0, rainfall_min: 65, rainfall_max: 95 },
  { label: 'kidneybeans', n_min: 0, n_max: 40, p_min: 55, p_max: 75, k_min: 15, k_max: 25, temp_min: 15, temp_max: 25, humidity_min: 18, humidity_max: 25, ph_min: 5.5, ph_max: 7.0, rainfall_min: 60, rainfall_max: 150 },
  { label: 'pigeonpeas', n_min: 0, n_max: 40, p_min: 55, p_max: 70, k_min: 15, k_max: 25, temp_min: 18, temp_max: 36, humidity_min: 30, humidity_max: 70, ph_min: 4.5, ph_max: 7.5, rainfall_min: 120, rainfall_max: 180 },
  { label: 'mothbeans', n_min: 0, n_max: 40, p_min: 35, p_max: 55, k_min: 15, k_max: 25, temp_min: 24, temp_max: 32, humidity_min: 40, humidity_max: 70, ph_min: 3.5, ph_max: 9.0, rainfall_min: 25, rainfall_max: 70 },
  { label: 'mungbean', n_min: 0, n_max: 40, p_min: 40, p_max: 60, k_min: 15, k_max: 25, temp_min: 27, temp_max: 30, humidity_min: 80, humidity_max: 90, ph_min: 6.0, ph_max: 7.5, rainfall_min: 40, rainfall_max: 60 },
  { label: 'blackgram', n_min: 20, n_max: 50, p_min: 55, p_max: 70, k_min: 15, k_max: 25, temp_min: 25, temp_max: 35, humidity_min: 60, humidity_max: 70, ph_min: 6.0, ph_max: 8.0, rainfall_min: 60, rainfall_max: 80 },
  { label: 'lentil', n_min: 0, n_max: 40, p_min: 55, p_max: 80, k_min: 15, k_max: 25, temp_min: 18, temp_max: 30, humidity_min: 24, humidity_max: 70, ph_min: 5.5, ph_max: 8.0, rainfall_min: 35, rainfall_max: 55 },
  { label: 'pomegranate', n_min: 0, n_max: 40, p_min: 5, p_max: 20, k_min: 35, k_max: 45, temp_min: 18, temp_max: 25, humidity_min: 85, humidity_max: 95, ph_min: 5.5, ph_max: 8.0, rainfall_min: 100, rainfall_max: 120 },
  { label: 'banana', n_min: 80, n_max: 120, p_min: 70, p_max: 85, k_min: 45, k_max: 55, temp_min: 25, temp_max: 30, humidity_min: 75, humidity_max: 85, ph_min: 5.5, ph_max: 7.0, rainfall_min: 90, rainfall_max: 120 },
  { label: 'mango', n_min: 0, n_max: 40, p_min: 15, p_max: 30, k_min: 25, k_max: 40, temp_min: 27, temp_max: 35, humidity_min: 45, humidity_max: 55, ph_min: 4.5, ph_max: 7.0, rainfall_min: 90, rainfall_max: 110 },
  { label: 'grapes', n_min: 0, n_max: 40, p_min: 120, p_max: 145, k_min: 195, k_max: 210, temp_min: 8, temp_max: 43, humidity_min: 80, humidity_max: 85, ph_min: 5.5, ph_max: 7.0, rainfall_min: 65, rainfall_max: 85 },
  { label: 'watermelon', n_min: 80, n_max: 110, p_min: 5, p_max: 20, k_min: 45, k_max: 55, temp_min: 24, temp_max: 28, humidity_min: 80, humidity_max: 90, ph_min: 6.0, ph_max: 7.0, rainfall_min: 45, rainfall_max: 55 },
  { label: 'muskmelon', n_min: 80, n_max: 110, p_min: 5, p_max: 15, k_min: 45, k_max: 55, temp_min: 27, temp_max: 30, humidity_min: 90, humidity_max: 95, ph_min: 6.0, ph_max: 7.0, rainfall_min: 20, rainfall_max: 30 },
  { label: 'apple', n_min: 0, n_max: 40, p_min: 120, p_max: 145, k_min: 195, k_max: 210, temp_min: 21, temp_max: 24, humidity_min: 90, humidity_max: 95, ph_min: 5.5, ph_max: 7.0, rainfall_min: 110, rainfall_max: 130 },
  { label: 'orange', n_min: 0, n_max: 40, p_min: 5, p_max: 15, k_min: 5, k_max: 15, temp_min: 22, temp_max: 35, humidity_min: 90, humidity_max: 95, ph_min: 6.5, ph_max: 7.5, rainfall_min: 100, rainfall_max: 120 },
  { label: 'papaya', n_min: 35, n_max: 65, p_min: 45, p_max: 65, k_min: 45, k_max: 55, temp_min: 33, temp_max: 45, humidity_min: 90, humidity_max: 95, ph_min: 6.5, ph_max: 7.5, rainfall_min: 135, rainfall_max: 160 },
  { label: 'coconut', n_min: 0, n_max: 40, p_min: 5, p_max: 15, k_min: 25, k_max: 35, temp_min: 25, temp_max: 30, humidity_min: 90, humidity_max: 98, ph_min: 5.0, ph_max: 6.5, rainfall_min: 130, rainfall_max: 180 },
  { label: 'cotton', n_min: 100, n_max: 140, p_min: 40, p_max: 55, k_min: 15, k_max: 25, temp_min: 22, temp_max: 27, humidity_min: 75, humidity_max: 85, ph_min: 6.0, ph_max: 8.0, rainfall_min: 60, rainfall_max: 90 },
  { label: 'jute', n_min: 60, n_max: 100, p_min: 35, p_max: 50, k_min: 35, k_max: 45, temp_min: 23, temp_max: 27, humidity_min: 78, humidity_max: 92, ph_min: 6.0, ph_max: 7.5, rainfall_min: 150, rainfall_max: 200 },
  { label: 'coffee', n_min: 80, n_max: 120, p_min: 15, p_max: 30, k_min: 25, k_max: 35, temp_min: 23, temp_max: 28, humidity_min: 55, humidity_max: 70, ph_min: 6.0, ph_max: 7.0, rainfall_min: 140, rainfall_max: 180 },
];

// Fertilizer database from Fertilizer_recommendation.csv
interface FertilizerDataset {
  soilType: string;
  cropType: string;
  nitrogen: number;
  potassium: number;
  phosphorus: number;
  fertilizerName: string;
  temperature: number;
  humidity: number;
  moisture: number;
}

const fertilizerDatabase: FertilizerDataset[] = [
  { temperature: 26, humidity: 52, moisture: 38, soilType: 'Sandy', cropType: 'Maize', nitrogen: 37, potassium: 0, phosphorus: 0, fertilizerName: 'Urea' },
  { temperature: 29, humidity: 52, moisture: 45, soilType: 'Loamy', cropType: 'Sugarcane', nitrogen: 12, potassium: 0, phosphorus: 36, fertilizerName: 'DAP' },
  { temperature: 34, humidity: 65, moisture: 62, soilType: 'Black', cropType: 'Cotton', nitrogen: 7, potassium: 9, phosphorus: 30, fertilizerName: '14-35-14' },
  { temperature: 32, humidity: 62, moisture: 34, soilType: 'Red', cropType: 'Tobacco', nitrogen: 22, potassium: 0, phosphorus: 20, fertilizerName: '28-28' },
  { temperature: 28, humidity: 54, moisture: 46, soilType: 'Clayey', cropType: 'Paddy', nitrogen: 35, potassium: 0, phosphorus: 0, fertilizerName: 'Urea' },
  { temperature: 26, humidity: 52, moisture: 35, soilType: 'Sandy', cropType: 'Barley', nitrogen: 12, potassium: 10, phosphorus: 13, fertilizerName: '17-17-17' },
  { temperature: 25, humidity: 50, moisture: 64, soilType: 'Red', cropType: 'Cotton', nitrogen: 9, potassium: 0, phosphorus: 10, fertilizerName: '20-20' },
  { temperature: 33, humidity: 64, moisture: 50, soilType: 'Loamy', cropType: 'Wheat', nitrogen: 41, potassium: 0, phosphorus: 0, fertilizerName: 'Urea' },
  { temperature: 30, humidity: 60, moisture: 42, soilType: 'Sandy', cropType: 'Millets', nitrogen: 21, potassium: 0, phosphorus: 18, fertilizerName: '28-28' },
  { temperature: 29, humidity: 58, moisture: 33, soilType: 'Black', cropType: 'Oil seeds', nitrogen: 9, potassium: 7, phosphorus: 30, fertilizerName: '14-35-14' },
  { temperature: 27, humidity: 54, moisture: 28, soilType: 'Clayey', cropType: 'Pulses', nitrogen: 13, potassium: 0, phosphorus: 40, fertilizerName: 'DAP' },
  { temperature: 31, humidity: 62, moisture: 48, soilType: 'Sandy', cropType: 'Maize', nitrogen: 14, potassium: 15, phosphorus: 12, fertilizerName: '17-17-17' },
  { temperature: 28, humidity: 54, moisture: 47, soilType: 'Sandy', cropType: 'Barley', nitrogen: 5, potassium: 18, phosphorus: 15, fertilizerName: '10-26-26' },
];

// Calculate similarity score between soil data and crop requirements
function calculateCropScore(soil: SoilData, crop: CropDataset): number {
  let score = 0;
  let maxScore = 0;

  // pH score (weight: 20)
  maxScore += 20;
  if (soil.ph >= crop.ph_min && soil.ph <= crop.ph_max) {
    score += 20;
  } else {
    const phDiff = Math.min(Math.abs(soil.ph - crop.ph_min), Math.abs(soil.ph - crop.ph_max));
    score += Math.max(0, 20 - phDiff * 5);
  }

  // Nitrogen score (weight: 15)
  maxScore += 15;
  if (soil.nitrogen >= crop.n_min && soil.nitrogen <= crop.n_max) {
    score += 15;
  } else {
    const nDiff = Math.min(Math.abs(soil.nitrogen - crop.n_min), Math.abs(soil.nitrogen - crop.n_max));
    score += Math.max(0, 15 - nDiff * 0.3);
  }

  // Phosphorus score (weight: 15)
  maxScore += 15;
  if (soil.phosphorus >= crop.p_min && soil.phosphorus <= crop.p_max) {
    score += 15;
  } else {
    const pDiff = Math.min(Math.abs(soil.phosphorus - crop.p_min), Math.abs(soil.phosphorus - crop.p_max));
    score += Math.max(0, 15 - pDiff * 0.3);
  }

  // Potassium score (weight: 15)
  maxScore += 15;
  if (soil.potassium >= crop.k_min && soil.potassium <= crop.k_max) {
    score += 15;
  } else {
    const kDiff = Math.min(Math.abs(soil.potassium - crop.k_min), Math.abs(soil.potassium - crop.k_max));
    score += Math.max(0, 15 - kDiff * 0.3);
  }

  // Temperature score (weight: 15)
  maxScore += 15;
  if (soil.temperature >= crop.temp_min && soil.temperature <= crop.temp_max) {
    score += 15;
  } else {
    const tempDiff = Math.min(Math.abs(soil.temperature - crop.temp_min), Math.abs(soil.temperature - crop.temp_max));
    score += Math.max(0, 15 - tempDiff * 2);
  }

  // Humidity score (weight: 10)
  maxScore += 10;
  if (soil.humidity >= crop.humidity_min && soil.humidity <= crop.humidity_max) {
    score += 10;
  } else {
    const humDiff = Math.min(Math.abs(soil.humidity - crop.humidity_min), Math.abs(soil.humidity - crop.humidity_max));
    score += Math.max(0, 10 - humDiff * 0.2);
  }

  // Rainfall score (weight: 10)
  maxScore += 10;
  if (soil.rainfall >= crop.rainfall_min && soil.rainfall <= crop.rainfall_max) {
    score += 10;
  } else {
    const rainDiff = Math.min(Math.abs(soil.rainfall - crop.rainfall_min), Math.abs(soil.rainfall - crop.rainfall_max));
    score += Math.max(0, 10 - rainDiff * 0.05);
  }

  return Math.round((score / maxScore) * 100);
}

// Generate reasons for the recommendation
function generateReasons(soil: SoilData, crop: CropDataset): string[] {
  const reasons: string[] = [];

  if (soil.ph >= crop.ph_min && soil.ph <= crop.ph_max) {
    reasons.push(`Optimal pH level (${soil.ph.toFixed(1)}) for ${crop.label}`);
  }

  if (soil.nitrogen >= crop.n_min && soil.nitrogen <= crop.n_max) {
    reasons.push(`Nitrogen levels (${soil.nitrogen} kg/ha) match crop requirements`);
  }

  if (soil.temperature >= crop.temp_min && soil.temperature <= crop.temp_max) {
    reasons.push(`Temperature (${soil.temperature}°C) is within ideal range`);
  }

  if (soil.humidity >= crop.humidity_min && soil.humidity <= crop.humidity_max) {
    reasons.push(`Humidity conditions are suitable`);
  }

  if (soil.rainfall >= crop.rainfall_min && soil.rainfall <= crop.rainfall_max) {
    reasons.push(`Rainfall pattern supports this crop`);
  }

  return reasons.slice(0, 3);
}

// Calculate water needs based on crop and conditions
function getWaterNeeds(crop: CropDataset, soil: SoilData): string {
  const avgRainfall = (crop.rainfall_min + crop.rainfall_max) / 2;
  if (avgRainfall > 150) return 'High';
  if (avgRainfall > 80) return 'Medium';
  return 'Low';
}

// Main function to get crop recommendations
export function getCropRecommendations(soil: SoilData): CropRecommendation[] {
  const recommendations = cropDatabase.map(crop => {
    const matchScore = calculateCropScore(soil, crop);
    const soilCompatibility = Math.min(100, matchScore + Math.random() * 10);
    const seasonSuitability = Math.min(100, matchScore - 5 + Math.random() * 15);
    
    return {
      name: crop.label.charAt(0).toUpperCase() + crop.label.slice(1),
      matchScore,
      soilCompatibility: Math.round(soilCompatibility),
      seasonSuitability: Math.round(seasonSuitability),
      waterNeeds: getWaterNeeds(crop, soil),
      reasons: generateReasons(soil, crop),
    };
  });

  // Sort by match score and return top 5
  return recommendations
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

// Get fertilizer recommendation based on soil and crop
export function getFertilizerRecommendation(soil: SoilData, cropName: string): FertilizerRecommendation {
  // Find matching fertilizer from database
  const cropType = cropName.toLowerCase();
  const soilType = soil.texture || 'Loamy';
  
  // Find best match from fertilizer database
  let bestMatch = fertilizerDatabase.find(
    f => f.cropType.toLowerCase().includes(cropType) || cropType.includes(f.cropType.toLowerCase())
  );

  // If no exact match, find by soil type
  if (!bestMatch) {
    bestMatch = fertilizerDatabase.find(
      f => f.soilType.toLowerCase() === soilType.toLowerCase()
    );
  }

  // Default if no match
  if (!bestMatch) {
    bestMatch = fertilizerDatabase[0];
  }

  // Generate application stages
  const stages: FertilizerStage[] = [
    {
      stage: 'Basal Application',
      fertilizerType: bestMatch.fertilizerName,
      amount: `${Math.round(bestMatch.nitrogen * 0.4)} kg/ha`,
      method: 'Broadcasting before sowing',
      timing: 'At planting',
    },
    {
      stage: 'First Top Dressing',
      fertilizerType: bestMatch.nitrogen > 20 ? 'Urea' : bestMatch.fertilizerName,
      amount: `${Math.round(bestMatch.nitrogen * 0.3)} kg/ha`,
      method: 'Side dressing',
      timing: '3-4 weeks after planting',
    },
    {
      stage: 'Second Top Dressing',
      fertilizerType: bestMatch.phosphorus > 15 ? 'DAP' : bestMatch.fertilizerName,
      amount: `${Math.round(bestMatch.phosphorus * 0.3)} kg/ha`,
      method: 'Foliar spray',
      timing: '6-8 weeks after planting',
    },
    {
      stage: 'Final Application',
      fertilizerType: bestMatch.potassium > 5 ? 'MOP' : bestMatch.fertilizerName,
      amount: `${Math.round((bestMatch.potassium || 10) * 0.3)} kg/ha`,
      method: 'Fertigation',
      timing: 'Before flowering',
    },
  ];

  return {
    crop: cropName,
    fertilizerName: bestMatch.fertilizerName,
    soilType: bestMatch.soilType,
    nitrogen: bestMatch.nitrogen,
    phosphorus: bestMatch.phosphorus,
    potassium: bestMatch.potassium,
    applicationStages: stages,
  };
}

// Simulated OCR function to extract soil data from image
export function simulateOcrExtraction(): SoilData {
  // In production, this would call an actual OCR API
  // For demo, return randomized but realistic values
  return {
    ph: parseFloat((5.5 + Math.random() * 2.5).toFixed(2)),
    nitrogen: Math.round(40 + Math.random() * 60),
    phosphorus: Math.round(30 + Math.random() * 40),
    potassium: Math.round(20 + Math.random() * 30),
    organicCarbon: parseFloat((0.3 + Math.random() * 0.7).toFixed(2)),
    ec: parseFloat((0.2 + Math.random() * 0.6).toFixed(2)),
    moisture: Math.round(25 + Math.random() * 40),
    texture: ['Sandy', 'Loamy', 'Clayey', 'Black', 'Red'][Math.floor(Math.random() * 5)],
    temperature: Math.round(22 + Math.random() * 12),
    humidity: Math.round(50 + Math.random() * 40),
    rainfall: Math.round(80 + Math.random() * 150),
  };
}
