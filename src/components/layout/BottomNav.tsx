import { Link, useLocation } from 'react-router-dom';
import { Users, User, Newspaper, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard', authOnly: true },
  { path: '/community', icon: Users, label: 'Community' },
  { path: '/news', icon: Newspaper, label: 'News' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  if (['/login', '/signup'].includes(location.pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems
          .filter(item => !item.authOnly || user)
          .map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const href = !user && ['/community', '/messages', '/profile'].includes(item.path) ? '/login' : item.path;
          
          return (
            <Link key={item.path} to={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
