import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CloudRain, AlertTriangle, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { translateNotification, type NotifLike } from '@/lib/notificationActions';

interface Props {
  notif: NotifLike | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onContinue: () => void;
}

export function NotificationDetailModal({ notif, open, onOpenChange, onContinue }: Props) {
  const { language } = useApp();
  if (!notif) return null;
  const isWeather = notif.type === 'weather_warning' || notif.type === 'weather_alert';
  const { title, message } = translateNotification(notif, language);
  const Icon = isWeather ? CloudRain : AlertTriangle;
  const accent = isWeather ? 'text-sky-600 bg-sky-50' : 'text-amber-600 bg-amber-50';

  const advice = isWeather
    ? (language === 'hi'
        ? 'खेत में पानी की निकासी सुनिश्चित करें, छिड़काव से बचें, और कटी हुई फसल को ढक दें।'
        : language === 'mr'
        ? 'शेतातील पाण्याचा निचरा करा, फवारणी टाळा आणि कापलेले पीक झाकून ठेवा.'
        : 'Ensure field drainage, postpone spraying, and cover any harvested produce.')
    : (language === 'hi'
        ? 'एक दिन के लिए विरोधाभासी गतिविधि स्थगित करें या समय बदलें।'
        : language === 'mr'
        ? 'विसंगत क्रियाकलाप एका दिवसासाठी पुढे ढकला किंवा वेळ बदला.'
        : 'Postpone or reschedule the conflicting activity by a day.');

  const ctaLabel = isWeather
    ? (language === 'hi' ? 'स्मार्ट अलर्ट देखें' : language === 'mr' ? 'स्मार्ट अलर्ट पहा' : 'View Smart Alerts')
    : (language === 'hi' ? 'कैलेंडर देखें' : language === 'mr' ? 'कॅलेंडर पहा' : 'View Calendar');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className={`mx-auto mb-2 h-12 w-12 rounded-full flex items-center justify-center ${accent}`}>
            <Icon className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center whitespace-pre-wrap">{message}</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-muted/60 p-3 text-sm">
          <p className="font-medium mb-1">
            {language === 'hi' ? 'सलाह' : language === 'mr' ? 'सल्ला' : 'Advice'}
          </p>
          <p className="text-muted-foreground">{advice}</p>
        </div>
        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'hi' ? 'बंद करें' : language === 'mr' ? 'बंद करा' : 'Close'}
          </Button>
          <Button onClick={onContinue}>
            {ctaLabel} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
