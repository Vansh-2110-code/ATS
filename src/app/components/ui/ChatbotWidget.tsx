import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User as UserIcon } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

interface ChatbotWidgetProps {
  mode: 'candidate' | 'internal';
}

function parseMessageText(text: string) {
  return text.split('\n').map((line, idx) => {
    let cleanLine = line;
    // Replace **bold** with strong HTML
    cleanLine = cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    if (line.trim().startsWith('•') || line.trim().startsWith('*')) {
      const content = cleanLine.replace(/^[•*]\s*/, '');
      return <li key={idx} className="ml-3 list-disc text-slate-600 mb-1" dangerouslySetInnerHTML={{ __html: content }} />;
    }
    
    return <p key={idx} className="mb-1 last:mb-0 leading-relaxed" dangerouslySetInnerHTML={{ __html: cleanLine }} />;
  });
}

export function ChatbotWidget({ mode }: ChatbotWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State for collecting candidate status verification
  const [awaitingEmail, setAwaitingEmail] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    const greetingText = mode === 'candidate' 
      ? "Hello! I am your White Horse Support Assistant. How can I help you today? You can search open jobs, check your application status, or ask about joining details."
      : `Welcome back, ${user?.name || 'Team Member'}! How can I assist you today? I can retrieve your attendance logs, help with candidate reassignment rules, or guide you through leave policies.`;

    setMessages([
      {
        id: 'greet',
        sender: 'bot',
        text: greetingText,
        timestamp: new Date()
      }
    ]);
  }, [mode, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender: 'bot' | 'user', text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        sender,
        text,
        timestamp: new Date()
      }
    ]);
  };

  const handleSend = async (text: string, actionType?: string) => {
    if (!text.trim() && !actionType) return;
    
    // Clear input
    setInputValue('');
    setError('');

    // If user typed / selected text
    if (text.trim()) {
      addMessage('user', text);
    }

    setLoading(true);
    try {
      let res;
      // Handle the email or phone input for status check flow
      if (awaitingEmail) {
        setAwaitingEmail(false);
        const inputVal = text.trim();
        const isEmail = inputVal.includes('@');
        if (isEmail) {
          res = await api.sendSupportChat('', 'check_status', inputVal, undefined);
        } else {
          res = await api.sendSupportChat('', 'check_status', undefined, inputVal);
        }
      } else {
        res = await api.sendSupportChat(text, actionType);
      }
      
      addMessage('bot', res.text);
    } catch (err) {
      console.error('Chat error:', err);
      addMessage('bot', "Sorry, I am having trouble connecting to the support server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (label: string, actionType?: string) => {
    if (actionType === 'check_status_init') {
      addMessage('user', label);
      addMessage('bot', "Sure! Please enter your registered **Email Address** or **Phone Number** below to query your file:");
      setAwaitingEmail(true);
      return;
    }
    handleSend(label, actionType);
  };

  const [error, setError] = useState('');

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-white border border-slate-200/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-green-600 to-emerald-700 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">White Horse Assistant</h4>
                <span className="text-[10px] text-green-100 font-semibold uppercase tracking-wider">Support Copilot</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map(msg => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={msg.id} className={`flex items-start gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isBot ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                    {isBot ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isBot 
                      ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100' 
                      : 'bg-green-600 text-white rounded-tr-none'
                  }`}>
                    {parseMessageText(msg.text)}
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-100 px-3.5 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (Show when not busy loading) */}
          {!loading && (
            <div className="px-4 py-2 border-t border-slate-100 bg-white flex flex-wrap gap-2">
              {mode === 'candidate' ? (
                <>
                  <button 
                    onClick={() => handleQuickAction("🔍 Search Jobs", "search_jobs")}
                    className="text-xs px-2.5 py-1 bg-green-50 hover:bg-green-100 border border-green-200/50 text-green-700 rounded-lg transition-colors font-semibold"
                  >
                    🔍 Search Jobs
                  </button>
                  <button 
                    onClick={() => handleQuickAction("📁 Check Application Status", "check_status_init")}
                    className="text-xs px-2.5 py-1 bg-green-50 hover:bg-green-100 border border-green-200/50 text-green-700 rounded-lg transition-colors font-semibold"
                  >
                    📁 Check Status
                  </button>
                  <button 
                    onClick={() => handleQuickAction("❓ Onboarding Docs")}
                    className="text-xs px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-colors font-semibold"
                  >
                    ❓ Onboarding Docs
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => handleQuickAction("📅 My Attendance Today", "get_attendance")}
                    className="text-xs px-2.5 py-1 bg-green-50 hover:bg-green-100 border border-green-200/50 text-green-700 rounded-lg transition-colors font-semibold"
                  >
                    📅 My Attendance
                  </button>
                  <button 
                    onClick={() => handleQuickAction("🔄 How to reassign candidate")}
                    className="text-xs px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-colors font-semibold"
                  >
                    🔄 Candidate Reassign
                  </button>
                  <button 
                    onClick={() => handleQuickAction("💡 Leave Policy")}
                    className="text-xs px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-colors font-semibold"
                  >
                    💡 Leave Policy
                  </button>
                </>
              )}
            </div>
          )}

          {/* Input Box */}
          <form 
            onSubmit={e => { e.preventDefault(); handleSend(inputValue); }}
            className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={awaitingEmail ? "Enter email/phone here..." : "Ask a support question..."}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-500 focus:bg-slate-50/30 transition-all placeholder:text-slate-400"
            />
            <button 
              type="submit" 
              disabled={loading || !inputValue.trim()}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6 animate-pulse" />}
      </button>
    </div>
  );
}
