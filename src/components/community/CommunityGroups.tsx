import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Sprout, Bug, Droplets, TrendingUp, Leaf, CloudRain } from 'lucide-react';

const groups = [
  { id: '1', name: 'Organic Farming India', nameHi: 'जैविक खेती भारत', nameMr: 'सेंद्रिय शेती भारत', members: 1243, icon: Leaf, category: 'Organic', description: 'Share organic farming tips and techniques', descHi: 'जैविक खेती की तकनीक साझा करें', descMr: 'सेंद्रिय शेती तंत्र शेअर करा' },
  { id: '2', name: 'Cotton Growers Network', nameHi: 'कपास उत्पादक नेटवर्क', nameMr: 'कापूस उत्पादक नेटवर्क', members: 892, icon: Sprout, category: 'Cotton', description: 'Discussion forum for cotton farmers', descHi: 'कपास किसानों के लिए चर्चा मंच', descMr: 'कापूस शेतकऱ्यांसाठी चर्चा मंच' },
  { id: '3', name: 'Pest Management Hub', nameHi: 'कीट प्रबंधन केंद्र', nameMr: 'कीटक व्यवस्थापन केंद्र', members: 1567, icon: Bug, category: 'Pest Control', description: 'Identify and solve pest problems together', descHi: 'कीट समस्याओं को मिलकर हल करें', descMr: 'कीटक समस्या एकत्र सोडवा' },
  { id: '4', name: 'Irrigation & Water Mgmt', nameHi: 'सिंचाई और जल प्रबंधन', nameMr: 'सिंचन आणि जल व्यवस्थापन', members: 734, icon: Droplets, category: 'Irrigation', description: 'Water-saving irrigation techniques', descHi: 'पानी बचाने की सिंचाई तकनीक', descMr: 'पाणी बचतीच्या सिंचन तंत्रे' },
  { id: '5', name: 'Market Prices & Trends', nameHi: 'बाजार भाव और रुझान', nameMr: 'बाजारभाव आणि ट्रेंड', members: 2100, icon: TrendingUp, category: 'Market', description: 'Track crop prices and market trends', descHi: 'फसल की कीमतों और बाजार रुझानों को ट्रैक करें', descMr: 'पीक किमती आणि बाजार ट्रेंड ट्रॅक करा' },
  { id: '6', name: 'Weather & Climate Watch', nameHi: 'मौसम और जलवायु निगरानी', nameMr: 'हवामान आणि हवामान निरीक्षण', members: 1890, icon: CloudRain, category: 'Weather', description: 'Weather forecasts and climate advisories', descHi: 'मौसम पूर्वानुमान और जलवायु सलाह', descMr: 'हवामान अंदाज आणि हवामान सल्ला' },
];

export function CommunityGroups() {
  const { language } = useApp();

  const getName = (g: typeof groups[0]) => language === 'hi' ? g.nameHi : language === 'mr' ? g.nameMr : g.name;
  const getDesc = (g: typeof groups[0]) => language === 'hi' ? g.descHi : language === 'mr' ? g.descMr : g.description;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {language === 'hi' ? 'विषय-आधारित समूहों में शामिल हों और अन्य किसानों से सीखें' :
         language === 'mr' ? 'विषय-आधारित गटात सामील व्हा आणि इतर शेतकऱ्यांकडून शिका' :
         'Join topic-based groups and learn from fellow farmers'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{getName(group)}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Users className="h-3 w-3" />
                      {group.members.toLocaleString()} {language === 'hi' ? 'सदस्य' : language === 'mr' ? 'सदस्य' : 'members'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-3">{getDesc(group)}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{group.category}</Badge>
                  <Button size="sm" variant="outline">
                    {language === 'hi' ? 'शामिल हों' : language === 'mr' ? 'सामील व्हा' : 'Join Group'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
