// Sample farmer news data for live news section
export interface FarmerNewsItem {
  id: string;
  title: string;
  titleHi?: string;
  titleMr?: string;
  summary: string;
  summaryHi?: string;
  summaryMr?: string;
  category: 'weather' | 'government' | 'market' | 'technology' | 'tips';
  image: string;
  source: string;
  timestamp: Date;
  readTime: number; // minutes
}

export const farmerNewsData: FarmerNewsItem[] = [
  {
    id: '1',
    title: 'Monsoon Forecast: Above Normal Rainfall Expected This Season',
    titleHi: 'मानसून पूर्वानुमान: इस मौसम सामान्य से अधिक वर्षा की उम्मीद',
    titleMr: 'मान्सून अंदाज: या हंगामात सरासरीपेक्षा जास्त पाऊस अपेक्षित',
    summary: 'IMD predicts 106% of long-period average rainfall. Farmers advised to prepare for good kharif season with adequate water management strategies.',
    summaryHi: 'IMD ने दीर्घकालिक औसत वर्षा का 106% पूर्वानुमान लगाया है। किसानों को पर्याप्त जल प्रबंधन रणनीतियों के साथ अच्छी खरीफ सीजन की तैयारी करने की सलाह दी जाती है।',
    summaryMr: 'IMD ने दीर्घकालीन सरासरी पावसाच्या 106% अंदाज वर्तवला आहे. शेतकऱ्यांना पुरेशा पाणी व्यवस्थापन धोरणांसह चांगल्या खरीप हंगामाची तयारी करण्याचा सल्ला दिला जातो.',
    category: 'weather',
    image: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=400',
    source: 'India Meteorological Department',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    readTime: 3,
  },
  {
    id: '2',
    title: 'PM-KISAN: 17th Installment to be Released Next Week',
    titleHi: 'PM-KISAN: अगले सप्ताह जारी होगी 17वीं किस्त',
    titleMr: 'PM-KISAN: पुढील आठवड्यात 17वा हप्ता जारी होणार',
    summary: 'Government announces release of ₹2000 for eligible farmers under Pradhan Mantri Kisan Samman Nidhi scheme. Check your eligibility status online.',
    summaryHi: 'सरकार ने प्रधानमंत्री किसान सम्मान निधि योजना के तहत पात्र किसानों के लिए ₹2000 जारी करने की घोषणा की। ऑनलाइन अपनी पात्रता स्थिति जांचें।',
    summaryMr: 'प्रधानमंत्री किसान सन्मान निधी योजनेअंतर्गत पात्र शेतकऱ्यांसाठी ₹2000 जारी करण्याची घोषणा सरकारने केली. ऑनलाइन तुमची पात्रता स्थिती तपासा.',
    category: 'government',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    source: 'Ministry of Agriculture',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    readTime: 2,
  },
  {
    id: '3',
    title: 'Soybean Prices Rise 15% on Strong Export Demand',
    titleHi: 'मजबूत निर्यात मांग पर सोयाबीन की कीमतों में 15% की वृद्धि',
    titleMr: 'मजबूत निर्यात मागणीवर सोयाबीनच्या दरात 15% वाढ',
    summary: 'Soybean MSP increased to ₹4,892 per quintal. Market prices touching ₹5,500 in major mandis due to increased demand from crushing units.',
    summaryHi: 'सोयाबीन MSP बढ़ाकर ₹4,892 प्रति क्विंटल कर दिया गया है। क्रशिंग यूनिट्स से बढ़ी मांग के कारण प्रमुख मंडियों में बाजार भाव ₹5,500 को छू रहे हैं।',
    summaryMr: 'सोयाबीन MSP ₹4,892 प्रति क्विंटल पर्यंत वाढवण्यात आले आहे. क्रशिंग युनिट्सच्या वाढलेल्या मागणीमुळे प्रमुख बाजार समित्यांमध्ये बाजारभाव ₹5,500 ला स्पर्श करत आहेत.',
    category: 'market',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400',
    source: 'Agmarknet',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    readTime: 4,
  },
  {
    id: '4',
    title: 'New Drought-Resistant Wheat Variety Released by ICAR',
    titleHi: 'ICAR द्वारा नई सूखा प्रतिरोधी गेहूं किस्म जारी',
    titleMr: 'ICAR द्वारे नवीन दुष्काळ प्रतिरोधक गहू जात प्रकाशित',
    summary: 'HD 3385 variety shows 20% higher yield under water stress conditions. Suitable for central and peninsular India with limited irrigation.',
    summaryHi: 'HD 3385 किस्म पानी की कमी की स्थिति में 20% अधिक उपज दिखाती है। सीमित सिंचाई वाले मध्य और प्रायद्वीपीय भारत के लिए उपयुक्त।',
    summaryMr: 'HD 3385 जात पाण्याच्या ताणाच्या परिस्थितीत 20% जास्त उत्पादन देते. मर्यादित सिंचनासह मध्य आणि द्वीपकल्प भारतासाठी योग्य.',
    category: 'technology',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
    source: 'ICAR',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    readTime: 5,
  },
  {
    id: '5',
    title: 'Organic Farming Subsidies Extended for 2 More Years',
    titleHi: 'जैविक खेती सब्सिडी 2 और साल के लिए बढ़ाई गई',
    titleMr: 'सेंद्रिय शेती अनुदान आणखी 2 वर्षांसाठी वाढवले',
    summary: 'State government extends ₹10,000/hectare subsidy for farmers transitioning to organic methods. Registration open until March 2026.',
    summaryHi: 'राज्य सरकार ने जैविक तरीकों में बदलाव करने वाले किसानों के लिए ₹10,000/हेक्टेयर सब्सिडी बढ़ा दी है। पंजीकरण मार्च 2026 तक खुला है।',
    summaryMr: 'राज्य सरकारने सेंद्रिय पद्धतींकडे संक्रमण करणाऱ्या शेतकऱ्यांसाठी ₹10,000/हेक्टर अनुदान वाढवले आहे. नोंदणी मार्च 2026 पर्यंत खुली आहे.',
    category: 'government',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
    source: 'State Agriculture Dept',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    readTime: 3,
  },
  {
    id: '6',
    title: 'Best Practices for Summer Crop Protection',
    titleHi: 'ग्रीष्मकालीन फसल सुरक्षा के लिए सर्वोत्तम अभ्यास',
    titleMr: 'उन्हाळी पीक संरक्षणासाठी सर्वोत्तम पद्धती',
    summary: 'Expert tips on protecting crops from heat stress: mulching, shade nets, and optimal irrigation timing to minimize water loss.',
    summaryHi: 'गर्मी के तनाव से फसलों की सुरक्षा पर विशेषज्ञ सुझाव: मल्चिंग, शेड नेट, और पानी की हानि को कम करने के लिए इष्टतम सिंचाई समय।',
    summaryMr: 'उष्णतेच्या ताणापासून पिकांचे संरक्षण करण्यासाठी तज्ञांचे सल्ले: मल्चिंग, शेड नेट, आणि पाण्याचे नुकसान कमी करण्यासाठी इष्टतम सिंचन वेळ.',
    category: 'tips',
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400',
    source: 'Krishi Vigyan Kendra',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    readTime: 4,
  },
  {
    id: '7',
    title: 'Cotton Prices Stabilize After Recent Volatility',
    titleHi: 'हाल की अस्थिरता के बाद कपास की कीमतें स्थिर',
    titleMr: 'अलीकडील अस्थिरतेनंतर कापसाचे दर स्थिर',
    summary: 'Cotton arrivals increase as harvest progresses. Prices stabilizing around ₹7,200 per quintal in Gujarat and Maharashtra markets.',
    summaryHi: 'फसल की प्रगति के साथ कपास की आवक बढ़ी। गुजरात और महाराष्ट्र बाजारों में कीमतें ₹7,200 प्रति क्विंटल के आसपास स्थिर हो रही हैं।',
    summaryMr: 'कापणी प्रगतीपथावर असताना कापसाची आवक वाढली. गुजरात आणि महाराष्ट्र बाजारात दर ₹7,200 प्रति क्विंटल भोवती स्थिर होत आहेत.',
    category: 'market',
    image: 'https://images.unsplash.com/photo-1594897030264-ab7d87efc473?w=400',
    source: 'Cotton Association',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
    readTime: 3,
  },
  {
    id: '8',
    title: 'Free Soil Testing Camps Announced in 50 Districts',
    titleHi: '50 जिलों में मुफ्त मिट्टी परीक्षण शिविर की घोषणा',
    titleMr: '50 जिल्ह्यांमध्ये मोफत माती परीक्षण शिबिरांची घोषणा',
    summary: 'Agriculture department to conduct free soil health card distribution. Farmers can get complete NPK analysis and fertilizer recommendations.',
    summaryHi: 'कृषि विभाग मुफ्त मृदा स्वास्थ्य कार्ड वितरण करेगा। किसान पूर्ण NPK विश्लेषण और उर्वरक सिफारिशें प्राप्त कर सकते हैं।',
    summaryMr: 'कृषी विभाग मोफत मृदा आरोग्य कार्ड वितरण करणार आहे. शेतकऱ्यांना संपूर्ण NPK विश्लेषण आणि खत शिफारसी मिळू शकतात.',
    category: 'government',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    source: 'Soil Health Mission',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    readTime: 2,
  },
  {
    id: '9',
    title: 'Smart Irrigation Systems Reduce Water Usage by 40%',
    titleHi: 'स्मार्ट सिंचाई प्रणाली से पानी की खपत 40% कम',
    titleMr: 'स्मार्ट सिंचन प्रणालींमुळे पाण्याचा वापर 40% कमी',
    summary: 'Case study from Nashik district shows drip irrigation with IoT sensors can significantly reduce water consumption while improving yields.',
    summaryHi: 'नासिक जिले के केस स्टडी से पता चलता है कि IoT सेंसर के साथ ड्रिप सिंचाई से पानी की खपत में काफी कमी आती है जबकि उपज में सुधार होता है।',
    summaryMr: 'नाशिक जिल्ह्यातील केस स्टडीवरून दिसून येते की IoT सेन्सर्ससह ठिबक सिंचनामुळे उत्पादन वाढत असताना पाण्याचा वापर लक्षणीयरीत्या कमी होतो.',
    category: 'technology',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    source: 'AgriTech India',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30), // 30 hours ago
    readTime: 5,
  },
  {
    id: '10',
    title: 'Heavy Rainfall Warning for Western Maharashtra',
    titleHi: 'पश्चिमी महाराष्ट्र के लिए भारी वर्षा की चेतावनी',
    titleMr: 'पश्चिम महाराष्ट्रासाठी अतिवृष्टीचा इशारा',
    summary: 'IMD issues orange alert for Pune, Satara, Kolhapur districts. Farmers advised to postpone spraying activities and secure harvested crops.',
    summaryHi: 'IMD ने पुणे, सातारा, कोल्हापुर जिलों के लिए ऑरेंज अलर्ट जारी किया। किसानों को छिड़काव गतिविधियों को स्थगित करने और कटी फसलों को सुरक्षित करने की सलाह दी गई।',
    summaryMr: 'IMD ने पुणे, सातारा, कोल्हापूर जिल्ह्यांसाठी ऑरेंज अलर्ट जारी केला. शेतकऱ्यांना फवारणी उपक्रम पुढे ढकलण्याचा आणि कापणी केलेले पीक सुरक्षित करण्याचा सल्ला दिला.',
    category: 'weather',
    image: 'https://images.unsplash.com/photo-1475116127127-e3ce09ee84e1?w=400',
    source: 'IMD Pune',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 hours ago
    readTime: 2,
  },
];

export const categoryConfig = {
  weather: { label: 'Weather', labelHi: 'मौसम', labelMr: 'हवामान', color: 'bg-sky-500', icon: '🌤️' },
  government: { label: 'Government', labelHi: 'सरकार', labelMr: 'शासकीय', color: 'bg-indigo-500', icon: '🏛️' },
  market: { label: 'Market', labelHi: 'बाजार', labelMr: 'बाजार', color: 'bg-emerald-500', icon: '📊' },
  technology: { label: 'Technology', labelHi: 'तकनीक', labelMr: 'तंत्रज्ञान', color: 'bg-purple-500', icon: '🔬' },
  tips: { label: 'Tips', labelHi: 'टिप्स', labelMr: 'टिप्स', color: 'bg-amber-500', icon: '💡' },
};
