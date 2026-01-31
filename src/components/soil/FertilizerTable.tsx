import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FlaskConical, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SoilData } from '@/lib/types';

interface FertilizerStage {
  stage: string;
  fertilizerType: string;
  amountKgHa: number;
  amountGPlant: number;
  method: string;
  timing: string;
}

interface FertilizerTableProps {
  soilData: SoilData;
  selectedCrop?: string;
}

// Generate fertilizer recommendations based on soil data
function generateFertilizerSchedule(soilData: SoilData, crop: string): FertilizerStage[] {
  // Base recommendations adjusted by soil nutrients
  const nitrogenDeficit = Math.max(0, 80 - soilData.nitrogen);
  const phosphorusDeficit = Math.max(0, 40 - soilData.phosphorus);
  const potassiumDeficit = Math.max(0, 60 - soilData.potassium);

  const stages: FertilizerStage[] = [
    {
      stage: 'Basal Application',
      fertilizerType: 'DAP (18-46-0)',
      amountKgHa: Math.round(50 + phosphorusDeficit * 0.5),
      amountGPlant: Math.round((50 + phosphorusDeficit * 0.5) / 25),
      method: 'Broadcasting before sowing',
      timing: 'At sowing / transplanting',
    },
    {
      stage: 'First Top Dressing',
      fertilizerType: 'Urea (46-0-0)',
      amountKgHa: Math.round(40 + nitrogenDeficit * 0.4),
      amountGPlant: Math.round((40 + nitrogenDeficit * 0.4) / 25),
      method: 'Side dressing near roots',
      timing: '20-25 days after sowing',
    },
    {
      stage: 'Second Top Dressing',
      fertilizerType: 'Urea (46-0-0)',
      amountKgHa: Math.round(35 + nitrogenDeficit * 0.3),
      amountGPlant: Math.round((35 + nitrogenDeficit * 0.3) / 25),
      method: 'Side dressing near roots',
      timing: '40-45 days after sowing',
    },
    {
      stage: 'Potash Application',
      fertilizerType: 'MOP (0-0-60)',
      amountKgHa: Math.round(30 + potassiumDeficit * 0.5),
      amountGPlant: Math.round((30 + potassiumDeficit * 0.5) / 25),
      method: 'Soil application',
      timing: 'At flowering stage',
    },
    {
      stage: 'Micronutrient Spray',
      fertilizerType: 'ZnSO4 + Boron',
      amountKgHa: 5,
      amountGPlant: 0.2,
      method: 'Foliar spray',
      timing: '30-35 days after sowing',
    },
  ];

  // Adjust for soil pH
  if (soilData.ph < 6.0) {
    stages.push({
      stage: 'Soil Amendment',
      fertilizerType: 'Lime (iteiteite)',
      amountKgHa: Math.round((6.5 - soilData.ph) * 200),
      amountGPlant: Math.round((6.5 - soilData.ph) * 8),
      method: 'Broadcasting & incorporation',
      timing: '2-3 weeks before sowing',
    });
  } else if (soilData.ph > 8.0) {
    stages.push({
      stage: 'Soil Amendment',
      fertilizerType: 'Gypsum',
      amountKgHa: Math.round((soilData.ph - 7.5) * 250),
      amountGPlant: Math.round((soilData.ph - 7.5) * 10),
      method: 'Broadcasting & incorporation',
      timing: '2-3 weeks before sowing',
    });
  }

  // Add organic matter if OC is low
  if (soilData.organicCarbon < 0.5) {
    stages.unshift({
      stage: 'Organic Amendment',
      fertilizerType: 'FYM / Compost',
      amountKgHa: 5000,
      amountGPlant: 200,
      method: 'Broadcasting & mixing',
      timing: '15-20 days before sowing',
    });
  }

  return stages;
}

export function FertilizerTable({ soilData, selectedCrop = 'General Crop' }: FertilizerTableProps) {
  const [useKgHa, setUseKgHa] = useState(true);

  const fertilizerSchedule = useMemo(() => {
    return generateFertilizerSchedule(soilData, selectedCrop);
  }, [soilData, selectedCrop]);

  const totalNPK = useMemo(() => {
    // Approximate NPK calculation from fertilizer types
    let n = 0, p = 0, k = 0;
    fertilizerSchedule.forEach(stage => {
      const amount = useKgHa ? stage.amountKgHa : stage.amountGPlant;
      if (stage.fertilizerType.includes('Urea')) {
        n += amount * 0.46;
      } else if (stage.fertilizerType.includes('DAP')) {
        n += amount * 0.18;
        p += amount * 0.46;
      } else if (stage.fertilizerType.includes('MOP')) {
        k += amount * 0.60;
      }
    });
    return { n: Math.round(n), p: Math.round(p), k: Math.round(k) };
  }, [fertilizerSchedule, useKgHa]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-amber-500" />
            Fertilizer Schedule
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="unit-toggle" className="text-sm text-muted-foreground">
                g/plant
              </Label>
              <Switch
                id="unit-toggle"
                checked={useKgHa}
                onCheckedChange={setUseKgHa}
              />
              <Label htmlFor="unit-toggle" className="text-sm text-muted-foreground">
                kg/ha
              </Label>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-popover">
                  <p className="text-sm">
                    Toggle between kg/ha (field scale) and g/plant (individual plant) units. 
                    Conversion assumes ~25,000 plants per hectare.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* NPK Summary */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            N: {totalNPK.n} {useKgHa ? 'kg/ha' : 'g/plant'}
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            P₂O₅: {totalNPK.p} {useKgHa ? 'kg/ha' : 'g/plant'}
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            K₂O: {totalNPK.k} {useKgHa ? 'kg/ha' : 'g/plant'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Stage</TableHead>
                <TableHead className="font-semibold">Fertilizer Type</TableHead>
                <TableHead className="font-semibold text-right">
                  Amount ({useKgHa ? 'kg/ha' : 'g/plant'})
                </TableHead>
                <TableHead className="font-semibold">Application Method</TableHead>
                <TableHead className="font-semibold">Timing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fertilizerSchedule.map((stage, index) => (
                <TableRow key={index} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <Badge 
                      variant="outline" 
                      className={
                        stage.stage.includes('Organic') 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : stage.stage.includes('Amendment')
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : stage.stage.includes('Basal')
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : stage.stage.includes('Top Dressing')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : stage.stage.includes('Potash')
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }
                    >
                      {stage.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{stage.fertilizerType}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {useKgHa ? stage.amountKgHa : stage.amountGPlant}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {stage.method}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {stage.timing}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Notes */}
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> These recommendations are based on your soil analysis. 
            Actual requirements may vary based on crop variety, local conditions, and previous crop residue. 
            Consult with a local agronomist for precise recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
