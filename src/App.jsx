import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Airdrops from './pages/Airdrops';
import AirdropDetail from './pages/AirdropDetail';
import Sources from './pages/Sources';
import Tasks from './pages/Tasks';
import Wallets from './pages/Wallets';
import Claims from './pages/Claims';
import Earnings from './pages/Earnings';
import Listings from './pages/Listings';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import System from './pages/System';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="airdrops" element={<Airdrops />} />
            <Route path="airdrops/:id" element={<AirdropDetail />} />
            <Route path="sources" element={<Sources />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="wallets" element={<Wallets />} />
            <Route path="claims" element={<Claims />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="listings" element={<Listings />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="system" element={<System />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}