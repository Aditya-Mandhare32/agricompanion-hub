import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SoilData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  MapPin,
  Droplets,
  Palette,
  Sprout,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Info,
  Sparkles
} from 'lucide-react';

interface SoilEstimationModeProps {
  language: string;
  onEstimationComplete: (soilData: SoilData) => void;
  onCancel: () => void;
}

// Indian states with districts
const statesWithDistricts: Record<string, string[]> = {
  'Maharashtra': ['Pune', 'Nashik', 'Nagpur', 'Aurangabad', 'Solapur', 'Kolhapur', 'Sangli', 'Satara', 'Ahmednagar'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Firozpur'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangalore', 'Belagavi', 'Davangere', 'Bellary'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Ghaziabad'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Rewa'],
  'Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Karnal', 'Panipat', 'Ambala', 'Hisar', 'Rohtak'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga'],
};

// Regional soil baselines based on geography
const regionalSoilData: Record<string, Partial<SoilData>> = {
  'Maharashtra': { ph: 7.2, nitrogen: 180, phosphorus: 22, potassium: 200, organicCarbon: 0.55, texture: 'clay' },
  'Punjab': { ph: 7.8, nitrogen: 250, phosphorus: 28, potassium: 280, organicCarbon: 0.48, texture: 'loamy' },
  'Karnataka': { ph: 6.5, nitrogen: 165, phosphorus: 18, potassium: 175, organicCarbon: 0.52, texture: 'sandy loam' },
  'Gujarat': { ph: 7.5, nitrogen: 155, phosphorus: 20, potassium: 220, organicCarbon: 0.45, texture: 'clay loam' },
  'Rajasthan': { ph: 8.2, nitrogen: 120, phosphorus: 15, potassium: 180, organicCarbon: 0.32, texture: 'sandy' },
  'Tamil Nadu': { ph: 6.8, nitrogen: 175, phosphorus: 24, potassium: 195, organicCarbon: 0.58, texture: 'red loam' },
  'Uttar Pradesh': { ph: 7.6, nitrogen: 220, phosphorus: 25, potassium: 250, organicCarbon: 0.52, texture: 'alluvial' },
  'Madhya Pradesh': { ph: 7.0, nitrogen: 195, phosphorus: 21, potassium: 215, organicCarbon: 0.50, texture: 'black cotton' },
  'Andhra Pradesh': { ph: 6.9, nitrogen: 170, phosphorus: 19, potassium: 185, organicCarbon: 0.48, texture: 'red sandy' },
  'West Bengal': { ph: 6.2, nitrogen: 230, phosphorus: 26, potassium: 190, organicCarbon: 0.62, texture: 'alluvial' },
  'Haryana': { ph: 7.9, nitrogen: 200, phosphorus: 22, potassium: 240, organicCarbon: 0.42, texture: 'loamy' },
  'Bihar': { ph: 7.1, nitrogen: 210, phosphorus: 23, potassium: 200, organicCarbon: 0.55, texture: 'alluvial' },
};

const soilColors = [
  { value: 'black', label: 'Black (काली)', labelMr: 'काळी' },
  { value: 'red', label: 'Red (लाल)', labelMr: 'लाल' },
  { value: 'brown', label: 'Brown (भूरी)', labelMr: 'तपकिरी' },
  { value: 'yellow', label: 'Yellow (पीली)', labelMr: 'पिवळी' },
  { value: 'grey', label: 'Grey (धूसर)', labelMr: 'राखाडी' },
];

const soilTextures = [
  { value: 'sticky', label: 'Sticky (चिपचिपी)', labelMr: 'चिकट' },
  { value: 'soft', label: 'Soft (मुलायम)', labelMr: 'मऊ' },
  { value: 'sandy', label: 'Sandy (रेतीली)', labelMr: 'वाळूक' },
  { value: 'gritty', label: 'Gritty (दानेदार)', labelMr: 'खरखरीत' },
];

const waterRetentions = [
  { value: 'high', label: 'High - Water stays long (पानी देर तक रहता है)', labelMr: 'जास्त - पाणी बराच वेळ राहतं' },
  { value: 'medium', label: 'Medium - Normal drainage (सामान्य)', labelMr: 'मध्यम - साधारण निचरा' },
  { value: 'low', label: 'Low - Drains quickly (जल्दी सूख जाती है)', labelMr: 'कमी - लवकर निघून जातं' },
];

const previousCrops = [
  'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Groundnut', 
  'Tomato', 'Onion', 'Potato', 'Chickpea', 'Mustard', 'None/Fallow'
];

const fertilizerUsages = [
  { value: 'low', label: 'Low - Rarely use fertilizer', labelHi: 'कम - कभी-कभी', labelMr: 'कमी - क्वचित' },
  { value: 'medium', label: 'Medium - Regular use', labelHi: 'सामान्य - नियमित', labelMr: 'मध्यम - नियमित' },
  { value: 'high', label: 'High - Heavy fertilizer use', labelHi: 'अधिक - भारी उपयोग', labelMr: 'जास्त - भरपूर वापर' },
];

export function SoilEstimationMode({ language, onEstimationComplete, onCancel }: SoilEstimationModeProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isEstimating, setIsEstimating] = useState(false);
  
  // Location data
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  
  // Soil observations
  const [soilColor, setSoilColor] = useState('');
  const [soilTexture, setSoilTexture] = useState('');
  const [waterRetention, setWaterRetention] = useState('');
  const [previousCrop, setPreviousCrop] = useState('');
  const [irrigationAvailable, setIrrigationAvailable] = useState<boolean | null>(null);
  const [fertilizerUsage, setFertilizerUsage] = useState('');

  const t = (en: string, hi: string, mr: string) => {
    if (language === 'hi') return hi;
    if (language === 'mr') return mr;
    return en;
  };

  const estimateSoilData = async () => {
    setIsEstimating(true);
    
    try {
      // Get base regional data
      const baseData = regionalSoilData[state] || regionalSoilData['Maharashtra'];
      
      // Adjust based on farmer inputs
      let phAdjustment = 0;
      let nitrogenAdjustment = 0;
      let phosphorusAdjustment = 0;
      let potassiumAdjustment = 0;
      let organicCarbonAdjustment = 0;
      
      // Color-based adjustments
      if (soilColor === 'black') {
        organicCarbonAdjustment += 0.15;
        nitrogenAdjustment += 25;
      } else if (soilColor === 'red') {
        phAdjustment -= 0.3;
        phosphorusAdjustment -= 5;
      } else if (soilColor === 'yellow') {
        organicCarbonAdjustment -= 0.1;
      }
      
      // Texture-based adjustments
      if (soilTexture === 'sticky') {
        potassiumAdjustment += 30;
      } else if (soilTexture === 'sandy') {
        potassiumAdjustment -= 20;
        nitrogenAdjustment -= 30;
      }
      
      // Water retention adjustments
      if (waterRetention === 'high') {
        organicCarbonAdjustment += 0.08;
      } else if (waterRetention === 'low') {
        organicCarbonAdjustment -= 0.08;
        nitrogenAdjustment -= 15;
      }
      
      // Previous crop adjustments
      if (previousCrop === 'Chickpea' || previousCrop === 'Soybean' || previousCrop === 'Groundnut') {
        nitrogenAdjustment += 35; // Legumes fix nitrogen
      } else if (previousCrop === 'Rice' || previousCrop === 'Sugarcane') {
        nitrogenAdjustment -= 20; // Heavy feeders
      }
      
      // Fertilizer usage adjustments
      if (fertilizerUsage === 'high') {
        nitrogenAdjustment += 40;
        phosphorusAdjustment += 10;
        potassiumAdjustment += 20;
      } else if (fertilizerUsage === 'low') {
        nitrogenAdjustment -= 20;
      }
      
      // Calculate estimated values
      const estimatedPh = Math.max(4, Math.min(9, (baseData.ph || 7) + phAdjustment));
      const estimatedNitrogen = Math.max(50, (baseData.nitrogen || 150) + nitrogenAdjustment);
      const estimatedPhosphorus = Math.max(5, (baseData.phosphorus || 20) + phosphorusAdjustment);
      const estimatedPotassium = Math.max(50, (baseData.potassium || 180) + potassiumAdjustment);
      const estimatedOrganicCarbon = Math.max(0.2, Math.min(2, (baseData.organicCarbon || 0.5) + organicCarbonAdjustment));
      
      // Determine soil type
      let estimatedSoilType = baseData.texture || 'loamy';
      if (soilColor === 'black' && soilTexture === 'sticky') {
        estimatedSoilType = 'Black Cotton (Regur)';
      } else if (soilColor === 'red' && soilTexture === 'sandy') {
        estimatedSoilType = 'Red Sandy';
      } else if (soilTexture === 'sandy') {
        estimatedSoilType = 'Sandy';
      } else if (soilTexture === 'sticky') {
        estimatedSoilType = 'Clay';
      }
      
      const estimatedSoilData: SoilData = {
        ph: Number(estimatedPh.toFixed(1)),
        nitrogen: Math.round(estimatedNitrogen),
        phosphorus: Math.round(estimatedPhosphorus),
        potassium: Math.round(estimatedPotassium),
        organicCarbon: Number(estimatedOrganicCarbon.toFixed(2)),
        ec: 0.4, // Default EC
        moisture: waterRetention === 'high' ? 35 : waterRetention === 'low' ? 15 : 25,
        texture: estimatedSoilType,
        temperature: 28, // Average
        humidity: 60,
        rainfall: 800, // Will be refined by AI
      };
      
      // Save to database if user is logged in
      if (user) {
        await supabase.from('estimated_soil_profiles').insert({
          user_id: user.id,
          state,
          district,
          village: village || null,
          soil_color: soilColor,
          soil_texture: soilTexture,
          water_retention: waterRetention,
          previous_crop: previousCrop,
          irrigation_available: irrigationAvailable,
          fertilizer_usage: fertilizerUsage,
          estimated_ph: estimatedPh,
          estimated_nitrogen: estimatedNitrogen,
          estimated_phosphorus: estimatedPhosphorus,
          estimated_potassium: estimatedPotassium,
          estimated_organic_carbon: estimatedOrganicCarbon,
          estimated_soil_type: estimatedSoilType,
        });
      }
      
      toast.success(t(
        'Soil estimation complete!',
        'मिट्टी का अनुमान पूर्ण!',
        'मातीचा अंदाज पूर्ण!'
      ));
      
      onEstimationComplete(estimatedSoilData);
    } catch (error) {
      console.error('Estimation error:', error);
      toast.error(t('Estimation failed', 'अनुमान विफल', 'अंदाज अयशस्वी'));
    } finally {
      setIsEstimating(false);
    }
  };

  const canProceedStep1 = state && district;
  const canProceedStep2 = soilColor && soilTexture && waterRetention;
  const canEstimate = previousCrop && fertilizerUsage && irrigationAvailable !== null;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-0.5 mx-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Location */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {t('Step 1: Your Location', 'चरण 1: आपका स्थान', 'चरण 1: तुमचे स्थान')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {t(
                  'We use your location to load average soil data for your region as a starting point.',
                  'हम आपके क्षेत्र के औसत मिट्टी डेटा को लोड करने के लिए आपके स्थान का उपयोग करते हैं।',
                  'तुमच्या प्रदेशातील सरासरी माती डेटा लोड करण्यासाठी आम्ही तुमचे स्थान वापरतो.'
                )}
              </p>
            </div>
            
            <div className="grid gap-4">
              <div>
                <Label>{t('State', 'राज्य', 'राज्य')} *</Label>
                <Select value={state} onValueChange={(v) => { setState(v); setDistrict(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select State', 'राज्य चुनें', 'राज्य निवडा')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(statesWithDistricts).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>{t('District', 'जिला', 'जिल्हा')} *</Label>
                <Select value={district} onValueChange={setDistrict} disabled={!state}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select District', 'जिला चुनें', 'जिल्हा निवडा')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(statesWithDistricts[state] || []).map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>{t('Village/Town (Optional)', 'गांव/शहर (वैकल्पिक)', 'गाव/शहर (पर्यायी)')}</Label>
                <Input 
                  value={village} 
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder={t('Enter village or town name', 'गांव या शहर का नाम दर्ज करें', 'गाव किंवा शहराचे नाव टाका')}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={onCancel}>
                {t('Cancel', 'रद्द करें', 'रद्द करा')}
              </Button>
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                {t('Next', 'अगला', 'पुढे')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Soil Observations */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              {t('Step 2: Soil Observations', 'चरण 2: मिट्टी का निरीक्षण', 'चरण 2: मातीचे निरीक्षण')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('Soil Color', 'मिट्टी का रंग', 'मातीचा रंग')} *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {soilColors.map((color) => (
                  <Badge
                    key={color.value}
                    variant={soilColor === color.value ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => setSoilColor(color.value)}
                  >
                    {language === 'mr' ? color.labelMr : color.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>{t('Soil Texture (Feel)', 'मिट्टी की बनावट (अहसास)', 'मातीचा पोत (स्पर्श)')} *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {soilTextures.map((texture) => (
                  <Badge
                    key={texture.value}
                    variant={soilTexture === texture.value ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => setSoilTexture(texture.value)}
                  >
                    {language === 'mr' ? texture.labelMr : texture.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                {t('Water Retention', 'पानी धारण क्षमता', 'पाणी धारण क्षमता')} *
              </Label>
              <Select value={waterRetention} onValueChange={setWaterRetention}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={t('How long does water stay?', 'पानी कितनी देर रहता है?', 'पाणी किती वेळ राहतं?')} />
                </SelectTrigger>
                <SelectContent>
                  {waterRetentions.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {language === 'mr' ? w.labelMr : w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('Back', 'पीछे', 'मागे')}
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
                {t('Next', 'अगला', 'पुढे')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Farming History */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              {t('Step 3: Farming History', 'चरण 3: खेती का इतिहास', 'चरण 3: शेतीचा इतिहास')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('Previous Crop Grown', 'पिछली फसल', 'मागील पीक')} *</Label>
              <Select value={previousCrop} onValueChange={setPreviousCrop}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={t('What did you grow last?', 'आखिरी बार क्या उगाया?', 'शेवटचे काय पिकवले?')} />
                </SelectTrigger>
                <SelectContent>
                  {previousCrops.map((crop) => (
                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('Irrigation Available?', 'सिंचाई उपलब्ध?', 'सिंचन उपलब्ध?')} *</Label>
              <div className="flex gap-3 mt-2">
                <Badge
                  variant={irrigationAvailable === true ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2"
                  onClick={() => setIrrigationAvailable(true)}
                >
                  {t('Yes', 'हां', 'हो')}
                </Badge>
                <Badge
                  variant={irrigationAvailable === false ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2"
                  onClick={() => setIrrigationAvailable(false)}
                >
                  {t('No (Rainfed)', 'नहीं (वर्षा आधारित)', 'नाही (पावसाचे पाणी)')}
                </Badge>
              </div>
            </div>

            <div>
              <Label>{t('Fertilizer Usage', 'उर्वरक उपयोग', 'खत वापर')} *</Label>
              <Select value={fertilizerUsage} onValueChange={setFertilizerUsage}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={t('How much fertilizer do you use?', 'कितना उर्वरक उपयोग करते हैं?', 'किती खत वापरता?')} />
                </SelectTrigger>
                <SelectContent>
                  {fertilizerUsages.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {language === 'hi' ? f.labelHi : language === 'mr' ? f.labelMr : f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('Back', 'पीछे', 'मागे')}
              </Button>
              <Button 
                onClick={estimateSoilData} 
                disabled={!canEstimate || isEstimating}
                className="bg-primary"
              >
                {isEstimating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('Estimating...', 'अनुमान लगा रहे...', 'अंदाज लावत आहे...')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('Estimate My Soil', 'मेरी मिट्टी का अनुमान', 'माझ्या मातीचा अंदाज')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
