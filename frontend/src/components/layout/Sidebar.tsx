import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Receipt, Users, Database,
  Brain, Shield, Clock, CheckCircle, Bot, LogOut,
  ChevronRight, Layers, BookOpen
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  alert?: boolean;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const navConfig: NavSection[] = [
  {
    section: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Tax Filing',
    items: [
      { to: '/gst', label: 'GST Returns', icon: Receipt },
      { to: '/itr', label: 'Income Tax', icon: FileText },
    ],
  },
  {
    section: 'VAULTIQ',
    items: [
      { to: '/vaultiq', label: 'VAULTIQ Dashboard', icon: Layers },
      { to: '/vaultiq/clients', label: 'Clients & Onboarding', icon: Users },
      { to: '/vaultiq/assets', label: 'Data Asset Registry', icon: Database },
      { to: '/vaultiq/intel', label: 'Document Intelligence', icon: Brain },
      { to: '/vaultiq/retention', label: 'Retention Engine', icon: Clock },
      { to: '/vaultiq/dpdp', label: 'DPDP Control Center', icon: Shield },
      { to: '/vaultiq/ledger', label: 'Data Movement Ledger', icon: BookOpen },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { to: '/ai', label: 'AI Assistant', icon: Bot },
    ],
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside className="flex flex-col h-full bg-surface-elev border-r border-border">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-[18px] pb-3.5">
        <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center font-bold text-white text-[15px] shadow-brand flex-shrink-0">
          N
        </div>
        <div>
          <div className="font-bold text-[15px] text-content tracking-tight">NEXUM</div>
          <div className="text-[10.5px] text-content-faint">Tax & Compliance Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-0.5">
        {navConfig.map(({ section, items }) => (
          <div key={section}>
            <div className="text-[10.5px] uppercase tracking-wider text-content-faint font-semibold px-2.5 pt-3.5 pb-1.5">
              {section}
            </div>
            {items.map(({ to, label, icon: Icon, badge, alert }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard' || to === '/vaultiq'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[13.5px] font-medium transition-all duration-100 mb-0.5 group',
                    isActive || location.pathname.startsWith(to + '/')
                      ? 'bg-brand/10 text-content'
                      : 'text-content-dim hover:bg-surface-elev2 hover:text-content'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      className={cn(
                        'flex-shrink-0 transition-colors',
                        isActive || location.pathname.startsWith(to + '/') ? 'text-brand' : 'text-content-faint group-hover:text-content-dim'
                      )}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {badge !== undefined && (
                      <span
                        className={cn(
                          'text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full',
                          alert ? 'bg-red-500/10 text-red-400' : 'bg-border text-content-dim'
                        )}
                      >
                        {badge}
                      </span>
                    )}
                    {(isActive || location.pathname.startsWith(to + '/')) && (
                      <ChevronRight size={12} className="text-brand flex-shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-content truncate">{user?.name}</div>
            <div className="text-[10.5px] text-content-faint truncate">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="w-7 h-7 flex items-center justify-center rounded-md text-content-faint hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
        <div className="text-[10px] text-content-faint text-center mt-2.5 pb-0.5 border-t border-border/50 pt-2">
          DPDP Act 2023 · Rules 2025 aligned
        </div>
      </div>
    </aside>
  );
}
