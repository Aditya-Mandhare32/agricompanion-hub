import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface QuickQuestion {
  en: string;
  hi: string;
  mr: string;
}

const quickQuestions: QuickQuestion[] = [
  { en: 'How to treat crop diseases?', hi: 'फसल रोगों का इलाज कैसे करें?', mr: 'पिकांच्या रोगांवर उपचार कसे करावे?' },
  { en: 'Best fertilizer for wheat?', hi: 'गेहूं के लिए सबसे अच्छा उर्वरक?', mr: 'गव्हासाठी सर्वोत्तम खत?' },
  { en: 'Government schemes for farmers', hi: 'किसानों के लिए सरकारी योजनाएं', mr: 'शेतकऱ्यांसाठी सरकारी योजना' },
  { en: 'Weather preparation tips', hi: 'मौसम की तैयारी के टिप्स', mr: 'हवामान तयारीच्या टिप्स' },
];

const greetings = {
  en: "Namaste! 🙏 I'm Patil, your farming buddy. Ask me anything about crops, soil, weather, or schemes — I'm here to help, dost!",
  hi: "नमस्ते दोस्त! 🙏 मैं पाटील हूं, तुम्हारा खेती का साथी। फसल, मिट्टी, मौसम या सरकारी योजनाओं के बारे में कुछ भी पूछो — मैं यहां मदद के लिए हूं!",
  mr: "नमस्कार मित्रा! 🙏 मी पाटील आहे, तुमचा शेतीचा सोबती. पीक, माती, हवामान किंवा सरकारी योजनांबद्दल काहीही विचारा — मी मदतीसाठी आहे!"
};

const placeholders = {
  en: "Ask Patil anything...",
  hi: "पाटिल से कुछ भी पूछें...",
  mr: "पाटीलला काहीही विचारा..."
};

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === '1') {
        return [{ ...prev[0], content: greetings[lang] }];
      }
      return prev;
    });
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const conversationHistory = messages.slice(-6).map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('chatbot-ai', {
        body: { message: text, language: lang, conversationHistory },
      });

      if (error) throw error;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: data.reply || (lang === 'hi' ? 'माफ करें, कोई त्रुटि हुई।' : lang === 'mr' ? 'क्षमा करा, त्रुटी झाली.' : 'Sorry, something went wrong.'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chatbot error:', err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: lang === 'hi' ? 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।' : lang === 'mr' ? 'नेटवर्क त्रुटी. कृपया पुन्हा प्रयत्न करा.' : 'Network error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const speakMessage = (msg: Message) => {
    if (isSpeaking && speakingMsgId === msg.id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(msg.content.replace(/[*#_`]/g, ''));
    if (lang === 'hi') utterance.lang = 'hi-IN';
    else if (lang === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onend = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
    utterance.onerror = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
    
    setIsSpeaking(true);
    setSpeakingMsgId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full hero-gradient shadow-lg transition-all duration-300 hover:scale-110 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageCircle className="h-6 w-6 text-primary-foreground" />
      </button>

      <div
        className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex h-[70vh] max-h-[500px] w-[calc(100vw-2rem)] max-w-[350px] flex-col rounded-2xl bg-card shadow-2xl border border-border transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border hero-gradient rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Patil 🌾</h3>
              <p className="text-xs text-primary-foreground/70">
                {lang === 'hi' ? 'AI कृषि सहायक' : lang === 'mr' ? 'AI शेती सहाय्यक' : 'AI Farm Assistant'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-primary-foreground/20 transition-colors">
            <X className="h-5 w-5 text-primary-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${message.role === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
                {message.role === 'user' ? <User className="h-4 w-4 text-primary-foreground" /> : <Bot className="h-4 w-4 text-secondary-foreground" />}
              </div>
              <div className="max-w-[75%]">
                <div className={`rounded-2xl px-4 py-2 ${message.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
                {message.role === 'bot' && (
                  <button
                    onClick={() => speakMessage(message)}
                    className="mt-1 p-1 rounded-full hover:bg-muted transition-colors"
                    title={lang === 'hi' ? 'सुनें' : lang === 'mr' ? 'ऐका' : 'Listen'}
                  >
                    {isSpeaking && speakingMsgId === message.id 
                      ? <VolumeX className="h-3.5 w-3.5 text-primary" /> 
                      : <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Bot className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {lang === 'hi' ? 'सोच रहा हूं...' : lang === 'mr' ? 'विचार करतोय...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickQuestions.map((q, index) => (
              <button
                key={index}
                onClick={() => sendMessage(q[lang])}
                className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {q[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t border-border">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholders[lang]}
            className="flex-1 input-field py-2 text-sm"
            disabled={isTyping}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
