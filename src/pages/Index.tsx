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
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Upload,
    titleKey: 'ocrAnalysis',
    descKey: 'ocrDesc',
    path: '/soil-report',
    color: 'from-primary to-primary/80',
  },
  {
    icon: Sprout,
    titleKey: 'cropRecommendations',
    descKey: 'cropDesc',
    path: '/crops',
    color: 'from-secondary to-secondary/80',
  },
  {
    icon: FlaskConical,
    titleKey: 'fertilizerPlanner',
    descKey: 'fertilizerDesc',
    path: '/crops',
    color: 'from-accent to-accent/80',
  },
  {
    icon: Calendar,
    titleKey: 'smartCalendar',
    descKey: 'calendarDesc',
    path: '/calendar',
    color: 'from-sky-500 to-sky-600',
  },
  {
    icon: Users,
    titleKey: 'farmerCommunity',
    descKey: 'communityDesc',
    path: '/community',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Newspaper,
    titleKey: 'dailyNews',
    descKey: 'newsDesc',
    path: '/news',
    color: 'from-rose-500 to-rose-600',
  },
];

const stats = [
  { value: '50K+', label: 'Farmers' },
  { value: '100+', label: 'Crops Supported' },
  { value: '95%', label: 'Accuracy' },
  { value: '15+', label: 'Languages' },
];

const testimonials = [
  {
    name: 'Ramesh Patil',
    location: 'Nashik, Maharashtra',
    text: 'Agri360 helped me increase my grape yield by 30% with personalized fertilizer recommendations!',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ramesh',
  },
  {
    name: 'Lakshmi Devi',
    location: 'Guntur, Andhra Pradesh',
    text: 'The crop calendar feature is amazing. I never miss important farming activities now.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lakshmi',
  },
  {
    name: 'Suresh Kumar',
    location: 'Indore, MP',
    text: 'Best platform for soil analysis. The OCR feature reads my reports accurately every time.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suresh',
  },
];

export default function Index() {
  const { t, isAuthenticated } = useApp();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden hero-gradient py-20 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg"
              >
                <Link to="/soil-report">
                  <Upload className="h-5 w-5 mr-2" />
                  {t('uploadSoilReport')}
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/calendar">
                  <Calendar className="h-5 w-5 mr-2" />
                  {t('viewCalendar')}
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div 
                key={stat.label} 
                className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-primary-foreground/70 text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t('features')}
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Everything you need to modernize your farming practices and increase your yield
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link 
                  key={feature.titleKey}
                  to={feature.path}
                  className="feature-card group"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {t(feature.titleKey as any)}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t(feature.descKey as any)}
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-primary font-medium">
                    Learn more
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Get personalized farming recommendations in just 3 simple steps
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                title: 'Upload Soil Report',
                description: 'Upload your soil test report image or PDF. Our OCR extracts all the data automatically.',
                icon: Upload,
              },
              {
                step: 2,
                title: 'Get AI Analysis',
                description: 'Our AI analyzes your soil data and matches it with our crop database of 22+ crops.',
                icon: TrendingUp,
              },
              {
                step: 3,
                title: 'Plan & Grow',
                description: 'Get personalized crop recommendations, fertilizer plans, and add them to your calendar.',
                icon: Sprout,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full hero-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                  {item.step < 3 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-primary/30" />
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Trusted by Farmers
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            See what farmers across India are saying about Agri360
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial.name}
                className="bg-card rounded-2xl p-6 shadow-lg border border-border"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-primary-foreground/90 mb-8 max-w-xl mx-auto">
            Join thousands of farmers who are already using Agri360 to increase their yield and profits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button 
                asChild 
                size="lg" 
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
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
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  <Link to="/signup">
                    Create Free Account
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline" 
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Link to="/login">Login</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
