import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Notification, Post, CropEvent, SoilData } from '@/lib/types';
import { Language, getTranslation, TranslationKey } from '@/lib/translations';

interface AppContextType {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  signup: (data: Partial<User> & { password: string }) => boolean;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  markNotificationRead: (id: string) => void;
  unreadCount: number;
  
  // Posts
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>) => void;
  likePost: (postId: string) => void;
  deletePost: (postId: string) => void;
  editPost: (postId: string, content: string) => void;
  
  // Calendar Events
  events: CropEvent[];
  addEvent: (event: Omit<CropEvent, 'id'>) => void;
  updateEvent: (id: string, data: Partial<CropEvent>) => void;
  deleteEvent: (id: string) => void;
  
  // Soil Data
  currentSoilData: SoilData | null;
  setSoilData: (data: SoilData) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Demo users for authentication
const demoUsers: { [key: string]: { password: string; user: User } } = {
  demo: {
    password: 'demo123',
    user: {
      id: '1',
      username: 'demo',
      phone: '+91 9876543210',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      location: 'Nashik, Maharashtra',
      landOwned: '5 acres',
      accountType: 'farmer',
      language: 'en',
    },
  },
};

// Sample posts
const samplePosts: Post[] = [
  {
    id: '1',
    userId: '2',
    username: 'RajeshFarmer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
    location: 'Pune, Maharashtra',
    content: 'Just harvested my wheat crop! Great yield this season thanks to proper soil analysis. 🌾',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600',
    timestamp: new Date(Date.now() - 3600000 * 2),
    likes: ['1', '3'],
    comments: [],
  },
  {
    id: '2',
    userId: '3',
    username: 'KisanSita',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sita',
    location: 'Nagpur, Maharashtra',
    content: 'The new drip irrigation system has reduced water usage by 40%! Highly recommend for cotton farming.',
    timestamp: new Date(Date.now() - 3600000 * 5),
    likes: ['1'],
    comments: [],
  },
  {
    id: '3',
    userId: '4',
    username: 'ModernKisan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=modern',
    location: 'Aurangabad, Maharashtra',
    content: 'Weather forecast says good rainfall coming. Perfect time for sowing! 🌧️',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600',
    timestamp: new Date(Date.now() - 3600000 * 24),
    likes: [],
    comments: [],
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguageState] = useState<Language>('en');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [posts, setPosts] = useState<Post[]>(samplePosts);
  const [events, setEvents] = useState<CropEvent[]>([]);
  const [currentSoilData, setCurrentSoilData] = useState<SoilData | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('agri360_user');
    const savedLang = localStorage.getItem('agri360_language');
    const savedNotifications = localStorage.getItem('agri360_notifications');
    const savedPosts = localStorage.getItem('agri360_posts');
    const savedEvents = localStorage.getItem('agri360_events');
    const savedSoilData = localStorage.getItem('agri360_soilData');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedLang) setLanguageState(savedLang as Language);
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    if (savedPosts) {
      const parsedPosts = JSON.parse(savedPosts);
      setPosts(parsedPosts.map((p: Post) => ({ ...p, timestamp: new Date(p.timestamp) })));
    }
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents);
      setEvents(parsedEvents.map((e: CropEvent) => ({ ...e, date: new Date(e.date) })));
    }
    if (savedSoilData) setCurrentSoilData(JSON.parse(savedSoilData));
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (user) localStorage.setItem('agri360_user', JSON.stringify(user));
    else localStorage.removeItem('agri360_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('agri360_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('agri360_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('agri360_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('agri360_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (currentSoilData) {
      localStorage.setItem('agri360_soilData', JSON.stringify(currentSoilData));
    }
  }, [currentSoilData]);

  const login = (username: string, password: string): boolean => {
    const demoUser = demoUsers[username.toLowerCase()];
    if (demoUser && demoUser.password === password) {
      setUser(demoUser.user);
      return true;
    }
    // Check localStorage for registered users
    const registeredUsers = JSON.parse(localStorage.getItem('agri360_registeredUsers') || '{}');
    if (registeredUsers[username] && registeredUsers[username].password === password) {
      setUser(registeredUsers[username].user);
      return true;
    }
    return false;
  };

  const signup = (data: Partial<User> & { password: string }): boolean => {
    const registeredUsers = JSON.parse(localStorage.getItem('agri360_registeredUsers') || '{}');
    if (registeredUsers[data.username || ''] || demoUsers[data.username?.toLowerCase() || '']) {
      return false; // Username taken
    }

    const newUser: User = {
      id: Date.now().toString(),
      username: data.username || '',
      phone: data.phone || '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
      location: data.location || '',
      accountType: data.accountType || 'farmer',
      language: language,
    };

    registeredUsers[data.username || ''] = { password: data.password, user: newUser };
    localStorage.setItem('agri360_registeredUsers', JSON.stringify(registeredUsers));
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agri360_user');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (user) {
      updateUser({ language: lang });
    }
  };

  const t = (key: TranslationKey): string => {
    return getTranslation(language, key);
  };

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const addPost = (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>) => {
    const newPost: Post = {
      ...post,
      id: Date.now().toString(),
      timestamp: new Date(),
      likes: [],
      comments: [],
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const likePost = (postId: string) => {
    if (!user) return;
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          const hasLiked = post.likes.includes(user.id);
          return {
            ...post,
            likes: hasLiked
              ? post.likes.filter(id => id !== user.id)
              : [...post.likes, user.id],
          };
        }
        return post;
      })
    );
  };

  const deletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const editPost = (postId: string, content: string) => {
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, content } : p))
    );
  };

  const addEvent = (event: Omit<CropEvent, 'id'>) => {
    const newEvent: CropEvent = {
      ...event,
      id: Date.now().toString(),
    };
    setEvents(prev => [...prev, newEvent]);

    // Add notification for the event
    addNotification({
      type: event.eventType,
      cropName: event.cropName,
      message: `${event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)} scheduled for ${event.cropName}`,
      date: event.date,
      read: false,
    });
  };

  const updateEvent = (id: string, data: Partial<CropEvent>) => {
    setEvents(prev =>
      prev.map(e => (e.id === id ? { ...e, ...data } : e))
    );
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const setSoilData = (data: SoilData) => {
    setCurrentSoilData(data);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateUser,
        language,
        setLanguage,
        t,
        notifications,
        addNotification,
        markNotificationRead,
        unreadCount,
        posts,
        addPost,
        likePost,
        deletePost,
        editPost,
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        currentSoilData,
        setSoilData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
