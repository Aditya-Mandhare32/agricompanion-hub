export interface SoilData {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicCarbon: number;
  ec: number;
  moisture: number;
  texture: string;
  temperature: number;
  humidity: number;
  rainfall: number;
}

export interface CropRecommendation {
  name: string;
  matchScore: number;
  soilCompatibility: number;
  seasonSuitability: number;
  waterNeeds: string;
  reasons: string[];
}

export interface FertilizerRecommendation {
  crop: string;
  fertilizerName: string;
  soilType: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  applicationStages: FertilizerStage[];
}

export interface FertilizerStage {
  stage: string;
  fertilizerType: string;
  amount: string;
  method: string;
  timing: string;
}

export interface CropEvent {
  id: string;
  cropName: string;
  eventType: 'sowing' | 'fertilizing' | 'irrigation' | 'harvest';
  date: Date;
  notes?: string;
  completed: boolean;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  location: string;
  content: string;
  image?: string;
  timestamp: Date;
  likes: string[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: 'weather' | 'government' | 'market' | 'crops';
  timestamp: Date;
  lang: 'en' | 'hi' | 'mr';
}

export interface User {
  id: string;
  username: string;
  phone: string;
  avatar: string;
  location: string;
  landOwned?: string;
  accountType: 'farmer' | 'agribusiness' | 'student' | 'agronomist';
  language: 'en' | 'hi' | 'mr';
}

export interface Notification {
  id: string;
  type: 'sowing' | 'fertilizing' | 'irrigation' | 'harvest';
  cropName: string;
  message: string;
  date: Date;
  read: boolean;
}
