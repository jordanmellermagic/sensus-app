import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SpectatorDataPage from "./pages/SpectatorDataPage";
import PeekScreenPage from "./pages/PeekScreenPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/spectator"
        element={
          <ProtectedRoute>
            <SpectatorDataPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/peek"
        element={
          <ProtectedRoute>
            <PeekScreenPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
