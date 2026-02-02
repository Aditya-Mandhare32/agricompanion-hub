import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Lightbulb, 
  Leaf, 
  FlaskConical, 
  TreeDeciduous,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

interface NutrientStatus {
  status: string;
  explanation: string;
}

interface CropRecommendation {
  crop: string;
  suitability: string;
  expectedYield: string;
  confidence: number;
}

interface FertilizerRec {
  name: string;
  dosage: string;
  timing?: string;
  benefit?: string;
}

interface RecoveryGuidance {
  issue: string;
  solution: string;
  timeline: string;
}

interface AIAnalysis {
  healthScore: number;
  healthStatus: string;
  summary: string;
  nutrientAnalysis: {
    nitrogen: NutrientStatus;
    phosphorus: NutrientStatus;
    potassium: NutrientStatus;
  };
  insights: string[];
  cropRecommendations: CropRecommendation[];
  fertilizerRecommendations: {
    chemical: FertilizerRec[];
    organic: FertilizerRec[];
  };
  recoveryGuidance: RecoveryGuidance[];
}

interface AIAnalysisSectionProps {
  analysis: AIAnalysis;
  language: string;
}

const getStatusColor = (status: string) => {
  if (status === 'Optimal' || status === 'High') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'Medium') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

const getSuitabilityColor = (suitability: string) => {
  if (suitability === 'High') return 'bg-emerald-500';
  if (suitability === 'Medium') return 'bg-amber-500';
  return 'bg-red-500';
};

export function AIAnalysisSection({ analysis, language }: AIAnalysisSectionProps) {
  const titles = {
    en: {
      summary: 'AI Summary',
      nutrients: 'Nutrient Analysis',
      insights: 'Smart Insights',
      crops: 'Crop Recommendations',
      chemical: 'Chemical Fertilizers',
      organic: 'Organic Alternatives',
      recovery: 'Recovery Guidance',
    },
    hi: {
      summary: 'AI सारांश',
      nutrients: 'पोषक विश्लेषण',
      insights: 'स्मार्ट अंतर्दृष्टि',
      crops: 'फसल सिफारिशें',
      chemical: 'रासायनिक उर्वरक',
      organic: 'जैविक विकल्प',
      recovery: 'सुधार मार्गदर्शन',
    },
    mr: {
      summary: 'AI सारांश',
      nutrients: 'पोषक विश्लेषण',
      insights: 'स्मार्ट अंतर्दृष्टी',
      crops: 'पीक शिफारसी',
      chemical: 'रासायनिक खते',
      organic: 'सेंद्रिय पर्याय',
      recovery: 'सुधारणा मार्गदर्शन',
    },
  };

  const t = titles[language as keyof typeof titles] || titles.en;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
            {t.summary}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{analysis.summary}</p>
        </CardContent>
      </Card>

      {/* Nutrient Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="h-5 w-5 text-primary" />
            {t.nutrients}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(analysis.nutrientAnalysis).map(([nutrient, data]) => (
              <div key={nutrient} className={`p-4 rounded-lg border-2 ${getStatusColor(data.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold capitalize">{nutrient}</span>
                  <Badge variant="outline" className={getStatusColor(data.status)}>
                    {data.status}
                  </Badge>
                </div>
                <p className="text-sm opacity-80">{data.explanation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smart Insights */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t.insights}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Crop Recommendations Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Leaf className="h-5 w-5 text-primary" />
            {t.crops}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'hi' ? 'फसल' : language === 'mr' ? 'पीक' : 'Crop'}</TableHead>
                <TableHead>{language === 'hi' ? 'उपयुक्तता' : language === 'mr' ? 'योग्यता' : 'Suitability'}</TableHead>
                <TableHead>{language === 'hi' ? 'अपेक्षित उपज' : language === 'mr' ? 'अपेक्षित उत्पादन' : 'Expected Yield'}</TableHead>
                <TableHead className="text-right">{language === 'hi' ? 'विश्वास' : language === 'mr' ? 'विश्वास' : 'Confidence'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.cropRecommendations.map((rec, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{rec.crop}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getSuitabilityColor(rec.suitability)}`} />
                      {rec.suitability}
                    </div>
                  </TableCell>
                  <TableCell>{rec.expectedYield}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{rec.confidence}%</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Fertilizer Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FlaskConical className="h-5 w-5 text-amber-600" />
              {t.chemical}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.fertilizerRecommendations.chemical.map((fert, index) => (
                <div key={index} className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="font-medium text-amber-800">{fert.name}</div>
                  <div className="text-sm text-amber-700 mt-1">
                    <span className="font-medium">{language === 'hi' ? 'मात्रा:' : language === 'mr' ? 'प्रमाण:' : 'Dosage:'}</span> {fert.dosage}
                  </div>
                  {fert.timing && (
                    <div className="text-sm text-amber-700">
                      <span className="font-medium">{language === 'hi' ? 'समय:' : language === 'mr' ? 'वेळ:' : 'Timing:'}</span> {fert.timing}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TreeDeciduous className="h-5 w-5 text-emerald-600" />
              {t.organic}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.fertilizerRecommendations.organic.map((fert, index) => (
                <div key={index} className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="font-medium text-emerald-800">{fert.name}</div>
                  <div className="text-sm text-emerald-700 mt-1">
                    <span className="font-medium">{language === 'hi' ? 'मात्रा:' : language === 'mr' ? 'प्रमाण:' : 'Dosage:'}</span> {fert.dosage}
                  </div>
                  {fert.benefit && (
                    <div className="text-sm text-emerald-700">
                      <span className="font-medium">{language === 'hi' ? 'लाभ:' : language === 'mr' ? 'फायदा:' : 'Benefit:'}</span> {fert.benefit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recovery Guidance */}
      {analysis.recoveryGuidance && analysis.recoveryGuidance.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t.recovery}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.recoveryGuidance.map((item, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-amber-700">{item.issue}</div>
                      <div className="text-sm text-muted-foreground mt-1">{item.solution}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="h-3 w-3" />
                        {item.timeline}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
