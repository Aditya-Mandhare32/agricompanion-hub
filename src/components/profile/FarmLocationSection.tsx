import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props { language: string }

export function FarmLocationSection({ language }: Props) {
  const { profile, updateProfile } = useAuth();
  const [lat, setLat] = useState<string>(profile?.farm_latitude?.toString() ?? '');
  const [lon, setLon] = useState<string>(profile?.farm_longitude?.toString() ?? '');
  const [label, setLabel] = useState<string>(profile?.farm_location_label ?? '');
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);

  const hasSaved = profile?.farm_latitude != null && profile?.farm_longitude != null;

  const useGps = () => {
    if (!('geolocation' in navigator)) {
      toast.error(language === 'hi' ? 'जीपीएस उपलब्ध नहीं' : language === 'mr' ? 'जीपीएस उपलब्ध नाही' : 'GPS not available');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success(language === 'hi' ? 'स्थान मिल गया' : language === 'mr' ? 'ठिकाण मिळाले' : 'Location detected');
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || 'Could not get GPS');
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true },
    );
  };

  const save = async () => {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (!isFinite(latNum) || !isFinite(lonNum) || Math.abs(latNum) > 90 || Math.abs(lonNum) > 180) {
      toast.error(language === 'hi' ? 'अमान्य निर्देशांक' : language === 'mr' ? 'अवैध निर्देशांक' : 'Invalid coordinates');
      return;
    }
    setBusy(true);
    try {
      await updateProfile({
        farm_latitude: latNum,
        farm_longitude: lonNum,
        farm_location_label: label || null,
      } as any);
      toast.success(language === 'hi' ? 'खेत का स्थान सहेजा गया' : language === 'mr' ? 'शेताचे ठिकाण जतन झाले' : 'Farm location saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    try {
      await updateProfile({ farm_latitude: null, farm_longitude: null, farm_location_label: null } as any);
      setLat(''); setLon(''); setLabel('');
      toast.success(language === 'hi' ? 'हटाया गया' : language === 'mr' ? 'काढले' : 'Cleared');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {language === 'hi' ? 'खेत का स्थान' : language === 'mr' ? 'शेताचे ठिकाण' : 'Farm Location'}
        </CardTitle>
        <CardDescription>
          {language === 'hi' ? 'मौसम और स्मार्ट सूचनाएं इसी स्थान का उपयोग करेंगी' :
           language === 'mr' ? 'हवामान आणि स्मार्ट सूचना याच ठिकाणाचा वापर करतील' :
           'Weather and smart notifications will use these coordinates'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Latitude</Label>
            <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 18.5204" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Longitude</Label>
            <Input value={lon} onChange={(e) => setLon(e.target.value)} placeholder="e.g. 73.8567" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            {language === 'hi' ? 'लेबल (वैकल्पिक)' : language === 'mr' ? 'लेबल (पर्यायी)' : 'Label (optional)'}
          </Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="My main farm" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={useGps} disabled={locating}>
            {locating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
            {language === 'hi' ? 'वर्तमान जीपीएस' : language === 'mr' ? 'सध्याचा जीपीएस' : 'Use Current GPS'}
          </Button>
          <Button onClick={save} disabled={busy || !lat || !lon}>
            <Save className="h-4 w-4 mr-2" />
            {language === 'hi' ? 'सहेजें' : language === 'mr' ? 'जतन करा' : 'Save'}
          </Button>
          {hasSaved && (
            <Button variant="ghost" onClick={clear} disabled={busy} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {language === 'hi' ? 'हटाएं' : language === 'mr' ? 'काढा' : 'Clear'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
