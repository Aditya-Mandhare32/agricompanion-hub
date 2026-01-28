import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Layout } from '@/components/layout/Layout';
import { 
  Upload, 
  Calendar, 
  Sprout, 
  FlaskConical, 
  Users, 
  Newspaper,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Leaf,
  CloudRain,
  Sun,
  Thermometer,
  BarChart3,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Upload,
    titleKey: 'ocrAnalysis',
    descKey: 'ocrDesc',
    path: '/soil-report',
    color: 'from-primary to-primary/80',
    image: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=400',
  },
  {
    icon: Sprout,
    titleKey: 'cropRecommendations',
    descKey: 'cropDesc',
    path: '/crops',
    color: 'from-emerald-500 to-emerald-600',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400',
  },
  {
    icon: FlaskConical,
    titleKey: 'fertilizerPlanner',
    descKey: 'fertilizerDesc',
    path: '/crops',
    color: 'from-amber-500 to-amber-600',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  },
  {
    icon: Calendar,
    titleKey: 'smartCalendar',
    descKey: 'calendarDesc',
    path: '/calendar',
    color: 'from-sky-500 to-sky-600',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
  },
  {
    icon: Users,
    titleKey: 'farmerCommunity',
    descKey: 'communityDesc',
    path: '/community',
    color: 'from-purple-500 to-purple-600',
    image: 'https://images.unsplash.com/photo-1593113598332-cd59c5a68a1a?w=400',
  },
  {
    icon: Newspaper,
    titleKey: 'dailyNews',
    descKey: 'newsDesc',
    path: '/news',
    color: 'from-rose-500 to-rose-600',
    image: 'https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?w=400',
  },
];

const stats = [
  { value: '50K+', label: 'Farmers', icon: Users },
  { value: '22+', label: 'Crops Supported', icon: Sprout },
  { value: '95%', label: 'Accuracy', icon: BarChart3 },
  { value: '3', label: 'Languages', icon: Shield },
];

const testimonials = [
  {
    name: 'Ramesh Patil',
    location: 'Nashik, Maharashtra',
    text: 'Agri360 helped me increase my grape yield by 30% with personalized fertilizer recommendations!',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ramesh',
    crop: 'Grapes',
  },
  {
    name: 'Lakshmi Devi',
    location: 'Guntur, Andhra Pradesh',
    text: 'The crop calendar feature is amazing. I never miss important farming activities now.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lakshmi',
    crop: 'Cotton',
  },
  {
    name: 'Suresh Kumar',
    location: 'Indore, MP',
    text: 'Best platform for soil analysis. The OCR feature reads my reports accurately every time.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suresh',
    crop: 'Soybean',
  },
];

const weatherHighlights = [
  { icon: Sun, label: 'Sunny', value: '32°C', color: 'text-amber-500' },
  { icon: CloudRain, label: 'Rainfall', value: '45mm', color: 'text-sky-500' },
  { icon: Thermometer, label: 'Humidity', value: '65%', color: 'text-emerald-500' },
];

export default function Index() {
  const { t, isAuthenticated } = useApp();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920" 
            alt="Agricultural field"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        </div>
        
        {/* Animated Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-primary-foreground">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Leaf className="h-5 w-5 text-secondary" />
                <span className="text-sm font-medium">AI-Powered Smart Agriculture</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('heroTitle')}
              </h1>
              <p className="text-lg md:text-xl opacity-90 mb-8 max-w-lg">
                {t('heroSubtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/30 text-base px-8"
                >
                  <Link to="/soil-report">
                    <Upload className="h-5 w-5 mr-2" />
                    {t('uploadSoilReport')}
                  </Link>
                </Button>
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/30 text-base px-8"
                >
                  <Link to="/calendar">
                    <Calendar className="h-5 w-5 mr-2" />
                    {t('viewCalendar')}
                  </Link>
                </Button>
              </div>

              {/* Quick Weather Widget */}
              <div className="mt-10 flex flex-wrap gap-6">
                {weatherHighlights.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                    <div>
                      <div className="text-xs opacity-70">{item.label}</div>
                      <div className="font-semibold">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="hidden lg:block relative">
              <div className="relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c16?w=600" 
                  alt="Farmer with tablet"
                  className="rounded-2xl shadow-2xl"
                />
                {/* Floating Card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Yield Increase</div>
                      <div className="text-xl font-bold text-emerald-600">+32%</div>
                    </div>
                  </div>
                </div>
                {/* Another Floating Card */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Sprout className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Crops Analyzed</div>
                      <div className="text-xl font-bold text-amber-600">1.2M+</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {stats.map((stat) => (
              <Card 
                key={stat.label} 
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-colors cursor-default"
              >
                <CardContent className="p-6 text-center text-primary-foreground">
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-secondary" />
                  <div className="text-3xl md:text-4xl font-bold mb-1">
                    {stat.value}
                  </div>
                  <div className="opacity-80 text-sm">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('features')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to modernize your farming practices and increase your yield
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link 
                  key={feature.titleKey}
                  to={feature.path}
                  className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Feature Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={feature.image} 
                      alt={feature.titleKey}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className={`absolute bottom-4 left-4 p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {t(feature.titleKey as any)}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {t(feature.descKey as any)}
                    </p>
                    <div className="flex items-center gap-2 text-primary font-medium">
                      Learn more
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get personalized farming recommendations in just 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                title: 'Upload Soil Report',
                description: 'Upload your soil test report image or PDF. Our OCR extracts all the data automatically.',
                icon: Upload,
                image: 'https://images.unsplash.com/photo-1635241161466-541f065683ba?w=400',
              },
              {
                step: 2,
                title: 'Get AI Analysis',
                description: 'Our AI analyzes your soil data and matches it with our crop database of 22+ crops.',
                icon: TrendingUp,
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
              },
              {
                step: 3,
                title: 'Plan & Grow',
                description: 'Get personalized crop recommendations, fertilizer plans, and add them to your calendar.',
                icon: Sprout,
                image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative group">
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative h-48">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute top-4 left-4 w-10 h-10 rounded-full hero-gradient flex items-center justify-center text-primary-foreground font-bold">
                        {item.step}
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </CardContent>
                  </Card>
                  
                  {/* Connector Line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-24 -right-4 w-8">
                      <ArrowRight className="h-8 w-8 text-primary/30" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Farmers
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See what farmers across India are saying about Agri360
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card 
                key={testimonial.name}
                className="relative overflow-hidden hover:shadow-xl transition-shadow group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-bl-full" />
                <CardContent className="p-6 relative">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full ring-2 ring-primary/20"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-xs text-muted-foreground">Growing: </span>
                    <span className="text-xs font-medium text-primary">{testimonial.crop}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920" 
            alt="Field at sunset"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/80" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Transform Your Farm?
            </h2>
            <p className="text-primary-foreground/90 mb-8 text-lg">
              Join thousands of farmers who are already using Agri360 to increase their yield and profits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/30 text-base px-8"
                >
                  <Link to="/soil-report">
                    Get Started Now
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button 
                    asChild 
                    size="lg" 
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/30 text-base px-8"
                  >
                    <Link to="/signup">
                      Create Free Account
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    size="lg" 
                    className="bg-white text-primary hover:bg-white/90 shadow-lg text-base px-8"
                  >
                    <Link to="/login">{t('login')}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
