import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import BookRidePage from "./pages/BookRidePage";
import DriverDashboard from "./pages/DriverDashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RideHistoryPage from "./pages/RideHistoryPage";
import RideStatusPage from "./pages/RideStatusPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/book"
          element={
            <ProtectedRoute role="User">
              <BookRidePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ride-status/:bookingId"
          element={
            <ProtectedRoute role="User">
              <RideStatusPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute role="User">
              <RideHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver"
          element={
            <ProtectedRoute role="Driver">
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
