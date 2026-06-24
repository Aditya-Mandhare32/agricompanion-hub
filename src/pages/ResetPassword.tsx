import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Leaf, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';

export default function ResetPassword() {
  const { language } = useApp();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [recovering, setRecovering] = useState(true);

  const t = (en: string, hi: string, mr: string) =>
    language === 'hi' ? hi : language === 'mr' ? mr : en;

  useEffect(() => {
    // Supabase puts a recovery session in the URL hash; the SDK auto-applies it.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setRecovering(false);
      }
    });
    // Also accept already-signed-in users opening this page directly.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setRecovering(false);
    });
    const timeout = setTimeout(() => setRecovering(false), 1500);
    return () => { sub.subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error(t('Password must be at least 8 characters', 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए', 'पासवर्ड किमान 8 अक्षरांचा हवा'));
    if (password !== confirm) return toast.error(t('Passwords do not match', 'पासवर्ड मेल नहीं खाते', 'पासवर्ड जुळत नाहीत'));
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success(t('Password updated successfully', 'पासवर्ड सफलतापूर्वक अपडेट हुआ', 'पासवर्ड यशस्वीरित्या अद्यतनित'));
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl hero-gradient">
              <Leaf className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary">AI Farmer Guidance</span>
          </div>
        </div>
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          {done ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
              <h1 className="text-2xl font-bold">{t('All set!', 'सब तैयार!', 'सर्व तयार!')}</h1>
              <p className="text-muted-foreground">{t('Redirecting to login...', 'लॉगिन पर भेजा जा रहा है...', 'लॉगिनवर पाठवत आहे...')}</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center mb-2">{t('Create New Password', 'नया पासवर्ड बनाएं', 'नवीन पासवर्ड तयार करा')}</h1>
              <p className="text-muted-foreground text-center mb-6 text-sm">
                {t('Choose a strong password (min 8 characters).', 'मजबूत पासवर्ड चुनें (न्यूनतम 8 अक्षर)।', 'मजबूत पासवर्ड निवडा (किमान 8 अक्षरे).')}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pwd">{t('New password', 'नया पासवर्ड', 'नवीन पासवर्ड')}</Label>
                  <div className="relative">
                    <Input id="pwd" type={show ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)} className="input-field pr-10" />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">{t('Confirm password', 'पासवर्ड पुष्टि करें', 'पासवर्ड पुष्टी करा')}</Label>
                  <Input id="confirm" type={show ? 'text' : 'password'} value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} className="input-field" />
                </div>
                <Button type="submit" className="w-full btn-primary" disabled={loading || recovering}>
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t('Updating...', 'अपडेट हो रहा है...', 'अद्यतनित होत आहे...')}</> : t('Update Password', 'पासवर्ड अपडेट करें', 'पासवर्ड अद्यतनित करा')}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
