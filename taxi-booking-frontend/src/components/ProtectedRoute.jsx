import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { selectIsLoggedIn, selectRole } from "../features/auth/authSlice";

const ProtectedRoute = ({ children, role }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const userRole = useSelector(selectRole);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
