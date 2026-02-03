import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { SoilData } from '@/lib/types';
import { simulateOcrExtraction } from '@/lib/cropRecommendationEngine';
import { FertilizerTable } from '@/components/soil/FertilizerTable';
import { SoilHealthScore } from '@/components/soil/SoilHealthScore';
import { AIAnalysisSection } from '@/components/soil/AIAnalysisSection';
import { SoilEstimationMode } from '@/components/soil/SoilEstimationMode';
import { AddToCropCalendarModal } from '@/components/soil/AddToCropCalendarModal';
import { supabase } from '@/integrations/supabase/client';
import { getPopularCrops } from '@/lib/indianRegionalData';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Volume2,
  VolumeX,
  Sparkles,
  LogIn,
  MapPin,
  Calendar,
  TrendingUp,
  Leaf
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

interface AIAnalysis {
  healthScore: number;
  healthStatus: string;
  summary: string;
  nutrientAnalysis: {
    nitrogen: { status: string; explanation: string };
    phosphorus: { status: string; explanation: string };
    potassium: { status: string; explanation: string };
  };
  insights: string[];
  cropRecommendations: Array<{
    crop: string;
    suitability: string;
    expectedYield: string;
    confidence: number;
    category?: string;
  }>;
  fertilizerRecommendations: {
    chemical: Array<{ name: string; dosage: string; timing?: string }>;
    organic: Array<{ name: string; dosage: string; benefit?: string }>;
  };
  recoveryGuidance: Array<{ issue: string; solution: string; timeline: string }>;
}

export default function SoilReport() {
  const { t, setSoilData, language } = useApp();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [soilParams, setSoilParams] = useState<SoilData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesisUtterance | null>(null);
  const [showEstimationMode, setShowEstimationMode] = useState(false);
  const [isEstimatedSoil, setIsEstimatedSoil] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('Maharashtra');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate, location.pathname]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.match(/image.*|application\/pdf/)) {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    setFile(selectedFile);
    
    if (selectedFile.type.match(/image.*/)) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const runOcrAnalysis = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    
    // Simulate OCR processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use simulated OCR extraction (in production, this would call an API)
    const extractedData = simulateOcrExtraction();
    setSoilParams(extractedData);
    setIsAnalyzing(false);
    
    toast.success('Soil report analyzed successfully!');
    
    // Automatically run AI analysis
    runAIAnalysis(extractedData);
  };

  const runAIAnalysis = async (data: SoilData) => {
    setIsAIAnalyzing(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('analyze-soil', {
        body: { soilData: data, language },
      });

      if (error) {
        console.error('AI analysis error:', error);
        toast.error('AI analysis failed. Using basic analysis.');
        return;
      }

      setAiAnalysis(result);
      toast.success(language === 'hi' ? 'AI विश्लेषण पूर्ण!' : language === 'mr' ? 'AI विश्लेषण पूर्ण!' : 'AI analysis complete!');
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('Failed to run AI analysis');
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  const handleVoiceExplanation = async () => {
    if (isSpeaking && speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!aiAnalysis) {
      toast.error('Please run AI analysis first');
      return;
    }

    try {
      // Generate spoken text using edge function
      const { data, error } = await supabase.functions.invoke('soil-tts', {
        body: { 
          text: `${aiAnalysis.summary}. Your soil health score is ${aiAnalysis.healthScore} out of 100, which is ${aiAnalysis.healthStatus}. ${aiAnalysis.insights.join('. ')}`,
          language 
        },
      });

      if (error) throw error;

      // Use browser's speech synthesis
      const utterance = new SpeechSynthesisUtterance(data.spokenText);
      
      // Set language
      if (language === 'hi') utterance.lang = 'hi-IN';
      else if (language === 'mr') utterance.lang = 'mr-IN';
      else utterance.lang = 'en-US';

      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setSpeechSynthesis(utterance);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
      toast.error('Voice explanation failed');
    }
  };

  const updateSoilParam = (key: keyof SoilData, value: string | number) => {
    if (!soilParams) return;
    
    setSoilParams({
      ...soilParams,
      [key]: typeof soilParams[key] === 'number' ? Number(value) : value,
    });
  };

  const getRecommendations = () => {
    if (!soilParams) return;
    
    setSoilData(soilParams);
    navigate('/crops');
  };

  // Validation helper
  const isValidPh = soilParams && soilParams.ph >= 0 && soilParams.ph <= 14;

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('loginRequired')}</h1>
          <p className="text-muted-foreground mb-6">
            {language === 'hi' ? 'मिट्टी विश्लेषण के लिए लॉगिन करें' : language === 'mr' ? 'माती विश्लेषणासाठी लॉगिन करा' : 'Please login to access soil analysis'}
          </p>
          <Button onClick={() => navigate('/login')}>
            <LogIn className="h-4 w-4 mr-2" />
            {t('login')}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('soilReport')}</h1>
            <p className="text-muted-foreground">
              {language === 'hi' ? 'AI-संचालित मिट्टी विश्लेषण और फसल सिफारिशें' : 
               language === 'mr' ? 'AI-संचालित माती विश्लेषण आणि पीक शिफारसी' :
               'AI-powered soil analysis and crop recommendations'}
            </p>
          </div>

          {/* Upload Section */}
          {!soilParams && !showEstimationMode && (
            <div className="mb-8">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`soil-card text-center cursor-pointer ${
                  dragActive ? 'border-primary bg-primary/10' : ''
                }`}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-4">
                    {preview ? (
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="max-h-64 mx-auto rounded-lg shadow-md"
                      />
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <FileText className="h-12 w-12" />
                        <span className="font-medium">{file.name}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 inline mr-1 text-primary" />
                      {language === 'hi' ? 'फ़ाइल सफलतापूर्वक अपलोड हुई' : 
                       language === 'mr' ? 'फाइल यशस्वीरित्या अपलोड झाली' :
                       'File uploaded successfully'}
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-16 w-16 mx-auto text-primary/50 mb-4" />
                    <p className="text-lg font-medium mb-2">{t('dragDropHere')}</p>
                    <p className="text-muted-foreground mb-4">{t('orBrowse')}</p>
                    <p className="text-sm text-muted-foreground">{t('supportedFormats')}</p>
                  </>
                )}
              </div>

              {/* Camera option for mobile */}
              <div className="flex justify-center gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'environment';
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.files?.[0]) handleFile(target.files[0]);
                    };
                    input.click();
                  }}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {t('captureCamera')}
                </Button>
              </div>

              {/* No Soil Report Option */}
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 text-muted-foreground mb-3">
                  <div className="h-px w-16 bg-border" />
                  <span className="text-sm">
                    {language === 'hi' ? 'या' : language === 'mr' ? 'किंवा' : 'OR'}
                  </span>
                  <div className="h-px w-16 bg-border" />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowEstimationMode(true)}
                  className="border-dashed border-2 hover:border-primary hover:bg-primary/5"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {language === 'hi' ? 'कोई मिट्टी रिपोर्ट नहीं? मिट्टी का अनुमान लगाएं' : 
                   language === 'mr' ? 'माती अहवाल नाही? मातीचा अंदाज लावा' :
                   "No Soil Report? Estimate Soil Instead"}
                </Button>
              </div>

              {/* Analyze Button */}
              {file && (
                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={runOcrAnalysis}
                    disabled={isAnalyzing}
                    className="btn-primary"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        {t('analyzing')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        {language === 'hi' ? 'AI विश्लेषण चलाएं' : 
                         language === 'mr' ? 'AI विश्लेषण चालवा' :
                         'Run AI Analysis'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Soil Estimation Mode */}
          {showEstimationMode && !soilParams && (
            <div className="mb-8">
              <SoilEstimationMode
                language={language}
                onEstimationComplete={(estimatedData) => {
                  setSoilParams(estimatedData);
                  setIsEstimatedSoil(true);
                  setShowEstimationMode(false);
                  // Run AI analysis on estimated data
                  runAIAnalysis(estimatedData);
                }}
                onCancel={() => setShowEstimationMode(false)}
              />
            </div>
          )}

          {/* AI Analysis Loading */}
          {isAIAnalyzing && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardContent className="py-8 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-primary mb-4 animate-pulse" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'hi' ? 'AI विश्लेषण चल रहा है...' : 
                   language === 'mr' ? 'AI विश्लेषण सुरू आहे...' :
                   'AI Analysis in Progress...'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'hi' ? 'कृपया प्रतीक्षा करें' : 
                   language === 'mr' ? 'कृपया प्रतीक्षा करा' :
                   'Please wait while we analyze your soil data'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* AI Analysis Results */}
          {aiAnalysis && soilParams && (
            <div className="space-y-6 mb-8">
              {/* Voice Explanation Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleVoiceExplanation}
                  className={isSpeaking ? 'bg-primary text-primary-foreground' : ''}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="h-4 w-4 mr-2" />
                      {language === 'hi' ? 'रोकें' : language === 'mr' ? 'थांबवा' : 'Stop'}
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      {language === 'hi' ? 'सुनें' : language === 'mr' ? 'ऐका' : 'Listen to Report'}
                    </>
                  )}
                </Button>
              </div>

              {/* Soil Health Score */}
              <SoilHealthScore 
                score={aiAnalysis.healthScore} 
                status={aiAnalysis.healthStatus}
                language={language}
              />

              {/* AI Analysis Section */}
              <AIAnalysisSection analysis={aiAnalysis} language={language} />

              {/* Popular Crops Near You */}
              {profile?.location && (
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {language === 'hi' ? 'आपके क्षेत्र में लोकप्रिय फसलें' : 
                       language === 'mr' ? 'तुमच्या भागातील लोकप्रिय पिके' :
                       'Popular Crops Near Your Location'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {profile.location || userLocation}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getPopularCrops(userLocation).slice(0, 6).map((crop) => (
                        <Badge 
                          key={crop.name} 
                          variant="outline" 
                          className="px-3 py-1"
                        >
                          <Leaf className="h-3 w-3 mr-1" />
                          {crop.name}
                          <span className="text-xs text-muted-foreground ml-1">({crop.adoption}%)</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add to Crop Calendar Button */}
              {aiAnalysis.cropRecommendations && aiAnalysis.cropRecommendations.length > 0 && (
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setShowCalendarModal(true)}
                    className="bg-primary"
                    size="lg"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    {language === 'hi' ? 'फसल कैलेंडर में जोड़ें' : 
                     language === 'mr' ? 'पीक कॅलेंडरमध्ये जोडा' :
                     'Add to Crop Calendar'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Estimated Soil Label */}
          {isEstimatedSoil && soilParams && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 mb-6">
              <MapPin className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                {language === 'hi' ? 'आपके स्थान और इनपुट के आधार पर मिट्टी का अनुमान लगाया गया' : 
                 language === 'mr' ? 'तुमच्या स्थान आणि इनपुटवर आधारित मातीचा अंदाज' :
                 'Soil estimated based on your location and inputs'}
              </span>
            </div>
          )}

          {/* Soil Parameters Form */}
          {soilParams && (
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{t('soilParameters')}</h2>
                <div className="flex gap-2">
                  {!aiAnalysis && !isAIAnalyzing && (
                    <Button 
                      variant="outline"
                      onClick={() => runAIAnalysis(soilParams)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {language === 'hi' ? 'AI विश्लेषण' : language === 'mr' ? 'AI विश्लेषण' : 'Run AI Analysis'}
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setSoilParams(null);
                      setAiAnalysis(null);
                      setFile(null);
                      setPreview(null);
                      setIsEstimatedSoil(false);
                    }}
                  >
                    {language === 'hi' ? 'नया अपलोड' : language === 'mr' ? 'नवीन अपलोड' : 'Upload New'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* pH Level */}
                <div className="space-y-2">
                  <Label htmlFor="ph" className="flex items-center gap-2">
                    {t('ph')}
                    {!isValidPh && <AlertCircle className="h-4 w-4 text-destructive" />}
                  </Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={soilParams.ph}
                    onChange={(e) => updateSoilParam('ph', e.target.value)}
                    className={!isValidPh ? 'border-destructive' : ''}
                  />
                  {!isValidPh && (
                    <p className="text-xs text-destructive">pH must be between 0-14</p>
                  )}
                </div>

                {/* Nitrogen */}
                <div className="space-y-2">
                  <Label htmlFor="nitrogen">{t('nitrogen')} (kg/ha)</Label>
                  <Input
                    id="nitrogen"
                    type="number"
                    value={soilParams.nitrogen}
                    onChange={(e) => updateSoilParam('nitrogen', e.target.value)}
                  />
                </div>

                {/* Phosphorus */}
                <div className="space-y-2">
                  <Label htmlFor="phosphorus">{t('phosphorus')} (kg/ha)</Label>
                  <Input
                    id="phosphorus"
                    type="number"
                    value={soilParams.phosphorus}
                    onChange={(e) => updateSoilParam('phosphorus', e.target.value)}
                  />
                </div>

                {/* Potassium */}
                <div className="space-y-2">
                  <Label htmlFor="potassium">{t('potassium')} (kg/ha)</Label>
                  <Input
                    id="potassium"
                    type="number"
                    value={soilParams.potassium}
                    onChange={(e) => updateSoilParam('potassium', e.target.value)}
                  />
                </div>

                {/* Organic Carbon */}
                <div className="space-y-2">
                  <Label htmlFor="organicCarbon">{t('organicCarbon')} (%)</Label>
                  <Input
                    id="organicCarbon"
                    type="number"
                    step="0.01"
                    value={soilParams.organicCarbon}
                    onChange={(e) => updateSoilParam('organicCarbon', e.target.value)}
                  />
                </div>

                {/* EC */}
                <div className="space-y-2">
                  <Label htmlFor="ec">{t('electricalConductivity')}</Label>
                  <Input
                    id="ec"
                    type="number"
                    step="0.01"
                    value={soilParams.ec}
                    onChange={(e) => updateSoilParam('ec', e.target.value)}
                  />
                </div>

                {/* Moisture */}
                <div className="space-y-2">
                  <Label htmlFor="moisture">{t('moisture')}</Label>
                  <Input
                    id="moisture"
                    type="number"
                    value={soilParams.moisture}
                    onChange={(e) => updateSoilParam('moisture', e.target.value)}
                  />
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <Label htmlFor="temperature">{t('temperature')}</Label>
                  <Input
                    id="temperature"
                    type="number"
                    value={soilParams.temperature}
                    onChange={(e) => updateSoilParam('temperature', e.target.value)}
                  />
                </div>

                {/* Humidity */}
                <div className="space-y-2">
                  <Label htmlFor="humidity">{t('humidity')}</Label>
                  <Input
                    id="humidity"
                    type="number"
                    value={soilParams.humidity}
                    onChange={(e) => updateSoilParam('humidity', e.target.value)}
                  />
                </div>

                {/* Rainfall */}
                <div className="space-y-2">
                  <Label htmlFor="rainfall">{t('rainfall')}</Label>
                  <Input
                    id="rainfall"
                    type="number"
                    value={soilParams.rainfall}
                    onChange={(e) => updateSoilParam('rainfall', e.target.value)}
                  />
                </div>

                {/* Soil Texture */}
                <div className="space-y-2">
                  <Label htmlFor="texture">{t('texture')}</Label>
                  <Select
                    value={soilParams.texture}
                    onValueChange={(value) => updateSoilParam('texture', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select texture" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sandy">Sandy</SelectItem>
                      <SelectItem value="Loamy">Loamy</SelectItem>
                      <SelectItem value="Clayey">Clayey</SelectItem>
                      <SelectItem value="Black">Black</SelectItem>
                      <SelectItem value="Red">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Get Recommendations Button */}
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={getRecommendations}
                  disabled={!isValidPh}
                  className="btn-primary text-lg px-8"
                >
                  {t('getRecommendations')}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Fertilizer Recommendations Table */}
          {soilParams && (
            <div className="mt-8">
              <FertilizerTable soilData={soilParams} />
            </div>
          )}
        </div>
      </div>

      {/* Add to Calendar Modal */}
      <AddToCropCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        recommendations={aiAnalysis?.cropRecommendations || []}
        language={language}
      />
    </Layout>
  );
}
