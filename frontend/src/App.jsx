import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import InternshipSearch from './pages/InternshipSearch';
import MyApplications from './pages/MyApplications';

const PrivateRoute = ({ element, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return element;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'student') return <Navigate to="/student-dashboard" />;
  if (user.role === 'company') return <Navigate to="/company-dashboard" />;
  return <Navigate to="/internships" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/student-dashboard" element={
            <PrivateRoute element={<StudentDashboard />} roles={['student']} />
          } />
          <Route path="/company-dashboard" element={
            <PrivateRoute element={<CompanyDashboard />} roles={['company']} />
          } />
          <Route path="/internships" element={
            <PrivateRoute element={<InternshipSearch />} roles={['student','university_admin','system_admin']} />
          } />
          <Route path="/my-applications" element={
            <PrivateRoute element={<MyApplications />} roles={['student']} />
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
