import { useSearchParams } from 'react-router-dom';
import { AiAssistant } from '../../components/ai/AiAssistant';

type Module = 'general' | 'gst' | 'itr' | 'vaultiq';

export default function AiPage() {
  const [params] = useSearchParams();
  const module = (params.get('module') as Module) || 'general';
  const conversationId = params.get('conversation') || undefined;

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-content tracking-tight">AI Assistant</h1>
        <p className="text-content-dim text-[13.5px] mt-1">
          Powered by Claude — expert in GST, Income Tax, DPDP Act 2023 and CA compliance.
        </p>
      </div>
      <AiAssistant module={module} initialConversationId={conversationId} />
    </div>
  );
}
