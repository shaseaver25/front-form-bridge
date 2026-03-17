import { Navigate } from "react-router-dom";

// Redirect legacy /auth route to unified /login
const Auth = () => <Navigate to="/login" replace />;

export default Auth;
