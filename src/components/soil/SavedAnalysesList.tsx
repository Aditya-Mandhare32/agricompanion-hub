 import React, { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Skeleton } from '@/components/ui/skeleton';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { 
   History, 
   FileText, 
   Calendar, 
   Trash2, 
   Eye, 
   Volume2,
   Leaf,
   MapPin
 } from 'lucide-react';
 import { format } from 'date-fns';
 import { SoilHealthScore } from './SoilHealthScore';
 import { AIAnalysisSection } from './AIAnalysisSection';
 
 interface SavedAnalysis {
   id: string;
   field_name: string | null;
   analysis_data: any;
   soil_params: any;
   language: string;
   is_estimated: boolean;
   created_at: string;
 }
 
 interface SavedAnalysesListProps {
   language: string;
   onSelect?: (analysis: SavedAnalysis) => void;
 }
 
 export function SavedAnalysesList({ language, onSelect }: SavedAnalysesListProps) {
   const { user } = useAuth();
   const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);
   const [showDialog, setShowDialog] = useState(false);
 
   useEffect(() => {
     if (user) {
       fetchAnalyses();
     }
   }, [user]);
 
   const fetchAnalyses = async () => {
     if (!user) return;
     
     setLoading(true);
     try {
       const { data, error } = await supabase
        .from('saved_soil_analyses' as any)
         .select('*')
         .eq('user_id', user.id)
         .order('created_at', { ascending: false });
 
       if (error) throw error;
      setAnalyses((data as unknown as SavedAnalysis[]) || []);
     } catch (error) {
       console.error('Error fetching analyses:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const deleteAnalysis = async (id: string) => {
     try {
       const { error } = await supabase
        .from('saved_soil_analyses' as any)
         .delete()
         .eq('id', id);
 
       if (error) throw error;
       setAnalyses(prev => prev.filter(a => a.id !== id));
     } catch (error) {
       console.error('Error deleting analysis:', error);
     }
   };
 
   const viewAnalysis = (analysis: SavedAnalysis) => {
     setSelectedAnalysis(analysis);
     setShowDialog(true);
   };
 
   const t = (en: string, hi: string, mr: string) => {
     if (language === 'hi') return hi;
     if (language === 'mr') return mr;
     return en;
   };
 
   if (loading) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <History className="h-5 w-5" />
             {t('Previous Analyses', 'पिछले विश्लेषण', 'मागील विश्लेषणे')}
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-3">
             {[1, 2, 3].map(i => (
               <Skeleton key={i} className="h-20 w-full" />
             ))}
           </div>
         </CardContent>
       </Card>
     );
   }
 
   if (analyses.length === 0) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <History className="h-5 w-5" />
             {t('Previous Analyses', 'पिछले विश्लेषण', 'मागील विश्लेषणे')}
           </CardTitle>
         </CardHeader>
         <CardContent className="text-center py-8 text-muted-foreground">
           <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
           <p>{t('No saved analyses yet', 'अभी तक कोई सहेजा गया विश्लेषण नहीं', 'अद्याप कोणतेही जतन केलेले विश्लेषण नाही')}</p>
           <p className="text-sm mt-1">
             {t('Your soil analyses will appear here', 'आपके मिट्टी विश्लेषण यहां दिखाई देंगे', 'तुमचे माती विश्लेषण येथे दिसेल')}
           </p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <>
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <History className="h-5 w-5" />
             {t('Previous Analyses', 'पिछले विश्लेषण', 'मागील विश्लेषणे')}
             <Badge variant="secondary" className="ml-2">{analyses.length}</Badge>
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-3">
             {analyses.map((analysis) => (
               <div 
                 key={analysis.id} 
                 className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
               >
                 <div className="flex items-start justify-between">
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                       <Leaf className="h-4 w-4 text-primary" />
                       <span className="font-medium">
                         {analysis.field_name || t('Unnamed Field', 'अनाम खेत', 'नाव नसलेले शेत')}
                       </span>
                       {analysis.is_estimated && (
                         <Badge variant="outline" className="text-xs">
                           <MapPin className="h-3 w-3 mr-1" />
                           {t('Estimated', 'अनुमानित', 'अंदाजित')}
                         </Badge>
                       )}
                     </div>
                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
                       <span className="flex items-center gap-1">
                         <Calendar className="h-3 w-3" />
                         {format(new Date(analysis.created_at), 'dd MMM yyyy')}
                       </span>
                       <span>
                         {t('Score', 'स्कोर', 'स्कोअर')}: {analysis.analysis_data?.healthScore || 'N/A'}
                       </span>
                     </div>
                     {analysis.analysis_data?.cropRecommendations?.slice(0, 3).map((crop: any, i: number) => (
                       <Badge key={i} variant="secondary" className="text-xs mr-1 mt-2">
                         {crop.crop}
                       </Badge>
                     ))}
                   </div>
                   <div className="flex gap-2">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => viewAnalysis(analysis)}
                     >
                       <Eye className="h-4 w-4" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => deleteAnalysis(analysis.id)}
                       className="text-destructive hover:text-destructive"
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         </CardContent>
       </Card>
 
       {/* View Analysis Dialog */}
       <Dialog open={showDialog} onOpenChange={setShowDialog}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <FileText className="h-5 w-5" />
               {selectedAnalysis?.field_name || t('Soil Analysis', 'मिट्टी विश्लेषण', 'माती विश्लेषण')}
               <Badge variant="secondary" className="ml-2">
                 {selectedAnalysis && format(new Date(selectedAnalysis.created_at), 'dd MMM yyyy')}
               </Badge>
             </DialogTitle>
           </DialogHeader>
           
           {selectedAnalysis && (
             <div className="space-y-6">
               <SoilHealthScore 
                 score={selectedAnalysis.analysis_data?.healthScore || 0}
                 status={selectedAnalysis.analysis_data?.healthStatus || 'Unknown'}
                 language={language}
               />
               <AIAnalysisSection 
                 analysis={selectedAnalysis.analysis_data}
                 language={language}
               />
             </div>
           )}
         </DialogContent>
       </Dialog>
     </>
   );
 }