import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  'How to treat crop diseases?',
  'Best fertilizer for wheat?',
  'Government schemes for farmers',
  'Weather preparation tips',
];

const botResponses: { [key: string]: string } = {
  disease: `Common crop diseases can be managed by:
1. **Crop rotation** - Prevents disease buildup
2. **Resistant varieties** - Choose disease-resistant seeds
3. **Proper spacing** - Allows air circulation
4. **Fungicide application** - Use organic or chemical as needed
5. **Remove infected plants** - Prevent spread

For specific diseases, please upload a photo of the affected plant.`,
  
  fertilizer: `Fertilizer recommendations depend on your crop and soil:

**For Wheat:**
- Basal: 50 kg DAP/ha at sowing
- First top dress: 30 kg Urea/ha at 21 days
- Second top dress: 20 kg Urea/ha at 45 days

**For Rice:**
- Basal: 60 kg NPK (10-26-26)/ha
- First top dress: 40 kg Urea/ha at tillering
- Second: 30 kg Urea/ha at panicle initiation

Upload your soil report for personalized recommendations!`,

  scheme: `Current Government Schemes for Farmers:

🌾 **PM-KISAN**: ₹6,000/year direct benefit
📱 **Kisan Credit Card**: Easy crop loans at 4% interest  
🌱 **PMFBY**: Crop insurance at low premiums
💧 **PM Krishi Sinchai Yojana**: Irrigation support
🚜 **SMAM**: Subsidy on farm machinery

Visit your local agriculture office or CSC for applications.`,

  weather: `Weather Preparation Tips:

**For Heavy Rainfall:**
- Ensure proper field drainage
- Delay fertilizer application
- Protect harvested crops

**For Drought:**
- Use drip/sprinkler irrigation
- Apply mulching to retain moisture
- Choose drought-resistant varieties

**For Frost:**
- Light irrigation before frost
- Cover nurseries with plastic sheets
- Avoid nitrogen fertilizers before frost`,

  default: `I'm here to help with:
- 🌱 Crop disease identification & treatment
- 🧪 Fertilizer recommendations
- 🏛️ Government schemes & subsidies
- 🌤️ Weather preparation tips
- 📊 Soil analysis guidance

Please ask your question or choose from the quick options above!`,
};

function getBotResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('disease') || lowerMessage.includes('pest') || lowerMessage.includes('treat')) {
    return botResponses.disease;
  }
  if (lowerMessage.includes('fertilizer') || lowerMessage.includes('fertiliser') || lowerMessage.includes('urea') || lowerMessage.includes('dap')) {
    return botResponses.fertilizer;
  }
  if (lowerMessage.includes('scheme') || lowerMessage.includes('government') || lowerMessage.includes('subsidy') || lowerMessage.includes('loan')) {
    return botResponses.scheme;
  }
  if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('frost') || lowerMessage.includes('drought')) {
    return botResponses.weather;
  }
  
  return botResponses.default;
}

export function Chatbot() {
  const { isAuthenticated } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: 'Namaste! 🙏 I\'m your farming assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (text: string) => {
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

    // Simulate bot response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: getBotResponse(text),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full hero-gradient shadow-lg transition-all duration-300 hover:scale-110 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageCircle className="h-6 w-6 text-primary-foreground" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex h-[500px] w-[350px] flex-col rounded-2xl bg-card shadow-2xl border border-border transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border hero-gradient rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">Farming Assistant</h3>
              <p className="text-xs text-primary-foreground/70">Online</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1 hover:bg-primary-foreground/20 transition-colors"
          >
            <X className="h-5 w-5 text-primary-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === 'user' ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <Bot className="h-4 w-4 text-secondary-foreground" />
                )}
              </div>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted rounded-tl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Bot className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {q}
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
            placeholder="Type your question..."
            className="flex-1 input-field py-2 text-sm"
          />
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
