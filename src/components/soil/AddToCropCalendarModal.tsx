import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { sampleCrops, cropColorPalette } from '@/lib/sampleCrops';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import {
  Calendar,
  Sprout,
  Droplets,
  Scissors,
  Loader2,
  CheckCircle,
  AlertCircle,
  Leaf
} from 'lucide-react';

interface CropRecommendation {
  crop: string;
  suitability: string;
  expectedYield: string;
  confidence: number;
  category?: string;
}

interface AddToCropCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: CropRecommendation[];
  language: string;
}

const cropCategories: Record<string, string> = {
  'rice': 'Cereals',
  'wheat': 'Cereals',
  'maize': 'Cereals',
  'cotton': 'Cash Crops',
  'sugarcane': 'Cash Crops',
  'soybean': 'Oilseeds',
  'groundnut': 'Oilseeds',
  'mustard': 'Oilseeds',
  'tomato': 'Vegetables',
  'potato': 'Vegetables',
  'onion': 'Vegetables',
  'chickpea': 'Pulses',
  'lentil': 'Pulses',
  'mango': 'Fruits',
  'banana': 'Fruits',
  'grapes': 'Fruits',
  'marigold': 'Flowers',
  'rose': 'Flowers',
  'sorghum': 'Fodder',
  'bajra': 'Fodder',
};

const categoryColors: Record<string, string> = {
  'Cereals': 'bg-amber-100 text-amber-800 border-amber-300',
  'Cash Crops': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Oilseeds': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Vegetables': 'bg-green-100 text-green-800 border-green-300',
  'Pulses': 'bg-orange-100 text-orange-800 border-orange-300',
  'Fruits': 'bg-pink-100 text-pink-800 border-pink-300',
  'Flowers': 'bg-purple-100 text-purple-800 border-purple-300',
  'Fodder': 'bg-lime-100 text-lime-800 border-lime-300',
};

export function AddToCropCalendarModal({ 
  isOpen, 
  onClose, 
  recommendations, 
  language 
}: AddToCropCalendarModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'select' | 'details' | 'success'>('select');
  const [selectedCrop, setSelectedCrop] = useState<CropRecommendation | null>(null);
  const [sowingDate, setSowingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fieldName, setFieldName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const t = (en: string, hi: string, mr: string) => {
    if (language === 'hi') return hi;
    if (language === 'mr') return mr;
    return en;
  };

  // Find crop data from sampleCrops
  const getCropData = (cropName: string) => {
    return sampleCrops.find(c => 
      c.name.toLowerCase() === cropName.toLowerCase() ||
      c.id.toLowerCase() === cropName.toLowerCase()
    );
  };

  const getCropCategory = (cropName: string): string => {
    const lowerName = cropName.toLowerCase();
    return cropCategories[lowerName] || 'Other';
  };

  const handleCropSelect = (crop: CropRecommendation) => {
    setSelectedCrop(crop);
    setStep('details');
  };

  const calculateHarvestDate = () => {
    if (!selectedCrop) return '';
    const cropData = getCropData(selectedCrop.crop);
    const duration = cropData?.growthDurationDays || 90;
    return format(addDays(new Date(sowingDate), duration), 'yyyy-MM-dd');
  };

  const addToCropCalendar = async () => {
    if (!selectedCrop || !user) return;
    
    setIsAdding(true);
    
    try {
      const cropData = getCropData(selectedCrop.crop);
      const duration = cropData?.growthDurationDays || 90;
      const sowDate = new Date(sowingDate);
      const harvestDate = addDays(sowDate, duration);
      
      // Create calendar events
      const events = [
        {
          user_id: user.id,
          crop_name: selectedCrop.crop,
          event_type: 'sowing',
          event_date: format(sowDate, 'yyyy-MM-dd'),
          notes: fieldName ? `Field: ${fieldName}` : 'Sowing day - Prepare seeds and field',
        },
        {
          user_id: user.id,
          crop_name: selectedCrop.crop,
          event_type: 'fertilizing',
          event_date: format(addDays(sowDate, 21), 'yyyy-MM-dd'),
          notes: 'First fertilizer application - Apply nitrogen-rich fertilizer',
        },
        {
          user_id: user.id,
          crop_name: selectedCrop.crop,
          event_type: 'irrigation',
          event_date: format(addDays(sowDate, 7), 'yyyy-MM-dd'),
          notes: 'First irrigation - Ensure proper soil moisture',
        },
        {
          user_id: user.id,
          crop_name: selectedCrop.crop,
          event_type: 'irrigation',
          event_date: format(addDays(sowDate, 35), 'yyyy-MM-dd'),
          notes: 'Critical irrigation phase',
        },
        {
          user_id: user.id,
          crop_name: selectedCrop.crop,
          event_type: 'fertilizing',
          event_date: format(addDays(sowDate, 45), 'yyyy-MM-dd'),
          notes: 'Second fertilizer application',
        },
        {
          user_id: user.id,
          crop_name: selectedCrop.crop,
         event_type: 'harvest',
          event_date: format(harvestDate, 'yyyy-MM-dd'),
          notes: `Expected harvest - Duration: ${duration} days`,
        },
      ];

      // Insert all events
      const { error } = await supabase.from('calendar_events').insert(events);
      
      if (error) throw error;

      // Save to crop history
      await supabase.from('crop_history').insert({
        user_id: user.id,
        crop_name: selectedCrop.crop,
        crop_category: getCropCategory(selectedCrop.crop),
        sowing_date: sowingDate,
        expected_harvest_date: format(harvestDate, 'yyyy-MM-dd'),
        field_name: fieldName || null,
        suitability_score: selectedCrop.confidence,
        source: 'recommendation',
      });

      setStep('success');
      toast.success(t(
        'Crop successfully added to your calendar!',
        'फसल सफलतापूर्वक आपके कैलेंडर में जोड़ी गई!',
        'पीक तुमच्या कॅलेंडरमध्ये यशस्वीरित्या जोडले!'
      ));
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast.error(t(
        'Failed to add crop to calendar',
        'कैलेंडर में फसल जोड़ने में विफल',
        'कॅलेंडरमध्ये पीक जोडण्यात अयशस्वी'
      ));
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedCrop(null);
    setSowingDate(format(new Date(), 'yyyy-MM-dd'));
    setFieldName('');
    onClose();
  };

  const goToCalendar = () => {
    handleClose();
    navigate('/calendar');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {step === 'select' && t('Add to Crop Calendar', 'फसल कैलेंडर में जोड़ें', 'पीक कॅलेंडरमध्ये जोडा')}
            {step === 'details' && t('Crop Cycle Details', 'फसल चक्र विवरण', 'पीक चक्र तपशील')}
            {step === 'success' && t('Success!', 'सफलता!', 'यश!')}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && t(
              'Select a crop from AI recommendations to add to your farming calendar',
              'अपने खेती कैलेंडर में जोड़ने के लिए AI अनुशंसाओं से एक फसल चुनें',
              'तुमच्या शेती कॅलेंडरमध्ये जोडण्यासाठी AI शिफारसींमधून एक पीक निवडा'
            )}
            {step === 'details' && t(
              'Set your sowing date and field details',
              'अपनी बुवाई तिथि और खेत का विवरण सेट करें',
              'तुमची पेरणी तारीख आणि शेताचा तपशील सेट करा'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Crop */}
        {step === 'select' && (
          <div className="space-y-3 mt-4">
            {recommendations.map((rec, index) => {
              const category = getCropCategory(rec.crop);
              const cropData = getCropData(rec.crop);
              const colors = cropColorPalette[rec.crop.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
              
              return (
                <Card 
                  key={index}
                  className={`p-4 cursor-pointer hover:shadow-md transition-shadow border-2 ${
                    selectedCrop?.crop === rec.crop ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={() => handleCropSelect(rec)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <Sprout className={`h-5 w-5 ${colors.text}`} />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {rec.crop}
                          <Badge variant="outline" className={categoryColors[category] || 'bg-gray-100'}>
                            {category}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('Yield', 'उपज', 'उत्पादन')}: {rec.expectedYield}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={rec.suitability === 'High' ? 'default' : 'secondary'}>
                        {rec.suitability}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {rec.confidence}% {t('match', 'मिलान', 'जुळणी')}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Step 2: Crop Details */}
        {step === 'details' && selectedCrop && (
          <div className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Leaf className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedCrop.crop}</span>
                <Badge>{getCropCategory(selectedCrop.crop)}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {t('Expected Yield', 'अपेक्षित उपज', 'अपेक्षित उत्पादन')}: {selectedCrop.expectedYield}
              </div>
            </div>

            <div>
              <Label>{t('Sowing Date', 'बुवाई तिथि', 'पेरणी तारीख')} *</Label>
              <Input
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{t('Field/Plot Name (Optional)', 'खेत/प्लॉट का नाम (वैकल्पिक)', 'शेत/प्लॉट नाव (पर्यायी)')}</Label>
              <Input
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder={t('e.g., North Field, Plot A', 'उदा., उत्तर खेत, प्लॉट ए', 'उदा., उत्तर शेत, प्लॉट ए')}
                className="mt-1"
              />
            </div>

            <div className="bg-primary/5 p-4 rounded-lg space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('Events to be created:', 'बनाई जाने वाली घटनाएं:', 'तयार होणाऱ्या घटना:')}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-green-600" />
                  {t('Sowing', 'बुवाई', 'पेरणी')}: {format(new Date(sowingDate), 'dd MMM')}
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-600" />
                  {t('Irrigation', 'सिंचाई', 'सिंचन')}: 2 {t('reminders', 'अनुस्मारक', 'स्मरणपत्रे')}
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  {t('Fertilizer', 'उर्वरक', 'खत')}: 2 {t('reminders', 'अनुस्मारक', 'स्मरणपत्रे')}
                </div>
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-orange-600" />
                  {t('Harvest', 'कटाई', 'कापणी')}: {calculateHarvestDate() ? format(new Date(calculateHarvestDate()), 'dd MMM') : '-'}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                {t('Back', 'पीछे', 'मागे')}
              </Button>
              <Button onClick={addToCropCalendar} disabled={isAdding} className="flex-1">
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('Adding...', 'जोड़ रहे...', 'जोडत आहे...')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('Add to Calendar', 'कैलेंडर में जोड़ें', 'कॅलेंडरमध्ये जोडा')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t('Crop Added Successfully!', 'फसल सफलतापूर्वक जोड़ी गई!', 'पीक यशस्वीरित्या जोडले!')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t(
                'All farming events have been added to your calendar. You will receive reminders for sowing, irrigation, fertilizing, and harvesting.',
                'सभी खेती की घटनाएं आपके कैलेंडर में जोड़ दी गई हैं। आपको बुवाई, सिंचाई, उर्वरक और कटाई के लिए अनुस्मारक प्राप्त होंगे।',
                'सर्व शेती घटना तुमच्या कॅलेंडरमध्ये जोडल्या गेल्या आहेत. तुम्हाला पेरणी, सिंचन, खत आणि कापणीसाठी स्मरणपत्रे मिळतील.'
              )}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                {t('Close', 'बंद करें', 'बंद करा')}
              </Button>
              <Button onClick={goToCalendar} className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                {t('View Calendar', 'कैलेंडर देखें', 'कॅलेंडर पहा')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
