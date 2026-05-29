import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';
import { Chatbot } from '@/components/Chatbot';
import { useCommunityNotifications } from '@/hooks/useCommunityNotifications';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useCommunityNotifications();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <Chatbot />
    </div>
  );
}
