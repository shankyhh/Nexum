import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Bot, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const breadcrumbs: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/gst': 'GST Returns',
  '/itr': 'Income Tax Returns',
  '/vaultiq': 'VAULTIQ',
  '/vaultiq/clients': 'Clients & Onboarding',
  '/vaultiq/assets': 'Data Asset Registry',
  '/vaultiq/intel': 'Document Intelligence',
  '/vaultiq/retention': 'Retention Engine',
  '/vaultiq/dpdp': 'DPDP Control Center',
  '/vaultiq/ledger': 'Data Movement Ledger',
  '/ai': 'AI Assistant',
};

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const current = breadcrumbs[location.pathname] || breadcrumbs[Object.keys(breadcrumbs).find((k) => location.pathname.startsWith(k + '/')) || ''] || 'NEXUM';

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header
      className="h-[58px] flex items-center gap-3 px-5 border-b border-border sticky top-0 z-20"
      style={{ background: 'color-mix(in srgb, #0b0d12 86%, transparent)', backdropFilter: 'blur(10px)' }}
    >
      {/* Mobile menu */}
      <button
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md text-content-dim hover:text-content hover:bg-surface-elev"
        onClick={onMenuClick}
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="text-[13px] text-content-faint flex items-center gap-1.5">
        <span>NEXUM</span>
        <span className="opacity-40">/</span>
        <span className="font-semibold text-content">{current}</span>
      </div>

      {/* Search → AI */}
      <div
        className="ml-auto flex items-center gap-2 bg-surface-elev border border-border rounded-md px-3 py-1.5 w-72 cursor-pointer hover:border-brand transition-colors"
        onClick={() => navigate('/ai')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/ai')}
      >
        <Search size={14} className="text-content-faint flex-shrink-0" />
        <span className="flex-1 text-[13px] text-content-faint">Ask NEXUM AI…</span>
        <span className="text-[10.5px] bg-border text-content-dim px-1.5 py-0.5 rounded font-semibold">AI</span>
      </div>

      {/* Notifications */}
      <button className="w-[34px] h-[34px] rounded-[9px] border border-border bg-surface-elev text-content-dim flex items-center justify-center hover:border-brand hover:text-content transition-colors">
        <Bell size={15} />
      </button>

      {/* AI quick-access */}
      <button
        onClick={() => navigate('/ai')}
        className="w-[34px] h-[34px] rounded-[9px] gradient-bg flex items-center justify-center text-white shadow-brand hover:brightness-110 transition-all"
        title="Open AI Assistant"
      >
        <Bot size={15} />
      </button>

      {/* Avatar */}
      <div
        className="w-[34px] h-[34px] rounded-full gradient-bg flex items-center justify-center text-[13px] font-bold text-white cursor-pointer"
        title={user?.name}
      >
        {initials}
      </div>
    </header>
  );
}
