// Sample crops data with all required fields for calendar and recommendations
export interface SampleCrop {
  id: string;
  name: string;
  image: string;
  optimalPhRange: [number, number];
  nRequirement: 'low' | 'medium' | 'high';
  pRequirement: 'low' | 'medium' | 'high';
  kRequirement: 'low' | 'medium' | 'high';
  seasonMonths: number[]; // 1-12 for Jan-Dec
  waterNeed: 'low' | 'medium' | 'high';
  notes: string;
  color: string; // For calendar display
  growthDurationDays: number;
}

export const sampleCrops: SampleCrop[] = [
  {
    id: 'rice',
    name: 'Rice',
    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400',
    optimalPhRange: [5.5, 7.0],
    nRequirement: 'high',
    pRequirement: 'medium',
    kRequirement: 'medium',
    seasonMonths: [6, 7, 8, 9, 10], // Jun-Oct (Kharif)
    waterNeed: 'high',
    notes: 'Requires standing water; best in clay soils',
    color: '#22c55e', // green-500
    growthDurationDays: 120,
  },
  {
    id: 'wheat',
    name: 'Wheat',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
    optimalPhRange: [6.0, 7.5],
    nRequirement: 'high',
    pRequirement: 'medium',
    kRequirement: 'low',
    seasonMonths: [11, 12, 1, 2, 3], // Nov-Mar (Rabi)
    waterNeed: 'medium',
    notes: 'Cool season crop; avoid waterlogging',
    color: '#eab308', // yellow-500
    growthDurationDays: 110,
  },
  {
    id: 'maize',
    name: 'Maize',
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400',
    optimalPhRange: [5.8, 7.0],
    nRequirement: 'high',
    pRequirement: 'medium',
    kRequirement: 'medium',
    seasonMonths: [6, 7, 8, 9], // Jun-Sep (Kharif)
    waterNeed: 'medium',
    notes: 'Versatile crop; good for intercropping',
    color: '#f59e0b', // amber-500
    growthDurationDays: 95,
  },
  {
    id: 'cotton',
    name: 'Cotton',
    image: 'https://images.unsplash.com/photo-1594897030264-ab7d87efc473?w=400',
    optimalPhRange: [5.8, 8.0],
    nRequirement: 'medium',
    pRequirement: 'medium',
    kRequirement: 'high',
    seasonMonths: [4, 5, 6, 7, 8, 9, 10], // Apr-Oct
    waterNeed: 'medium',
    notes: 'Deep-rooted; drought tolerant once established',
    color: '#f8fafc', // slate-50
    growthDurationDays: 180,
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    image: 'https://images.unsplash.com/photo-1527676320830-e9462e87ec2c?w=400',
    optimalPhRange: [6.0, 7.5],
    nRequirement: 'high',
    pRequirement: 'medium',
    kRequirement: 'high',
    seasonMonths: [2, 3, 10, 11], // Feb-Mar or Oct-Nov planting
    waterNeed: 'high',
    notes: 'Long duration crop; heavy feeder',
    color: '#84cc16', // lime-500
    growthDurationDays: 365,
  },
  {
    id: 'soybean',
    name: 'Soybean',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400',
    optimalPhRange: [6.0, 7.0],
    nRequirement: 'low',
    pRequirement: 'medium',
    kRequirement: 'medium',
    seasonMonths: [6, 7, 8, 9, 10], // Jun-Oct
    waterNeed: 'medium',
    notes: 'Nitrogen-fixing legume; improves soil',
    color: '#a3e635', // lime-400
    growthDurationDays: 100,
  },
  {
    id: 'tomato',
    name: 'Tomato',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
    optimalPhRange: [6.0, 6.8],
    nRequirement: 'medium',
    pRequirement: 'high',
    kRequirement: 'high',
    seasonMonths: [9, 10, 11, 12, 1, 2], // Sep-Feb
    waterNeed: 'medium',
    notes: 'Requires staking; sensitive to frost',
    color: '#ef4444', // red-500
    growthDurationDays: 75,
  },
  {
    id: 'potato',
    name: 'Potato',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82ber?w=400',
    optimalPhRange: [5.5, 6.5],
    nRequirement: 'medium',
    pRequirement: 'high',
    kRequirement: 'high',
    seasonMonths: [10, 11, 12, 1, 2], // Oct-Feb
    waterNeed: 'medium',
    notes: 'Cool weather crop; avoid waterlogging',
    color: '#a16207', // yellow-700
    growthDurationDays: 90,
  },
  {
    id: 'onion',
    name: 'Onion',
    image: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400',
    optimalPhRange: [6.0, 7.0],
    nRequirement: 'medium',
    pRequirement: 'medium',
    kRequirement: 'medium',
    seasonMonths: [10, 11, 12, 1, 2, 3], // Oct-Mar
    waterNeed: 'low',
    notes: 'Shallow roots; needs well-drained soil',
    color: '#c026d3', // fuchsia-600
    growthDurationDays: 120,
  },
  {
    id: 'chickpea',
    name: 'Chickpea',
    image: 'https://images.unsplash.com/photo-1515543904323-835f578ac98c?w=400',
    optimalPhRange: [6.0, 8.0],
    nRequirement: 'low',
    pRequirement: 'medium',
    kRequirement: 'low',
    seasonMonths: [10, 11, 12, 1, 2, 3], // Oct-Mar (Rabi)
    waterNeed: 'low',
    notes: 'Drought tolerant; nitrogen-fixing',
    color: '#d97706', // amber-600
    growthDurationDays: 100,
  },
];

// Crop color palette for visual differentiation
export const cropColorPalette: Record<string, { bg: string; text: string; border: string }> = {
  rice: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  wheat: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  maize: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  cotton: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  sugarcane: { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-300' },
  soybean: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  tomato: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  potato: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  onion: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', border: 'border-fuchsia-300' },
  chickpea: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
};

// Get suggested planting windows based on crop and region
export function getSuggestedPlantingWindow(
  cropId: string,
  region: string = 'Maharashtra'
): { startMonth: number; endMonth: number; suggestion: string } {
  const crop = sampleCrops.find(c => c.id === cropId);
  if (!crop) {
    return { startMonth: 1, endMonth: 12, suggestion: 'Crop not found' };
  }

  // Placeholder logic - in real app, this would use actual climate data
  const regionOffsets: Record<string, number> = {
    'Maharashtra': 0,
    'Punjab': -1,
    'Karnataka': 1,
    'Gujarat': 0,
    'Rajasthan': -1,
    'Tamil Nadu': 2,
    'Uttar Pradesh': 0,
    'Madhya Pradesh': 0,
  };

  const offset = regionOffsets[region] || 0;
  const adjustedMonths = crop.seasonMonths.map(m => {
    let adjusted = m + offset;
    if (adjusted > 12) adjusted -= 12;
    if (adjusted < 1) adjusted += 12;
    return adjusted;
  });

  return {
    startMonth: Math.min(...adjustedMonths),
    endMonth: Math.max(...adjustedMonths),
    suggestion: `Best planting window for ${crop.name} in ${region}: ${getMonthName(Math.min(...adjustedMonths))} to ${getMonthName(Math.max(...adjustedMonths))}`,
  };
}

function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
}

// Export as ICS placeholder
export function exportAsIcs(events: any[]): string {
  // Placeholder implementation
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Agri360//Crop Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${events.map(event => `BEGIN:VEVENT
UID:${event.id}@agri360.com
DTSTART:${formatDateForIcs(new Date(event.date))}
SUMMARY:${event.cropName} - ${event.eventType}
DESCRIPTION:${event.notes || ''}
END:VEVENT`).join('\n')}
END:VCALENDAR`;

  return icsContent;
}

function formatDateForIcs(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
