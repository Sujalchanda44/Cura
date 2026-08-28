import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, Sparkles, User, HelpCircle, Activity, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  type?: 'text' | 'nutrition_card';
  data?: any;
};

const suggestedInquiries = [
  { icon: HelpCircle, title: 'Can I eat this?', desc: 'Scan food for nutritional analysis', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Sparkles, title: 'Is this medicine safe?', desc: 'Check interactions and side effects', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: User, title: 'Daily Health Tips', desc: 'Get personalized wellness advice', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: Activity, title: 'Analyze my health', desc: 'Review my recent health trends', color: 'text-orange-500', bg: 'bg-orange-50' },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello, John! I'm Cura+ AI, your personal health companion. How can I assist you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI typing delay
    setTimeout(() => {
      // Mocked AI Response specifically for the oatmeal example
      let aiResponse: Message;
      
      if (inputValue.toLowerCase().includes('oatmeal') || inputValue.toLowerCase().includes('breakfast')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "That's a great heart-healthy breakfast. Here's an estimated breakdown:",
          type: 'nutrition_card',
          data: {
            cals: 320,
            pro: '10g',
            fib: '8g',
            fat: '12g'
          }
        };
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "I understand. I can help you analyze that further based on your health profile."
        };
      }
      
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full max-h-[calc(100vh-8rem)]">
      
      {/* Left Sidebar - Suggested Inquiries */}
      <div className="hidden lg:flex flex-col w-80 shrink-0 h-full overflow-y-auto pr-2 pb-4">
        <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">Suggested Inquiries</h2>
        <div className="space-y-3">
          {suggestedInquiries.map((item, i) => (
            <Card key={i} className="cursor-pointer hover:border-primary/30 hover:bg-slate-50 transition-colors border-slate-100 shadow-sm" onClick={() => setInputValue(item.title)}>
              <div className="p-4 flex items-start space-x-4">
                <div className={cn("p-2 rounded-lg shrink-0", item.bg)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-tight">{item.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="mt-auto pt-6 px-2">
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
            <h4 className="text-xs font-bold text-orange-800 mb-1 flex items-center">
              <Activity className="h-3 w-3 mr-1" /> Important Disclaimer
            </h4>
            <p className="text-[10px] text-orange-700 leading-snug">
              Cura+ AI provides informational wellness guidance and may make mistakes. It is not a substitute for professional medical advice. Please consult a qualified healthcare professional.
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-10rem)] md:h-full">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-100 flex items-center px-6 bg-white shrink-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">Cura+ AI</h2>
              <div className="flex items-center text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-success mr-1.5 inline-block"></span>
                AI Health Assistant • Online
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex max-w-[85%] sm:max-w-[75%]",
              msg.sender === 'user' ? "ml-auto" : "mr-auto"
            )}>
              {msg.sender === 'ai' && (
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className="space-y-3">
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.sender === 'user' 
                    ? "bg-primary text-white rounded-tr-sm" 
                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                )}>
                  {msg.text}
                </div>
                
                {msg.type === 'nutrition_card' && msg.data && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full max-w-sm">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-100">
                        <div className="text-lg font-bold text-slate-900">{msg.data.cals}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Calories</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-100">
                        <div className="text-lg font-bold text-slate-900">{msg.data.pro}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Protein</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-100">
                        <div className="text-lg font-bold text-slate-900">{msg.data.fib}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Fiber</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-100">
                        <div className="text-lg font-bold text-slate-900">{msg.data.fat}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Fat</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">Log Meal</Button>
                      <Button size="sm" variant="outline" className="flex-1">Adjust Portions</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2 bg-slate-50 rounded-2xl border border-slate-200 p-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <div className="flex items-center space-x-1 pb-1 pl-1 shrink-0">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary rounded-full">
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary rounded-full">
                <Camera className="h-5 w-5" />
              </Button>
            </div>
            
            <textarea 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Message Cura+ AI..."
              className="flex-1 max-h-32 min-h-[40px] bg-transparent border-0 focus:ring-0 resize-none py-2 px-2 text-sm text-slate-700 placeholder:text-slate-400"
              rows={1}
            />
            
            <div className="flex items-center space-x-1 pb-1 pr-1 shrink-0">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary rounded-full">
                <Mic className="h-5 w-5" />
              </Button>
              <Button type="submit" disabled={!inputValue.trim()} size="icon" className="h-8 w-8 rounded-full bg-primary text-white shadow-sm disabled:opacity-50 transition-all hover:scale-105">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
