import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Heart, ThumbsUp, AlertTriangle, Leaf, SkipForward } from 'lucide-react';

interface CropHealthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  cropName: string;
  activityName: string;
  language: string;
  onSubmit: (response: { condition: string; notes: string }) => void;
}

const conditionOptions = [
  { value: 'excellent', icon: Heart, color: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: { en: 'Excellent', hi: 'उत्कृष्ट', mr: 'उत्कृष्ट' } },
  { value: 'good', icon: ThumbsUp, color: 'bg-green-100 text-green-700 border-green-300', label: { en: 'Good', hi: 'अच्छा', mr: 'चांगले' } },
  { value: 'average', icon: Leaf, color: 'bg-amber-100 text-amber-700 border-amber-300', label: { en: 'Average', hi: 'सामान्य', mr: 'सामान्य' } },
  { value: 'poor', icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-300', label: { en: 'Poor', hi: 'खराब', mr: 'खराब' } },
];

export function CropHealthPopup({ isOpen, onClose, cropName, activityName, language, onSubmit }: CropHealthPopupProps) {
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!selectedCondition) return;
    onSubmit({ condition: selectedCondition, notes });
    setSelectedCondition(null);
    setNotes('');
    onClose();
  };

  const handleSkip = () => {
    setSelectedCondition(null);
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Leaf className="h-5 w-5 text-primary" />
            {language === 'hi' ? 'फसल स्वास्थ्य जांच' : language === 'mr' ? 'पीक आरोग्य तपासणी' : 'Crop Health Check'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center p-4 bg-primary/5 rounded-xl">
            <Badge variant="secondary" className="mb-2">{cropName}</Badge>
            <p className="text-sm text-muted-foreground">
              {language === 'hi' ? `${activityName} पूरा होने के बाद, आपकी फसल की स्थिति कैसी है?` :
               language === 'mr' ? `${activityName} पूर्ण झाल्यानंतर, तुमच्या पिकाची स्थिती कशी आहे?` :
               `After completing ${activityName}, how is your crop's condition?`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {conditionOptions.map((opt) => {
              const Icon = opt.icon;
              const label = opt.label[language as keyof typeof opt.label] || opt.label.en;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelectedCondition(opt.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    selectedCondition === opt.value 
                      ? `${opt.color} ring-2 ring-primary scale-105` 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              );
            })}
          </div>

          <Textarea
            placeholder={language === 'hi' ? 'कोई अतिरिक्त टिप्पणी... (वैकल्पिक)' :
                         language === 'mr' ? 'कोणती अतिरिक्त टिप्पणी... (वैकल्पिक)' :
                         'Any additional notes... (optional)'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[60px] resize-none"
          />
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleSkip} className="flex-1">
            <SkipForward className="h-4 w-4 mr-1" />
            {language === 'hi' ? 'छोड़ें' : language === 'mr' ? 'वगळा' : 'Skip'}
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedCondition} className="flex-1">
            {language === 'hi' ? 'जमा करें' : language === 'mr' ? 'सबमिट करा' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
