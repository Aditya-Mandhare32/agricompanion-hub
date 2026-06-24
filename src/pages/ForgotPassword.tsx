import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Leaf, Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';

export default function ForgotPassword() {
  const { language } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const t = (en: string, hi: string, mr: string) =>
    language === 'hi' ? hi : language === 'mr' ? mr : en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error(t('Enter your email', 'अपना ईमेल दर्ज करें', 'तुमचा ईमेल टाका'));
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success(t('Reset link sent. Check your inbox.', 'रीसेट लिंक भेजा गया। अपना इनबॉक्स देखें।', 'रीसेट लिंक पाठवली. इनबॉक्स तपासा.'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl hero-gradient">
              <Leaf className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary">AI Farmer Guidance</span>
          </Link>
        </div>
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
              <h1 className="text-2xl font-bold">{t('Check your email', 'अपना ईमेल देखें', 'ईमेल तपासा')}</h1>
              <p className="text-muted-foreground">
                {t(
                  `We sent a password reset link to ${email}.`,
                  `हमने ${email} पर एक पासवर्ड रीसेट लिंक भेजा है।`,
                  `आम्ही ${email} वर पासवर्ड रीसेट लिंक पाठवली आहे.`,
                )}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login"><ArrowLeft className="h-4 w-4 mr-2" />{t('Back to login', 'लॉगिन पर वापस', 'लॉगिनवर परत')}</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center mb-2">{t('Reset Your Password', 'अपना पासवर्ड रीसेट करें', 'तुमचा पासवर्ड रीसेट करा')}</h1>
              <p className="text-muted-foreground text-center mb-6 text-sm">
                {t('Enter your email and we will send you a reset link.', 'अपना ईमेल दर्ज करें, हम आपको रीसेट लिंक भेजेंगे।', 'तुमचा ईमेल टाका, आम्ही रीसेट लिंक पाठवू.')}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('Email', 'ईमेल', 'ईमेल')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com" className="input-field pl-9" />
                  </div>
                </div>
                <Button type="submit" className="w-full btn-primary" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t('Sending...', 'भेजा जा रहा है...', 'पाठवत आहे...')}</> : t('Send Reset Link', 'रीसेट लिंक भेजें', 'रीसेट लिंक पाठवा')}
                </Button>
              </form>
              <p className="text-center mt-6 text-sm">
                <Link to="/login" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" />{t('Back to login', 'लॉगिन पर वापस', 'लॉगिनवर परत')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
