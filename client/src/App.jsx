import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import api from './api';

// Прием 2: Code splitting (React.lazy + Suspense)
const Auth = lazy(() => import('./components/Auth'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const AssignmentDetail = lazy(() => import('./components/AssignmentDetail'));

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Сессия недействительна или истекла, требуется повторный вход');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Инициализация Campus Emerald...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar user={user} onLogout={handleLogout} />

        <main className="flex-1">
          <Suspense fallback={
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
              Загрузка...
            </div>
          }>
            <Routes>
              <Route 
                path="/auth" 
                element={!user ? <Auth onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} 
              />
              <Route 
                path="/" 
                element={
                  user ? (
                    user.role === 'moderator' || user.role === 'admin' 
                      ? <TeacherDashboard /> 
                      : <StudentDashboard />
                  ) : <Navigate to="/auth" />
                } 
              />
              <Route 
                path="/assignments/:id" 
                element={user ? <AssignmentDetail user={user} /> : <Navigate to="/auth" />} 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}