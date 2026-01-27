import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

export default function Signup() {
  const { t, signup, setLanguage } = useApp();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
    accountType: 'farmer' as const,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.phone || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success = signup({
      username: formData.username,
      phone: formData.phone,
      password: formData.password,
      location: formData.location,
      accountType: formData.accountType,
    });
    
    if (success) {
      toast.success('Account created successfully!');
      navigate('/');
    } else {
      toast.error('Username already taken');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl hero-gradient">
              <Leaf className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary">Agri360</span>
          </Link>
        </div>

        {/* Signup Card */}
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          <h1 className="text-2xl font-bold text-center mb-2">{t('createAccount')}</h1>
          <p className="text-muted-foreground text-center mb-6">
            Join thousands of farmers using Agri360
          </p>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-12 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">{t('username')} *</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="Choose a username"
                  className="input-field"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phoneNumber')} *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 9876543210"
                  className="input-field"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')} *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Min 6 characters"
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')} *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm password"
                  className="input-field"
                />
              </div>

              {/* Next Button */}
              <Button type="submit" className="w-full btn-primary">
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location (Village/District/State)</Label>
                <Input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g., Nashik, Maharashtra"
                  className="input-field"
                />
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <Label htmlFor="accountType">{t('accountType')}</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value) => handleChange('accountType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmer">{t('farmer')}</SelectItem>
                    <SelectItem value="agribusiness">{t('agribusiness')}</SelectItem>
                    <SelectItem value="student">{t('student')}</SelectItem>
                    <SelectItem value="agronomist">{t('agronomist')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label>{t('language')}</Label>
                <div className="flex gap-2">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'hi', label: 'हिंदी' },
                    { code: 'mr', label: 'मराठी' },
                  ].map((lang) => (
                    <Button
                      key={lang.code}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setLanguage(lang.code as any)}
                    >
                      {lang.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : t('signup')}
                </Button>
              </div>
            </form>
          )}

          {/* Login Link */}
          <p className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
