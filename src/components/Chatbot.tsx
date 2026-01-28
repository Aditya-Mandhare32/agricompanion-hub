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

interface BotResponses {
  [key: string]: {
    en: string;
    hi: string;
    mr: string;
  };
}

const botResponses: BotResponses = {
  disease: {
    en: `Common crop diseases can be managed by:
1. **Crop rotation** - Prevents disease buildup
2. **Resistant varieties** - Choose disease-resistant seeds
3. **Proper spacing** - Allows air circulation
4. **Fungicide application** - Use organic or chemical as needed
5. **Remove infected plants** - Prevent spread

For specific diseases, please upload a photo of the affected plant.`,
    hi: `सामान्य फसल रोगों को इस प्रकार प्रबंधित किया जा सकता है:
1. **फसल चक्र** - रोग संचय को रोकता है
2. **प्रतिरोधी किस्में** - रोग प्रतिरोधी बीज चुनें
3. **उचित दूरी** - हवा का संचार होने देता है
4. **फफूंदनाशक का प्रयोग** - जैविक या रासायनिक आवश्यकतानुसार
5. **संक्रमित पौधों को हटाएं** - प्रसार को रोकें

विशेष रोगों के लिए, कृपया प्रभावित पौधे की फोटो अपलोड करें।`,
    mr: `सामान्य पीक रोगांचे व्यवस्थापन असे करता येते:
1. **पीक फेरपालट** - रोग वाढ रोखते
2. **प्रतिरोधक वाण** - रोग प्रतिरोधक बियाणे निवडा
3. **योग्य अंतर** - हवा खेळती राहते
4. **बुरशीनाशक वापर** - सेंद्रिय किंवा रासायनिक आवश्यकतेनुसार
5. **बाधित रोपे काढा** - प्रसार रोखा

विशिष्ट रोगांसाठी, कृपया बाधित रोपाचा फोटो अपलोड करा.`
  },
  
  fertilizer: {
    en: `Fertilizer recommendations depend on your crop and soil:

**For Wheat:**
- Basal: 50 kg DAP/ha at sowing
- First top dress: 30 kg Urea/ha at 21 days
- Second top dress: 20 kg Urea/ha at 45 days

**For Rice:**
- Basal: 60 kg NPK (10-26-26)/ha
- First top dress: 40 kg Urea/ha at tillering
- Second: 30 kg Urea/ha at panicle initiation

Upload your soil report for personalized recommendations!`,
    hi: `उर्वरक सिफारिशें आपकी फसल और मिट्टी पर निर्भर करती हैं:

**गेहूं के लिए:**
- बुवाई पर: 50 किग्रा DAP/हेक्टेयर
- पहला टॉप ड्रेस: 21 दिन पर 30 किग्रा यूरिया/हेक्टेयर
- दूसरा टॉप ड्रेस: 45 दिन पर 20 किग्रा यूरिया/हेक्टेयर

**धान के लिए:**
- बुवाई पर: 60 किग्रा NPK (10-26-26)/हेक्टेयर
- पहला टॉप ड्रेस: कल्ले फूटते समय 40 किग्रा यूरिया/हेक्टेयर
- दूसरा: बाली निकलते समय 30 किग्रा यूरिया/हेक्टेयर

व्यक्तिगत सिफारिशों के लिए अपनी मिट्टी रिपोर्ट अपलोड करें!`,
    mr: `खत शिफारसी तुमच्या पिकावर आणि मातीवर अवलंबून असतात:

**गव्हासाठी:**
- पेरणीला: 50 किलो DAP/हेक्टर
- पहिले टॉप ड्रेस: 21 दिवसांनी 30 किलो युरिया/हेक्टर
- दुसरे टॉप ड्रेस: 45 दिवसांनी 20 किलो युरिया/हेक्टर

**भातासाठी:**
- पेरणीला: 60 किलो NPK (10-26-26)/हेक्टर
- पहिले टॉप ड्रेस: फुटवे फुटताना 40 किलो युरिया/हेक्टर
- दुसरे: लोंबी येताना 30 किलो युरिया/हेक्टर

वैयक्तिक शिफारशींसाठी तुमचा माती अहवाल अपलोड करा!`
  },

  scheme: {
    en: `Current Government Schemes for Farmers:

🌾 **PM-KISAN**: ₹6,000/year direct benefit
📱 **Kisan Credit Card**: Easy crop loans at 4% interest  
🌱 **PMFBY**: Crop insurance at low premiums
💧 **PM Krishi Sinchai Yojana**: Irrigation support
🚜 **SMAM**: Subsidy on farm machinery

Visit your local agriculture office or CSC for applications.`,
    hi: `किसानों के लिए वर्तमान सरकारी योजनाएं:

🌾 **PM-KISAN**: ₹6,000/वर्ष सीधा लाभ
📱 **किसान क्रेडिट कार्ड**: 4% ब्याज पर आसान फसल ऋण
🌱 **PMFBY**: कम प्रीमियम पर फसल बीमा
💧 **PM कृषि सिंचाई योजना**: सिंचाई सहायता
🚜 **SMAM**: कृषि मशीनरी पर सब्सिडी

आवेदन के लिए अपने स्थानीय कृषि कार्यालय या CSC पर जाएं।`,
    mr: `शेतकऱ्यांसाठी सध्याच्या सरकारी योजना:

🌾 **PM-KISAN**: ₹6,000/वर्ष थेट लाभ
📱 **किसान क्रेडिट कार्ड**: 4% व्याजावर सोपे पीक कर्ज
🌱 **PMFBY**: कमी प्रीमियममध्ये पीक विमा
💧 **PM कृषी सिंचन योजना**: सिंचन सहाय्य
🚜 **SMAM**: शेती यंत्रसामग्रीवर अनुदान

अर्जासाठी तुमच्या स्थानिक कृषी कार्यालय किंवा CSC ला भेट द्या.`
  },

  weather: {
    en: `Weather Preparation Tips:

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
    hi: `मौसम की तैयारी के टिप्स:

**भारी बारिश के लिए:**
- खेत में उचित जल निकासी सुनिश्चित करें
- उर्वरक प्रयोग में देरी करें
- कटी हुई फसल की रक्षा करें

**सूखे के लिए:**
- ड्रिप/स्प्रिंकलर सिंचाई का उपयोग करें
- नमी बनाए रखने के लिए मल्चिंग करें
- सूखा-प्रतिरोधी किस्में चुनें

**पाले के लिए:**
- पाले से पहले हल्की सिंचाई करें
- नर्सरी को प्लास्टिक शीट से ढकें
- पाले से पहले नाइट्रोजन उर्वरकों से बचें`,
    mr: `हवामान तयारीच्या टिप्स:

**जोरदार पावसासाठी:**
- शेतात योग्य निचरा सुनिश्चित करा
- खत वापर लांबणीवर टाका
- काढणी केलेल्या पिकांचे रक्षण करा

**दुष्काळासाठी:**
- ठिबक/स्प्रिंकलर सिंचन वापरा
- आर्द्रता टिकवण्यासाठी आच्छादन करा
- दुष्काळ-प्रतिरोधक वाण निवडा

**दंवासाठी:**
- दंवापूर्वी हलके सिंचन करा
- रोपवाटिका प्लास्टिक शीटने झाका
- दंवापूर्वी नायट्रोजन खतांपासून टाळा`
  },

  default: {
    en: `I'm Patil 🙏 Your farming assistant. I'm here to help with:
- 🌱 Crop disease identification & treatment
- 🧪 Fertilizer recommendations
- 🏛️ Government schemes & subsidies
- 🌤️ Weather preparation tips
- 📊 Soil analysis guidance

Please ask your question or choose from the quick options above!`,
    hi: `मैं पाटिल हूं 🙏 आपका कृषि सहायक। मैं इन विषयों में मदद कर सकता हूं:
- 🌱 फसल रोग पहचान और उपचार
- 🧪 उर्वरक सिफारिशें
- 🏛️ सरकारी योजनाएं और सब्सिडी
- 🌤️ मौसम की तैयारी के टिप्स
- 📊 मिट्टी विश्लेषण मार्गदर्शन

कृपया अपना प्रश्न पूछें या ऊपर दिए गए त्वरित विकल्पों में से चुनें!`,
    mr: `मी पाटील आहे 🙏 तुमचा शेती सहाय्यक. मी या विषयांमध्ये मदत करू शकतो:
- 🌱 पीक रोग ओळख आणि उपचार
- 🧪 खत शिफारसी
- 🏛️ सरकारी योजना आणि अनुदान
- 🌤️ हवामान तयारीच्या टिप्स
- 📊 माती विश्लेषण मार्गदर्शन

कृपया तुमचा प्रश्न विचारा किंवा वरील जलद पर्यायांमधून निवडा!`
  },
};

function getBotResponse(message: string, lang: 'en' | 'hi' | 'mr'): string {
  const lowerMessage = message.toLowerCase();
  
  // Check for Hindi/Marathi keywords as well
  const diseaseKeywords = ['disease', 'pest', 'treat', 'रोग', 'कीट', 'इलाज', 'उपचार'];
  const fertilizerKeywords = ['fertilizer', 'fertiliser', 'urea', 'dap', 'उर्वरक', 'खाद', 'यूरिया', 'खत'];
  const schemeKeywords = ['scheme', 'government', 'subsidy', 'loan', 'योजना', 'सरकारी', 'सब्सिडी', 'अनुदान'];
  const weatherKeywords = ['weather', 'rain', 'frost', 'drought', 'मौसम', 'बारिश', 'पाला', 'सूखा', 'हवामान', 'पाऊस', 'दंव'];
  
  if (diseaseKeywords.some(k => lowerMessage.includes(k))) {
    return botResponses.disease[lang];
  }
  if (fertilizerKeywords.some(k => lowerMessage.includes(k))) {
    return botResponses.fertilizer[lang];
  }
  if (schemeKeywords.some(k => lowerMessage.includes(k))) {
    return botResponses.scheme[lang];
  }
  if (weatherKeywords.some(k => lowerMessage.includes(k))) {
    return botResponses.weather[lang];
  }
  
  return botResponses.default[lang];
}

const greetings = {
  en: "Namaste! 🙏 I'm Patil, your farming assistant. How can I help you today?",
  hi: "नमस्ते! 🙏 मैं पाटिल हूं, आपका कृषि सहायक। आज मैं आपकी कैसे मदद कर सकता हूं?",
  mr: "नमस्कार! 🙏 मी पाटील आहे, तुमचा शेती सहाय्यक. आज मी तुम्हाला कशी मदत करू शकतो?"
};

const placeholders = {
  en: "Type your question...",
  hi: "अपना प्रश्न टाइप करें...",
  mr: "तुमचा प्रश्न टाइप करा..."
};

export function Chatbot() {
  const { isAuthenticated, language } = useApp();
  const lang = language as 'en' | 'hi' | 'mr';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: greetings[lang],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update greeting when language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === '1') {
        return [{
          ...prev[0],
          content: greetings[lang],
        }];
      }
      return prev;
    });
  }, [lang]);

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
        content: getBotResponse(text, lang),
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
              <h3 className="font-semibold text-primary-foreground">Patil 🌾</h3>
              <p className="text-xs text-primary-foreground/70">
                {lang === 'hi' ? 'ऑनलाइन' : lang === 'mr' ? 'ऑनलाइन' : 'Online'}
              </p>
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
          />
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
