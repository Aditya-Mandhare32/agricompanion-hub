import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useApp } from '@/context/AppContext';
import { getCropRecommendations, getFertilizerRecommendation } from '@/lib/cropRecommendationEngine';
import { CropRecommendation, FertilizerRecommendation } from '@/lib/types';
import { 
  Sprout, 
  Droplets, 
  Sun, 
  Calendar, 
  ArrowRight,
  FlaskConical,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from 'sonner';

export default function Crops() {
  const { t, currentSoilData, addEvent } = useApp();
  const navigate = useNavigate();
  
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [fertilizerPlan, setFertilizerPlan] = useState<FertilizerRecommendation | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const recommendations = useMemo(() => {
    if (!currentSoilData) return [];
    return getCropRecommendations(currentSoilData);
  }, [currentSoilData]);

  const handleViewDetails = (cropName: string) => {
    if (!currentSoilData) return;
    
    setSelectedCrop(cropName);
    const plan = getFertilizerRecommendation(currentSoilData, cropName);
    setFertilizerPlan(plan);
  };

  const handleAddToCalendar = (cropName: string) => {
    const today = new Date();
    
    // Add sowing event
    addEvent({
      cropName,
      eventType: 'sowing',
      date: today,
      notes: 'Start sowing',
      completed: false,
    });

    // Add fertilizing event (3 weeks later)
    addEvent({
      cropName,
      eventType: 'fertilizing',
      date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
      notes: 'First fertilizer application',
      completed: false,
    });

    // Add irrigation event (1 week later)
    addEvent({
      cropName,
      eventType: 'irrigation',
      date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Regular irrigation',
      completed: false,
    });

    // Add harvest event (90 days later)
    addEvent({
      cropName,
      eventType: 'harvest',
      date: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
      notes: 'Expected harvest',
      completed: false,
    });

    toast.success(`${cropName} added to your calendar!`);
  };

  const toggleCard = (cropName: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cropName)) {
      newExpanded.delete(cropName);
    } else {
      newExpanded.add(cropName);
    }
    setExpandedCards(newExpanded);
  };

  const exportCsv = () => {
    if (!fertilizerPlan) return;
    
    const headers = ['Stage', 'Fertilizer Type', 'Amount', 'Method', 'Timing'];
    const rows = fertilizerPlan.applicationStages.map(s => [
      s.stage, s.fertilizerType, s.amount, s.method, s.timing
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fertilizer-plan-${fertilizerPlan.crop}.csv`;
    a.click();
    
    toast.success('Fertilizer plan exported!');
  };

  if (!currentSoilData) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Sprout className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Soil Data Available</h2>
          <p className="text-muted-foreground mb-6">
            Please upload and analyze your soil report first to get crop recommendations.
          </p>
          <Button onClick={() => navigate('/soil-report')}>
            Upload Soil Report
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('cropRecommendations')}</h1>
            <p className="text-muted-foreground">
              AI-powered recommendations based on your soil analysis
            </p>
          </div>

          {/* Soil Summary */}
          <div className="bg-card rounded-2xl shadow-lg border border-border p-6 mb-8">
            <h3 className="font-semibold mb-4">Your Soil Profile</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="stat-card">
                <span className="text-2xl font-bold text-primary">{currentSoilData.ph}</span>
                <span className="text-xs text-muted-foreground">pH Level</span>
              </div>
              <div className="stat-card">
                <span className="text-2xl font-bold text-primary">{currentSoilData.nitrogen}</span>
                <span className="text-xs text-muted-foreground">N (kg/ha)</span>
              </div>
              <div className="stat-card">
                <span className="text-2xl font-bold text-primary">{currentSoilData.phosphorus}</span>
                <span className="text-xs text-muted-foreground">P (kg/ha)</span>
              </div>
              <div className="stat-card">
                <span className="text-2xl font-bold text-primary">{currentSoilData.potassium}</span>
                <span className="text-xs text-muted-foreground">K (kg/ha)</span>
              </div>
              <div className="stat-card">
                <span className="text-2xl font-bold text-primary">{currentSoilData.temperature}°</span>
                <span className="text-xs text-muted-foreground">Temperature</span>
              </div>
              <div className="stat-card">
                <span className="text-2xl font-bold text-primary">{currentSoilData.texture}</span>
                <span className="text-xs text-muted-foreground">Soil Type</span>
              </div>
            </div>
          </div>

          {/* Recommendations Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">{t('topCrops')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((crop, index) => (
                <Collapsible
                  key={crop.name}
                  open={expandedCards.has(crop.name)}
                  onOpenChange={() => toggleCard(crop.name)}
                >
                  <div className="crop-card">
                    {/* Card Header */}
                    <div className="crop-card-header relative">
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        #{index + 1}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{crop.name}</h3>
                      
                      {/* Match Score */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{t('matchScore')}</span>
                        <div className="flex-1 progress-bar">
                          <div 
                            className="progress-bar-fill"
                            style={{ width: `${crop.matchScore}%` }}
                          />
                        </div>
                        <span className="font-bold text-primary">{crop.matchScore}%</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <Sprout className="h-4 w-4 mx-auto text-primary mb-1" />
                          <div className="text-xs text-muted-foreground">Soil</div>
                          <div className="font-semibold text-sm">{crop.soilCompatibility}%</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <Sun className="h-4 w-4 mx-auto text-secondary mb-1" />
                          <div className="text-xs text-muted-foreground">Season</div>
                          <div className="font-semibold text-sm">{crop.seasonSuitability}%</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <Droplets className="h-4 w-4 mx-auto text-sky-500 mb-1" />
                          <div className="text-xs text-muted-foreground">Water</div>
                          <div className="font-semibold text-sm">{crop.waterNeeds}</div>
                        </div>
                      </div>

                      {/* Reasons */}
                      <CollapsibleContent>
                        <div className="space-y-2 mb-4">
                          {crop.reasons.map((reason, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{reason}</span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleAddToCalendar(crop.name)}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          {t('addToCalendar')}
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewDetails(crop.name)}
                        >
                          <FlaskConical className="h-4 w-4 mr-1" />
                          Fertilizer Plan
                        </Button>
                      </div>

                      {/* Toggle */}
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full mt-2">
                          {expandedCards.has(crop.name) ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Show More
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </Collapsible>
              ))}
            </div>
          </div>

          {/* Fertilizer Plan Section */}
          {fertilizerPlan && (
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{t('fertilizerPlan')}</h2>
                  <p className="text-muted-foreground">
                    For <span className="text-primary font-medium">{fertilizerPlan.crop}</span> on{' '}
                    <span className="font-medium">{fertilizerPlan.soilType}</span> soil
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportCsv}>
                    <Download className="h-4 w-4 mr-1" />
                    {t('exportCsv')}
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Download className="h-4 w-4 mr-1" />
                    {t('exportPdf')}
                  </Button>
                </div>
              </div>

              {/* NPK Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-primary/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{fertilizerPlan.nitrogen}</div>
                  <div className="text-sm text-muted-foreground">Nitrogen (N)</div>
                </div>
                <div className="bg-secondary/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-secondary">{fertilizerPlan.phosphorus}</div>
                  <div className="text-sm text-muted-foreground">Phosphorus (P)</div>
                </div>
                <div className="bg-accent/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-accent">{fertilizerPlan.potassium}</div>
                  <div className="text-sm text-muted-foreground">Potassium (K)</div>
                </div>
              </div>

              {/* Application Schedule Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('stage')}</TableHead>
                      <TableHead>{t('fertilizerType')}</TableHead>
                      <TableHead>{t('amount')}</TableHead>
                      <TableHead>{t('method')}</TableHead>
                      <TableHead>{t('timing')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fertilizerPlan.applicationStages.map((stage, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{stage.stage}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">
                            {stage.fertilizerType}
                          </span>
                        </TableCell>
                        <TableCell>{stage.amount}</TableCell>
                        <TableCell>{stage.method}</TableCell>
                        <TableCell>{stage.timing}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Add all to calendar */}
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={() => handleAddToCalendar(fertilizerPlan.crop)}
                  className="btn-primary"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Add Complete Schedule to Calendar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
