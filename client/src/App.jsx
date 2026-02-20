import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Saved from './pages/Saved';
import Navbar from './components/Navbar';
import { supabase } from './lib/supaBaseClient';
import './App.css';

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/* Show Navbar on all pages except Landing */
const AppLayout = ({ isAuthenticated }) => {
  const location = useLocation();
  const showNavbar = location.pathname !== '/';

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/home"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Home />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/saved"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Saved />
            </ProtectedRoute>
          )}
        />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const SplashLoader = () => (
  <div className="splash-loader">
    <div className="splash-loader__ring" />
    <span className="splash-loader__text">UniStop</span>
  </div>
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthenticated(Boolean(data.session?.user));
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!mounted) return;
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return <SplashLoader />;
  }

  return (
    <div className="app">
      <BrowserRouter>
        <AppLayout isAuthenticated={isAuthenticated} />
      </BrowserRouter>
    </div>
  );
};

export default App;