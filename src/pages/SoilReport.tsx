import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useApp } from '@/context/AppContext';
import { SoilData } from '@/lib/types';
import { simulateOcrExtraction } from '@/lib/cropRecommendationEngine';
import { 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

export default function SoilReport() {
  const { t, setSoilData, isAuthenticated } = useApp();
  const navigate = useNavigate();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [soilParams, setSoilParams] = useState<SoilData | null>(null);
  const [dragActive, setDragActive] = useState(false);

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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('soilReport')}</h1>
            <p className="text-muted-foreground">
              Upload your soil test report and get AI-powered crop recommendations
            </p>
          </div>

          {/* Upload Section */}
          {!soilParams && (
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
                      File uploaded successfully
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
                        <FileText className="h-5 w-5 mr-2" />
                        {t('runOcr')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Soil Parameters Form */}
          {soilParams && (
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{t('soilParameters')}</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setSoilParams(null);
                    setFile(null);
                    setPreview(null);
                  }}
                >
                  Upload New
                </Button>
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

          {/* API Placeholder Note */}
          <div className="mt-8 p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
            <p className="font-medium mb-2">🔧 API Integration Note:</p>
            <p>
              In production, replace <code className="bg-muted px-1 rounded">simulateOcrExtraction()</code> with 
              actual API call: <code className="bg-muted px-1 rounded">POST /api/ocr</code>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
