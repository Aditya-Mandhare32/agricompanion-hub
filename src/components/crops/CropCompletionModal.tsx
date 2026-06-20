import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, ClipboardList, Repeat, Archive } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cropName: string;
  totalDays: number;
  language: string;
  onRecordYield: () => void;
  onAddSameCrop: () => void;
  onMoveToHistory: () => void;
}

export function CropCompletionModal({
  open, onOpenChange, cropName, totalDays, language,
  onRecordYield, onAddSameCrop, onMoveToHistory,
}: Props) {
  useEffect(() => {
    if (!open) return;
    // Confetti burst on open
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.7 },
        particleCount: Math.floor(200 * particleRatio),
        ...opts,
      });
    };
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, [open]);

  const congrats =
    language === 'hi' ? `🎉 बधाई हो! आपकी ${cropName} की कटाई पूरी हुई` :
    language === 'mr' ? `🎉 अभिनंदन! तुमची ${cropName} काढणी पूर्ण झाली` :
    `🎉 Congratulations! Your ${cropName} harvest is complete`;

  const daysLine =
    language === 'hi' ? `कुल ${totalDays} दिन का सीज़न` :
    language === 'mr' ? `एकूण ${totalDays} दिवसांचा हंगाम` :
    `${totalDays} days from sowing to harvest`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center shadow-lg">
            <PartyPopper className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-xl">{congrats}</DialogTitle>
          <DialogDescription className="text-center">{daysLine}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          <Button className="w-full" size="lg" onClick={onRecordYield}>
            <ClipboardList className="h-4 w-4 mr-2" />
            {language === 'hi' ? 'उपज दर्ज करें' : language === 'mr' ? 'उत्पादन नोंदवा' : 'Record Yield'}
          </Button>
          <Button variant="outline" className="w-full" onClick={onAddSameCrop}>
            <Repeat className="h-4 w-4 mr-2" />
            {language === 'hi' ? 'वही फसल फिर लगाएं' : language === 'mr' ? 'तेच पीक पुन्हा लावा' : 'Add Same Crop Again'}
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onMoveToHistory}>
            <Archive className="h-4 w-4 mr-2" />
            {language === 'hi' ? 'इतिहास में ले जाएं' : language === 'mr' ? 'इतिहासात हलवा' : 'Move to History'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
