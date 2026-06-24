import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Plus, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import type { AiMessage, AiConversation } from '../../types';

type Module = 'general' | 'gst' | 'itr' | 'vaultiq';

const MODULE_SUGGESTIONS: Record<Module, string[]> = {
  general: [
    'What is the difference between GST and Income Tax?',
    'How do I register for GST?',
    'What are DPDP Act 2023 obligations for CAs?',
    'Explain new vs old tax regime for AY 2025-26',
  ],
  gst: [
    'How do I compute ITC reversal under Rule 42?',
    'What are the GSTR-1 filing due dates?',
    'Explain place of supply for B2B services',
    'When does RCM apply?',
  ],
  itr: [
    'Compare old vs new regime for ₹12L income',
    'What documents are needed for ITR-2?',
    'How to report capital gains from mutual funds?',
    'Is HRA exemption available in new regime?',
  ],
  vaultiq: [
    'What are DPDP §5 notice requirements?',
    'How long should I retain PAN documents?',
    'When must Aadhaar be deleted after collection?',
    'What is a Data Processing Agreement?',
  ],
};

interface AiAssistantProps {
  module?: Module;
  initialConversationId?: string;
}

export function AiAssistant({ module = 'general', initialConversationId }: AiAssistantProps) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeModule, setActiveModule] = useState<Module>(module);
  const [showHistory, setShowHistory] = useState(true);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    streamRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    try {
      const res = await api.get('/ai/conversations');
      setConversations(res.data.data || []);
    } catch {}
  }

  async function loadConversation(id: string) {
    try {
      const res = await api.get(`/ai/conversations/${id}`);
      const conv = res.data.data;
      setConversationId(conv.id);
      setMessages(conv.messages || []);
      setActiveModule(conv.module as Module);
    } catch {}
  }

  async function sendMessage(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: AiMessage = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: msg, module: activeModule, conversationId });
      const { reply, conversationId: newId } = res.data.data;
      setConversationId(newId);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, timestamp: new Date().toISOString() }]);
      loadConversations();
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please ensure the ANTHROPIC_API_KEY is configured in your .env file.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setMessages([]);
    setConversationId(undefined);
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.delete(`/ai/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) newConversation();
    } catch {}
  }

  const moduleColors: Record<Module, string> = {
    general: 'text-brand border-brand bg-brand/10',
    gst: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    itr: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    vaultiq: 'text-green-400 border-green-500/30 bg-green-500/10',
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-58px-48px)] min-h-[500px]">
      {/* History sidebar */}
      {showHistory && (
        <div className="w-56 flex-shrink-0 flex flex-col border border-border rounded-lg bg-surface-panel overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <span className="text-[12px] font-semibold text-content-dim uppercase tracking-wider">History</span>
            <button
              onClick={newConversation}
              className="w-6 h-6 flex items-center justify-center rounded text-content-faint hover:text-brand hover:bg-brand/10 transition-colors"
              title="New conversation"
            >
              <Plus size={13} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {conversations.length === 0 ? (
              <p className="text-[12px] text-content-faint text-center py-6 px-2">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={cn(
                    'group flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-colors',
                    conversationId === conv.id ? 'bg-brand/10 text-content' : 'text-content-dim hover:bg-surface-elev hover:text-content'
                  )}
                >
                  <span className={cn('text-[9px] font-bold px-1 py-0.5 rounded border uppercase', moduleColors[conv.module as Module] || moduleColors.general)}>
                    {conv.module.slice(0, 3).toUpperCase()}
                  </span>
                  <span className="flex-1 text-[12px] truncate">{conv.title}</span>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-content-faint hover:text-red-400 transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col border border-border rounded-lg bg-surface-panel overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="w-7 h-7 gradient-bg rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-[13px] text-content">NEXUM AI</div>
            <div className="text-[11px] text-content-faint">Powered by Claude · Indian Tax & Compliance Expert</div>
          </div>

          {/* Module selector */}
          <div className="ml-auto flex gap-1.5">
            {(['general','gst','itr','vaultiq'] as Module[]).map((m) => (
              <button
                key={m}
                onClick={() => setActiveModule(m)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors uppercase',
                  activeModule === m ? moduleColors[m] : 'border-border text-content-faint hover:border-brand hover:text-brand'
                )}
              >
                {m === 'vaultiq' ? 'VAULT' : m.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowHistory((v) => !v)}
            className="text-[11px] text-content-faint hover:text-brand transition-colors ml-2"
          >
            {showHistory ? 'Hide' : 'History'}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center shadow-brand">
                <Bot size={26} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-content text-[15px]">Ask NEXUM AI</div>
                <div className="text-content-faint text-[13px] mt-1">Expert on GST, Income Tax, DPDP & CA compliance</div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {MODULE_SUGGESTIONS[activeModule].map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-[12.5px] px-3 py-1.5 rounded-full border border-dashed border-border text-content-dim hover:border-brand hover:text-content transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-3 max-w-3xl', msg.role === 'user' && 'ml-auto flex-row-reverse')}>
              <div
                className={cn(
                  'w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0 text-[12px] font-bold',
                  msg.role === 'assistant' ? 'gradient-bg text-white' : 'bg-border text-content-dim'
                )}
              >
                {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div
                className={cn(
                  'rounded-xl px-4 py-3 text-[13.5px] leading-relaxed max-w-[85%]',
                  msg.role === 'assistant'
                    ? 'bg-surface-elev border border-border text-content'
                    : 'gradient-bg text-white'
                )}
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-[30px] h-[30px] rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-surface-elev border border-border rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-brand pulse-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={streamRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2.5 border border-border bg-surface-elev rounded-xl px-3.5 py-2.5 focus-within:border-brand transition-colors">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder={`Ask about ${activeModule === 'vaultiq' ? 'VAULTIQ / DPDP' : activeModule === 'gst' ? 'GST' : activeModule === 'itr' ? 'Income Tax' : 'tax & compliance'}…`}
              className="flex-1 bg-transparent outline-none text-[13.5px] text-content placeholder:text-content-faint"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 hover:brightness-110 transition-all"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-center text-[11px] text-content-faint mt-2">
            Claude AI · For guidance only — consult a professional for formal advice
          </p>
        </div>
      </div>
    </div>
  );
}
