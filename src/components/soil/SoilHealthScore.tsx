import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity } from 'lucide-react';

interface SoilHealthScoreProps {
  score: number;
  status: string;
  language: string;
}

const statusTranslations: Record<string, Record<string, string>> = {
  en: {
    Healthy: 'Healthy',
    Good: 'Good',
    'Needs Attention': 'Needs Attention',
    Poor: 'Poor',
  },
  hi: {
    Healthy: 'स्वस्थ',
    Good: 'अच्छी',
    'Needs Attention': 'ध्यान देने की जरूरत',
    Poor: 'खराब',
  },
  mr: {
    Healthy: 'निरोगी',
    Good: 'चांगली',
    'Needs Attention': 'लक्ष देणे आवश्यक',
    Poor: 'खराब',
  },
};

const getHealthColor = (score: number) => {
  if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' };
  if (score >= 60) return { bg: 'bg-lime-500', text: 'text-lime-600', light: 'bg-lime-50' };
  if (score >= 40) return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' };
  return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' };
};

const getExplanation = (score: number, language: string): string => {
  const explanations: Record<string, Record<string, string>> = {
    en: {
      high: 'Your soil is in excellent condition! It has good nutrient balance and is ready for high-yield crops.',
      good: 'Your soil is healthy with minor improvements needed. Consider adding organic matter for better results.',
      attention: 'Your soil needs attention. Some nutrients are deficient and soil health should be improved.',
      poor: 'Your soil requires significant improvement. Follow the recommendations to restore soil health.',
    },
    hi: {
      high: 'आपकी मिट्टी उत्कृष्ट स्थिति में है! इसमें अच्छा पोषक संतुलन है।',
      good: 'आपकी मिट्टी स्वस्थ है, मामूली सुधार की जरूरत है।',
      attention: 'आपकी मिट्टी पर ध्यान देने की जरूरत है। कुछ पोषक तत्वों की कमी है।',
      poor: 'आपकी मिट्टी को महत्वपूर्ण सुधार की आवश्यकता है।',
    },
    mr: {
      high: 'तुमची माती उत्कृष्ट स्थितीत आहे! त्यात चांगला पोषक संतुलन आहे।',
      good: 'तुमची माती निरोगी आहे, किरकोळ सुधारणा आवश्यक आहे।',
      attention: 'तुमच्या मातीला लक्ष देणे आवश्यक आहे। काही पोषक तत्वांची कमतरता आहे।',
      poor: 'तुमच्या मातीला महत्त्वपूर्ण सुधारणा आवश्यक आहे।',
    },
  };

  const lang = explanations[language] || explanations.en;
  if (score >= 80) return lang.high;
  if (score >= 60) return lang.good;
  if (score >= 40) return lang.attention;
  return lang.poor;
};

export function SoilHealthScore({ score, status, language }: SoilHealthScoreProps) {
  const colors = getHealthColor(score);
  const translatedStatus = statusTranslations[language]?.[status] || status;
  const explanation = getExplanation(score, language);

  return (
    <Card className={`${colors.light} border-2`} style={{ borderColor: `${colors.bg.replace('bg-', '')}` }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className={`h-5 w-5 ${colors.text}`} />
          {language === 'hi' ? 'मिट्टी स्वास्थ्य स्कोर' : language === 'mr' ? 'माती आरोग्य स्कोर' : 'Soil Health Score'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Circular Score Display */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 301.59} 301.59`}
                className={colors.text}
                stroke="currentColor"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${colors.text}`}>{score}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>

          {/* Status and Explanation */}
          <div className="flex-1">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.light} ${colors.text} font-semibold text-sm mb-2`}>
              <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
              {translatedStatus}
            </div>
            <p className="text-sm text-muted-foreground">{explanation}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{language === 'hi' ? 'खराब' : language === 'mr' ? 'खराब' : 'Poor'}</span>
            <span>{language === 'hi' ? 'उत्कृष्ट' : language === 'mr' ? 'उत्कृष्ट' : 'Excellent'}</span>
          </div>
          <div className="h-2 bg-gradient-to-r from-red-500 via-amber-500 via-lime-500 to-emerald-500 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 transition-all duration-500"
              style={{ marginLeft: `${score}%`, width: `${100 - score}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
