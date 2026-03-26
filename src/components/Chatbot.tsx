import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Volume2, VolumeX, Loader2, Maximize2, Minimize2, GripVertical, Sparkles, Image as ImageIcon, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string; role: 'user' | 'bot'; content: string; timestamp: Date; imageUrl?: string;
}

const quickQuestions = [
  { en: 'How to treat crop diseases?', hi: 'फसल रोगों का इलाज कैसे करें?', mr: 'पिकांच्या रोगांवर उपचार कसे करावे?' },
  { en: 'Best fertilizer for wheat?', hi: 'गेहूं के लिए सबसे अच्छा उर्वरक?', mr: 'गव्हासाठी सर्वोत्तम खत?' },
  { en: 'Government schemes for farmers', hi: 'किसानों के लिए सरकारी योजनाएं', mr: 'शेतकऱ्यांसाठी सरकारी योजना' },
  { en: 'Weather preparation tips', hi: 'मौसम की तैयारी के टिप्स', mr: 'हवामान तयारीच्या टिप्स' },
];

const greetings = {
  en: "Hello! 🌱 I'm Patil, your AI farming assistant. Ask me anything about crops, soil, weather, or schemes!",
  hi: "नमस्ते! 🌱 मैं पाटिल, आपका AI कृषि सहायक हूं। फसल, मिट्टी, मौसम या योजनाओं के बारे में कुछ भी पूछें!",
  mr: "नमस्कार! 🌱 मी पाटील, तुमचा AI शेती सहाय्यक. पीक, माती, हवामान किंवा योजनांबद्दल काहीही विचारा!"
};

const placeholders = {
  en: "Ask Patil anything...", hi: "पाटिल से कुछ भी पूछें...", mr: "पाटीलला काहीही विचारा..."
};

type Size = 'small' | 'medium' | 'large';
const sizeConfig = { small: { width: 380, height: 500 }, medium: { width: 440, height: 600 }, large: { width: 520, height: 700 } };

export function Chatbot() {
  const { language } = useApp();
  const lang = language as 'en' | 'hi' | 'mr';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'bot', content: greetings[lang], timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [chatSize, setChatSize] = useState<Size>('small');
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (position.x === -1 && isOpen) {
      setPosition({ x: window.innerWidth - sizeConfig[chatSize].width - 16, y: window.innerHeight - sizeConfig[chatSize].height - 80 });
    }
  }, [isOpen]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === '1') return [{ ...prev[0], content: greetings[lang] }];
      return prev;
    });
  }, [lang]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!chatRef.current) return;
    const rect = chatRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      setPosition({ x: Math.max(0, Math.min(window.innerWidth - sizeConfig[chatSize].width, e.clientX - dragOffset.current.x)), y: Math.max(0, Math.min(window.innerHeight - sizeConfig[chatSize].height, e.clientY - dragOffset.current.y)) });
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isDragging, chatSize]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: TouchEvent) => {
      const t = e.touches[0];
      setPosition({ x: Math.max(0, Math.min(window.innerWidth - sizeConfig[chatSize].width, t.clientX - dragOffset.current.x)), y: Math.max(0, Math.min(window.innerHeight - sizeConfig[chatSize].height, t.clientY - dragOffset.current.y)) });
    };
    const handleEnd = () => setIsDragging(false);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
    return () => { window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleEnd); };
  }, [isDragging, chatSize]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!chatRef.current) return;
    const rect = chatRef.current.getBoundingClientRect();
    const t = e.touches[0];
    dragOffset.current = { x: t.clientX - rect.left, y: t.clientY - rect.top };
    setIsDragging(true);
  }, []);

  const cycleSize = () => {
    const sizes: Size[] = ['small', 'medium', 'large'];
    const next = sizes[(sizes.indexOf(chatSize) + 1) % sizes.length];
    setChatSize(next);
    setPosition(prev => ({ x: Math.min(prev.x, window.innerWidth - sizeConfig[next].width), y: Math.min(prev.y, window.innerHeight - sizeConfig[next].height) }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() && !selectedImage) return;
    
    let imageDataUrl = imagePreview;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text || (lang === 'hi' ? '📷 चित्र भेजा' : lang === 'mr' ? '📷 चित्र पाठवले' : '📷 Image sent'), timestamp: new Date(), imageUrl: imageDataUrl || undefined };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsTyping(true);

    try {
      const conversationHistory = messages.slice(-6).map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content,
      }));

      const body: any = { message: text, language: lang, conversationHistory };
      if (imageDataUrl) body.imageUrl = imageDataUrl;

      const { data, error } = await supabase.functions.invoke('chatbot-ai', { body });
      if (error) throw error;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(), role: 'bot',
        content: data.reply || 'Sorry, something went wrong.', timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', content: 'Network error. Please try again.', timestamp: new Date() }]);
    } finally { setIsTyping(false); }
  };

  const speakMessage = (msg: Message) => {
    if (isSpeaking && speakingMsgId === msg.id) { window.speechSynthesis.cancel(); setIsSpeaking(false); setSpeakingMsgId(null); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(msg.content.replace(/[*#_`]/g, ''));
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-US';
    utterance.rate = 0.9;
    utterance.onend = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
    utterance.onerror = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
    setIsSpeaking(true); setSpeakingMsgId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };
  const currentSize = sizeConfig[chatSize];

  return (
    <>
      <button onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full hero-gradient shadow-lg transition-all duration-300 hover:scale-110 ${isOpen ? 'scale-0' : 'scale-100'}`}>
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </button>

      <div ref={chatRef} style={{
        position: 'fixed', left: position.x >= 0 ? position.x : undefined, top: position.y >= 0 ? position.y : undefined,
        right: position.x < 0 ? 16 : undefined, bottom: position.y < 0 ? 80 : undefined,
        width: `min(${currentSize.width}px, calc(100vw - 2rem))`, height: `min(${currentSize.height}px, 80vh)`, zIndex: 50,
      }} className={`flex flex-col rounded-2xl bg-card shadow-2xl border border-border transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border hero-gradient rounded-t-2xl cursor-move select-none"
          onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-primary-foreground/50" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-primary-foreground">Patil AI 🌾</h3>
              <p className="text-[10px] text-primary-foreground/70">{lang === 'hi' ? 'AI कृषि सहायक' : lang === 'mr' ? 'AI शेती सहाय्यक' : 'Smart Farm Assistant'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={cycleSize} className="rounded-full p-1 hover:bg-primary-foreground/20 transition-colors">
              {chatSize === 'large' ? <Minimize2 className="h-4 w-4 text-primary-foreground" /> : <Maximize2 className="h-4 w-4 text-primary-foreground" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-primary-foreground/20 transition-colors">
              <X className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${message.role === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
                {message.role === 'user' ? <span className="text-xs text-primary-foreground">You</span> : <Sparkles className="h-3.5 w-3.5 text-secondary-foreground" />}
              </div>
              <div className="max-w-[80%]">
                {message.imageUrl && (
                  <img src={message.imageUrl} alt="Shared" className="max-w-full rounded-lg mb-1 max-h-40 object-cover" />
                )}
                <div className={`rounded-2xl px-3 py-2 ${message.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                  {message.role === 'bot' ? (
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : <p className="text-sm whitespace-pre-line">{message.content}</p>}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {message.role === 'bot' && (
                    <button onClick={() => speakMessage(message)} className="p-1 rounded-full hover:bg-muted transition-colors">
                      {isSpeaking && speakingMsgId === message.id ? <VolumeX className="h-3 w-3 text-primary" /> : <Volume2 className="h-3 w-3 text-muted-foreground" />}
                    </button>
                  )}
                  <span className="text-[9px] text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary"><Sparkles className="h-3.5 w-3.5 text-secondary-foreground" /></div>
              <div className="bg-muted rounded-2xl rounded-tl-none px-3 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">{lang === 'hi' ? 'सोच रहा हूं...' : lang === 'mr' ? 'विचार करतोय...' : 'Thinking...'}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="px-3 pb-1">
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-16 rounded-lg" />
              <button onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
            </div>
          </div>
        )}

        {/* Quick Questions */}
        <div className="px-3 pb-1">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {quickQuestions.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q[lang])} className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">{q[lang]}</button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border">
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholders[lang]}
            className="flex-1 input-field py-2 text-sm" disabled={isTyping} />
          <Button type="submit" size="icon" disabled={(!input.trim() && !selectedImage) || isTyping} className="h-8 w-8">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
