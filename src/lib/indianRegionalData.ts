// Indian regional soil and crop data for soil estimation

export interface RegionalSoilProfile {
  state: string;
  averagePh: number;
  averageNitrogen: number;
  averagePhosphorus: number;
  averagePotassium: number;
  averageOrganicCarbon: number;
  dominantSoilTypes: string[];
  majorCrops: string[];
  rainfall: number; // mm annual
}

export const regionalSoilProfiles: RegionalSoilProfile[] = [
  {
    state: 'Maharashtra',
    averagePh: 7.2,
    averageNitrogen: 180,
    averagePhosphorus: 22,
    averagePotassium: 200,
    averageOrganicCarbon: 0.55,
    dominantSoilTypes: ['Black Cotton', 'Red Laterite', 'Medium Black'],
    majorCrops: ['Cotton', 'Sugarcane', 'Soybean', 'Wheat', 'Onion', 'Grapes'],
    rainfall: 1100,
  },
  {
    state: 'Punjab',
    averagePh: 7.8,
    averageNitrogen: 250,
    averagePhosphorus: 28,
    averagePotassium: 280,
    averageOrganicCarbon: 0.48,
    dominantSoilTypes: ['Alluvial', 'Sandy Loam'],
    majorCrops: ['Wheat', 'Rice', 'Cotton', 'Maize', 'Sugarcane'],
    rainfall: 650,
  },
  {
    state: 'Karnataka',
    averagePh: 6.5,
    averageNitrogen: 165,
    averagePhosphorus: 18,
    averagePotassium: 175,
    averageOrganicCarbon: 0.52,
    dominantSoilTypes: ['Red Sandy', 'Laterite', 'Black Cotton'],
    majorCrops: ['Rice', 'Sugarcane', 'Cotton', 'Coffee', 'Ragi'],
    rainfall: 1350,
  },
  {
    state: 'Gujarat',
    averagePh: 7.5,
    averageNitrogen: 155,
    averagePhosphorus: 20,
    averagePotassium: 220,
    averageOrganicCarbon: 0.45,
    dominantSoilTypes: ['Black Cotton', 'Sandy', 'Alluvial'],
    majorCrops: ['Cotton', 'Groundnut', 'Wheat', 'Cumin', 'Castor'],
    rainfall: 900,
  },
  {
    state: 'Rajasthan',
    averagePh: 8.2,
    averageNitrogen: 120,
    averagePhosphorus: 15,
    averagePotassium: 180,
    averageOrganicCarbon: 0.32,
    dominantSoilTypes: ['Desert Sandy', 'Arid', 'Saline'],
    majorCrops: ['Wheat', 'Mustard', 'Bajra', 'Guar', 'Cumin'],
    rainfall: 450,
  },
  {
    state: 'Tamil Nadu',
    averagePh: 6.8,
    averageNitrogen: 175,
    averagePhosphorus: 24,
    averagePotassium: 195,
    averageOrganicCarbon: 0.58,
    dominantSoilTypes: ['Red Loam', 'Black', 'Coastal Alluvial'],
    majorCrops: ['Rice', 'Sugarcane', 'Banana', 'Coconut', 'Groundnut'],
    rainfall: 950,
  },
  {
    state: 'Uttar Pradesh',
    averagePh: 7.6,
    averageNitrogen: 220,
    averagePhosphorus: 25,
    averagePotassium: 250,
    averageOrganicCarbon: 0.52,
    dominantSoilTypes: ['Alluvial', 'Gangetic Plain'],
    majorCrops: ['Wheat', 'Rice', 'Sugarcane', 'Potato', 'Mustard'],
    rainfall: 1000,
  },
  {
    state: 'Madhya Pradesh',
    averagePh: 7.0,
    averageNitrogen: 195,
    averagePhosphorus: 21,
    averagePotassium: 215,
    averageOrganicCarbon: 0.50,
    dominantSoilTypes: ['Black Cotton', 'Red Yellow', 'Mixed Red Black'],
    majorCrops: ['Soybean', 'Wheat', 'Chickpea', 'Cotton', 'Maize'],
    rainfall: 1150,
  },
];

// Popular crops by region for "crops near you" feature
export const popularCropsByRegion: Record<string, Array<{ name: string; category: string; adoption: number }>> = {
  'Maharashtra': [
    { name: 'Cotton', category: 'Cash Crops', adoption: 85 },
    { name: 'Sugarcane', category: 'Cash Crops', adoption: 78 },
    { name: 'Soybean', category: 'Oilseeds', adoption: 72 },
    { name: 'Onion', category: 'Vegetables', adoption: 68 },
    { name: 'Grapes', category: 'Fruits', adoption: 45 },
    { name: 'Pomegranate', category: 'Fruits', adoption: 38 },
  ],
  'Punjab': [
    { name: 'Wheat', category: 'Cereals', adoption: 92 },
    { name: 'Rice', category: 'Cereals', adoption: 88 },
    { name: 'Cotton', category: 'Cash Crops', adoption: 55 },
    { name: 'Potato', category: 'Vegetables', adoption: 48 },
    { name: 'Maize', category: 'Cereals', adoption: 42 },
  ],
  'Karnataka': [
    { name: 'Rice', category: 'Cereals', adoption: 75 },
    { name: 'Sugarcane', category: 'Cash Crops', adoption: 62 },
    { name: 'Cotton', category: 'Cash Crops', adoption: 58 },
    { name: 'Ragi', category: 'Cereals', adoption: 52 },
    { name: 'Coconut', category: 'Cash Crops', adoption: 48 },
    { name: 'Coffee', category: 'Cash Crops', adoption: 35 },
  ],
  'Gujarat': [
    { name: 'Cotton', category: 'Cash Crops', adoption: 88 },
    { name: 'Groundnut', category: 'Oilseeds', adoption: 72 },
    { name: 'Wheat', category: 'Cereals', adoption: 58 },
    { name: 'Castor', category: 'Oilseeds', adoption: 45 },
    { name: 'Cumin', category: 'Cash Crops', adoption: 38 },
  ],
  'Tamil Nadu': [
    { name: 'Rice', category: 'Cereals', adoption: 82 },
    { name: 'Sugarcane', category: 'Cash Crops', adoption: 68 },
    { name: 'Banana', category: 'Fruits', adoption: 55 },
    { name: 'Coconut', category: 'Cash Crops', adoption: 52 },
    { name: 'Groundnut', category: 'Oilseeds', adoption: 45 },
  ],
  'Uttar Pradesh': [
    { name: 'Wheat', category: 'Cereals', adoption: 90 },
    { name: 'Rice', category: 'Cereals', adoption: 82 },
    { name: 'Sugarcane', category: 'Cash Crops', adoption: 75 },
    { name: 'Potato', category: 'Vegetables', adoption: 62 },
    { name: 'Mustard', category: 'Oilseeds', adoption: 48 },
  ],
  'Madhya Pradesh': [
    { name: 'Soybean', category: 'Oilseeds', adoption: 85 },
    { name: 'Wheat', category: 'Cereals', adoption: 78 },
    { name: 'Chickpea', category: 'Pulses', adoption: 65 },
    { name: 'Cotton', category: 'Cash Crops', adoption: 52 },
    { name: 'Maize', category: 'Cereals', adoption: 45 },
  ],
};

// Crop rotation suggestions
export const cropRotationSuggestions: Record<string, string[]> = {
  'Rice': ['Wheat', 'Mustard', 'Chickpea', 'Lentil'],
  'Wheat': ['Rice', 'Maize', 'Soybean', 'Cotton'],
  'Cotton': ['Wheat', 'Chickpea', 'Groundnut', 'Sorghum'],
  'Sugarcane': ['Rice', 'Wheat', 'Soybean', 'Vegetables'],
  'Soybean': ['Wheat', 'Chickpea', 'Cotton', 'Maize'],
  'Maize': ['Wheat', 'Chickpea', 'Soybean', 'Mustard'],
  'Groundnut': ['Wheat', 'Chickpea', 'Cotton', 'Sorghum'],
  'Chickpea': ['Rice', 'Maize', 'Sorghum', 'Cotton'],
  'Tomato': ['Onion', 'Cabbage', 'Wheat', 'Maize'],
  'Onion': ['Tomato', 'Wheat', 'Soybean', 'Chickpea'],
  'Potato': ['Wheat', 'Maize', 'Mustard', 'Rice'],
};

export function getRegionalProfile(state: string): RegionalSoilProfile | undefined {
  return regionalSoilProfiles.find(p => p.state === state);
}

export function getPopularCrops(state: string): Array<{ name: string; category: string; adoption: number }> {
  return popularCropsByRegion[state] || popularCropsByRegion['Maharashtra'];
}

export function getRotationSuggestions(previousCrop: string): string[] {
  return cropRotationSuggestions[previousCrop] || ['Wheat', 'Rice', 'Maize', 'Soybean'];
}
