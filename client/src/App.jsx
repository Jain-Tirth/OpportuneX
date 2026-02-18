import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Saved from './pages/Saved';
import { supabase } from './lib/supaBaseClient';
import './App.css';

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

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
    return null;
  }

  return (
    <div className="app">
      <BrowserRouter>
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
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;