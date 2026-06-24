import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// GST
import GstDashboard from './pages/gst/GstDashboard';
import Gstr1 from './pages/gst/Gstr1';
import Gstr3b from './pages/gst/Gstr3b';

// ITR
import ItrDashboard from './pages/itr/ItrDashboard';
import Itr1 from './pages/itr/Itr1';
import Itr2 from './pages/itr/Itr2';

// VAULTIQ
import VaultiqDashboard from './pages/vaultiq/VaultiqDashboard';
import Clients from './pages/vaultiq/Clients';
import DataAssets from './pages/vaultiq/DataAssets';
import DocumentIntelligence from './pages/vaultiq/DocumentIntelligence';
import RetentionEngine from './pages/vaultiq/RetentionEngine';
import DpdpCenter from './pages/vaultiq/DpdpCenter';
import DataMovementLedger from './pages/vaultiq/DataMovementLedger';

// AI
import AiPage from './pages/ai/AiPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* GST */}
        <Route path="/gst" element={<GstDashboard />} />
        <Route path="/gst/gstr1/:id" element={<Gstr1 />} />
        <Route path="/gst/gstr3b/:id" element={<Gstr3b />} />

        {/* ITR */}
        <Route path="/itr" element={<ItrDashboard />} />
        <Route path="/itr/itr1/:id" element={<Itr1 />} />
        <Route path="/itr/itr2/:id" element={<Itr2 />} />

        {/* VAULTIQ */}
        <Route path="/vaultiq" element={<VaultiqDashboard />} />
        <Route path="/vaultiq/clients" element={<Clients />} />
        <Route path="/vaultiq/assets" element={<DataAssets />} />
        <Route path="/vaultiq/intel" element={<DocumentIntelligence />} />
        <Route path="/vaultiq/retention" element={<RetentionEngine />} />
        <Route path="/vaultiq/dpdp" element={<DpdpCenter />} />
        <Route path="/vaultiq/ledger" element={<DataMovementLedger />} />

        {/* AI */}
        <Route path="/ai" element={<AiPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
