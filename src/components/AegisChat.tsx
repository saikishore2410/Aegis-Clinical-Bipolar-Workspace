import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, AlertCircle, Heart, Phone, HelpCircle, X } from 'lucide-react';
import { SafetyPlan } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AegisChatProps {
  safetyPlan: SafetyPlan;
  onClose?: () => void;
}

export function AegisChat({ safetyPlan, onClose }: AegisChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_init",
      role: 'assistant',
      content: "Hello. I am Aegis, your gentle peer companion. I am always here to listen if you want to write down what's on your mind, reflect, or vent. I don't give instructions or suggestions unless you ask, and my guidance is purely educational. If you're having health symptoms, please remember to consult your medical team first.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputVal, setInputVal] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Suggestion chips that are supportive but passive
  const promptSuggestions = [
    "I'm feeling a bit restless and overwhelmed today.",
    "Can we talk about the benefits of euthymia and stable sleep?",
    "Just wanted to write a silent journal reflection...",
    "What is the difference between a manic prodrome and simple joy?"
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setErrorMsg(null);
    const userMsg: Message = {
      id: "msg_" + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          userPrompt: text
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach server. Please ensure GEMINI_API_KEY is configured in Settings.");
      }

      const data = await response.json();
      
      const botMsg: Message = {
        id: "msg_bot_" + Date.now(),
        role: 'assistant',
        content: data.text || "I am here, listening gently.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputVal);
    }
  };

  // Helper keyword check to safely display emergency helpline widget client-side if things get rough
  const containsEmergencyKeywords = (text: string) => {
    const words = ["suicide", "hurt", "die", "kill", "dose", "medication", "pill", "prescribe", "psychiatrist", "mania", "depressed", "emergency", "crisis", "doctor", "symptom"];
    return words.some(w => text.toLowerCase().includes(w));
  };

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || "";
  const showsEmergencyCard = containsEmergencyKeywords(lastUserMessage) || messages.length > 5;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl flex flex-col h-[520px] shadow-sm overflow-hidden animate-fade-in">
      
      {/* Active Header */}
      <div className="bg-[#FAF9F6] border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
          <div>
            <h4 className="text-xs font-bold font-display text-stone-850 uppercase tracking-wider flex items-center gap-1">
              Aegis Support Peer
              <span className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.25 rounded font-mono">Passive</span>
            </h4>
            <p className="text-[10px] text-stone-500 leading-none mt-0.5">Listening companion. No unsolicited advice.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-stone-400 font-sans hidden sm:block">
            🛡️ HIPAA Secure Tunnel
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-605 transition-all cursor-pointer flex items-center justify-center active:scale-90"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/20 scrollbar-thin">
        
        {messages.map((msg) => {
          const isMe = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                isMe ? 'ml-auto items-end animate-fade-in' : 'mr-auto items-start animate-fade-in'
              }`}
            >
              <div className="text-[9px] text-stone-400 font-mono mb-1 px-1">{msg.timestamp}</div>
              <div
                className={`p-3 rounded-2xl text-xs font-sans leading-relaxed shadow-sm ${
                  isMe
                    ? 'bg-teal-550 bg-teal-600 text-white rounded-br-none'
                    : 'bg-white border border-stone-200/80 text-stone-800 rounded-bl-none'
                }`}
                style={{ whiteSpace: 'pre-line' }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-stone-400 p-2 italic animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Aegis is processing reflection securely...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-750 flex items-center gap-2 leading-snug">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="flex-1">{errorMsg}</p>
          </div>
        )}

        {/* Client-Side Protective Contact Escort */}
        {showsEmergencyCard && safetyPlan.psychiatristPhone && (
          <div className="p-4 bg-amber-50 border border-amber-250 rounded-xl space-y-3 animate-fade-in text-stone-800 max-w-sm mr-auto shadow-sm">
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold font-display text-amber-900 uppercase tracking-wide">
                  Clinical Assistance Anchor
                </h5>
                <p className="text-[11px] text-stone-600 leading-normal mt-0.5">
                  Aegis is a listening peer companion, not a clinical doctor. For concerns regarding drugs, dose adjustments, physical symptoms, or crises, please call your psychiatrist instantly:
                </p>
              </div>
            </div>

            <div className="bg-white border border-amber-200 rounded-lg p-2.5 flex items-center justify-between text-xs font-sans">
              <div>
                <div className="font-bold text-stone-700">{safetyPlan.psychiatristName || "Assigned Psychiatrist"}</div>
                <div className="text-[10px] text-stone-450">Helpline Phone</div>
              </div>
              <a
                href={`tel:${safetyPlan.psychiatristPhone}`}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] flex items-center gap-1.5 active:scale-95 transition-all text-xs"
              >
                <Phone className="w-3 h-3" />
                Call Dr.
              </a>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Input Chips (shown when no load is ongoing) */}
      {!isLoading && (
        <div className="p-2 border-t border-stone-200/80 bg-stone-50/60 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
          {promptSuggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(s)}
              className="px-3 py-1 bg-white border border-stone-200 text-stone-650 hover:bg-slate-50 rounded-full text-[10.5px] cursor-pointer inline-block active:scale-95 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="p-3 bg-white border-t border-stone-200 flex gap-2 items-center">
        <textarea
          rows={1}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Reflect gently on how you hold yourself, vent here..."
          className="flex-1 bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-teal-500 resize-none max-h-16 leading-relaxed"
        />
        <button
          onClick={() => handleSendMessage(inputVal)}
          disabled={!inputVal.trim() || isLoading}
          className="p-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-30 text-white rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
