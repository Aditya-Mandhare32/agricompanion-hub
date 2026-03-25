import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { 
  Menu, X, Bell, User, LogOut, Globe, Leaf, FileText, Sprout,
  Calendar, Users, Newspaper, MessageCircle, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { path: '/dashboard', label: 'dashboard', icon: BarChart3, authOnly: true },
  { path: '/soil-report', label: 'soilReport', icon: FileText },
  { path: '/calendar', label: 'calendar', icon: Calendar },
  { path: '/community', label: 'community', icon: Users },
  { path: '/news', label: 'news', icon: Newspaper },
];

export function Header() {
  const { t, language, setLanguage, unreadCount, notifications, markNotificationRead } = useApp();
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'mr', label: 'मराठी' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 glass-effect">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl hero-gradient">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">Agri360</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems
            .filter(item => !item.authOnly || user)
            .map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
                <Icon className="h-4 w-4" />
                {t(item.label as any)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code as any)}
                  className={language === lang.code ? 'bg-primary/10 text-primary' : ''}>
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
                <Link to="/messages"><MessageCircle className="h-5 w-5" /></Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-2 font-semibold border-b">Notifications</div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">No notifications</div>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <DropdownMenuItem key={notif.id} onClick={() => markNotificationRead(notif.id)}
                          className={`flex flex-col items-start gap-1 p-3 ${!notif.read ? 'bg-primary/5' : ''}`}>
                          <span className="font-medium">{notif.cropName}</span>
                          <span className="text-sm text-muted-foreground">{notif.message}</span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>{profile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="font-medium">{profile?.username}</p>
                    <p className="text-sm text-muted-foreground">{profile?.location}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/profile" className="flex items-center gap-2"><User className="h-4 w-4" />{t('profile')}</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/messages" className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />Messages</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive"><LogOut className="h-4 w-4 mr-2" />{t('logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" asChild><Link to="/login">{t('login')}</Link></Button>
              <Button asChild><Link to="/signup">{t('signup')}</Link></Button>
            </div>
          )}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.filter(item => !item.authOnly || user).map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className={`nav-link ${isActive ? 'active' : ''}`}>
                      <Icon className="h-5 w-5" />{t(item.label as any)}
                    </Link>
                  );
                })}
                <div className="border-t my-4" />
                <div className="px-4 py-2">
                  <p className="text-sm font-medium mb-2">{t('language')}</p>
                  <div className="flex gap-2">
                    {languages.map((lang) => (
                      <Button key={lang.code} variant={language === lang.code ? 'default' : 'outline'} size="sm" onClick={() => setLanguage(lang.code as any)}>{lang.label}</Button>
                    ))}
                  </div>
                </div>
                {!user && (
                  <>
                    <div className="border-t my-4" />
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="nav-link">{t('login')}</Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn-primary mx-4">{t('signup')}</Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
