import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, HelpCircle, Activity, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { sendChatMessage } from '@/api/chatApi';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import MarkdownRenderer from '@/components/MarkdownRenderer';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  type?: 'text' | 'nutrition_card';
  data?: any;
};

export default function AIAssistant() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const name = user?.name || 'User';

  const suggestedInquiries = [
    { icon: HelpCircle, title: t('ai.canIEat', 'Can I eat this?'), desc: t('ai.canIEatDesc', 'Scan food for nutritional analysis'), color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Sparkles, title: t('ai.isMedicineSafe', 'Is this medicine safe?'), desc: t('ai.isMedicineSafeDesc', 'Check interactions and side effects'), color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: User, title: t('ai.dailyTips', 'Daily Health Tips'), desc: t('ai.dailyTipsDesc', 'Get personalized wellness advice'), color: 'text-green-500', bg: 'bg-green-50' },
    { icon: Activity, title: t('ai.analyzeHealth', 'Analyze my health'), desc: t('ai.analyzeHealthDesc', 'Review my recent health trends'), color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello, ${name}! I'm Cura+ AI, your personal health companion. How can I assist you today?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const prompt = inputValue.trim();
    if (!prompt) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: prompt };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage(prompt) as Message;
      
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'I apologize, but I encountered an error. Please try again in a moment.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectInquiry = (inquiryTitle: string) => {
    setInputValue(inquiryTitle);
    // Submit inquiry immediately
    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: inquiryTitle };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    sendChatMessage(inquiryTitle)
      .then((response: any) => {
        setMessages(prev => [...prev, response]);
      })
      .catch((err) => {
        console.error('Inquiry error:', err);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'ai',
          text: 'I apologize, but I could not process that inquiry. Please try again.'
        }]);
      })
      .finally(() => {
        setIsTyping(false);
      });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full max-h-[calc(100vh-8rem)]">
      
      {/* Left Sidebar - Suggested Inquiries */}
      <div className="hidden lg:flex flex-col w-80 shrink-0 h-full overflow-y-auto pr-2 pb-4">
        <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">{t('ai.suggestedInquiries', 'Suggested Inquiries')}</h2>
        <div className="space-y-3">
          {suggestedInquiries.map((item, i) => (
            <Card 
              key={i} 
              className="cursor-pointer hover:border-blue-500/30 hover:bg-slate-50 transition-all border-slate-100 shadow-sm hover:shadow-md" 
              onClick={() => handleSelectInquiry(item.title)}
            >
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
              <Activity className="h-3 w-3 mr-1" /> {t('ai.disclaimerTitle', 'Important Disclaimer')}
            </h4>
            <p className="text-[10px] text-orange-700 leading-snug">
              {t('ai.disclaimer', 'Cura+ AI provides informational wellness guidance and may make mistakes. It is not a substitute for professional medical advice. Please consult a qualified healthcare professional.')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#151A12] rounded-2xl border border-slate-200 dark:border-[#273322] shadow-sm overflow-hidden h-[calc(100vh-10rem)] md:h-full transition-colors">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-100 dark:border-[#273322] flex items-center px-6 bg-white dark:bg-[#151A12] shrink-0 z-10 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-[#C1F3BA] rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-[#134E2F]" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">Cura+ AI</h2>
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <span className="h-2 w-2 rounded-full bg-success mr-1.5 inline-block"></span>
                {t('ai.statusOnline', 'AI Health Assistant • Online')}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-[#0D1109] transition-colors">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "w-full flex",
                msg.sender === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "flex max-w-[85%] sm:max-w-[75%]",
                msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                {msg.sender === 'ai' && (
                  <div className="h-8 w-8 bg-[#134E2F] text-[#C1F3BA] rounded-full flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
                
                <div className={cn("flex flex-col space-y-2", msg.sender === 'user' ? "items-end" : "items-start")}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words text-left inline-block",
                    msg.sender === 'user' 
                      ? "bg-[#134E2F] text-white rounded-br-sm shadow-[#134E2F]/10 whitespace-pre-wrap" 
                      : "bg-white dark:bg-[#1C2318] border border-slate-200 dark:border-[#273322] text-slate-800 dark:text-slate-100 rounded-bl-sm"
                  )}>
                    {msg.sender === 'ai' ? (
                      <MarkdownRenderer content={msg.text} />
                    ) : (
                      msg.text
                    )}
                  </div>
                  
                  {msg.type === 'nutrition_card' && msg.data && (
                    <div className="bg-white dark:bg-[#1C2318] border border-slate-200 dark:border-[#273322] rounded-xl p-4 shadow-sm w-full max-w-sm">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-50 dark:bg-[#151A12] p-3 rounded-lg text-center border border-slate-100 dark:border-[#273322]">
                          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{msg.data.cals}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mt-1">Calories</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#151A12] p-3 rounded-lg text-center border border-slate-100 dark:border-[#273322]">
                          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{msg.data.pro}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mt-1">Protein</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#151A12] p-3 rounded-lg text-center border border-slate-100 dark:border-[#273322]">
                          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{msg.data.fib}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mt-1">Fiber</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#151A12] p-3 rounded-lg text-center border border-slate-100 dark:border-[#273322]">
                          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{msg.data.fat}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mt-1">Fat</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="w-full flex justify-start">
              <div className="flex max-w-[75%] items-center">
                <div className="h-8 w-8 bg-[#134E2F] text-[#C1F3BA] rounded-full flex items-center justify-center shrink-0 mr-3 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-[#1C2318] border border-slate-200 dark:border-[#273322] text-slate-500 dark:text-slate-400 text-sm flex items-center space-x-1.5 shadow-sm rounded-bl-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-[#134E2F] dark:text-[#C1F3BA]" />
                  <span>{t('ai.thinking', 'Cura+ is thinking...')}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white dark:bg-[#151A12] border-t border-slate-100 dark:border-[#273322] shrink-0 transition-colors">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2 bg-slate-50 dark:bg-[#1C2318] rounded-2xl border border-slate-200 dark:border-[#273322] p-2 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
            <textarea 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={t('ai.inputPlaceholder', 'Message Cura+ AI...')}
              className="flex-1 max-h-32 min-h-[40px] bg-transparent border-0 focus:ring-0 resize-none py-2 px-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              rows={1}
            />
            
            <div className="flex items-center pb-1 pr-1 shrink-0">
              <Button type="submit" disabled={!inputValue.trim() || isTyping} size="icon" className="h-8 w-8 rounded-full bg-[#134E2F] text-white shadow-sm disabled:opacity-50 transition-all hover:scale-105 cursor-pointer">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
