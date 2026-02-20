import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supaBaseClient';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const initSession = async () => {
            const { data } = await supabase.auth.getSession();
            setUser(data.session?.user || null);
        };
        initSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user || null);
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="navbar__inner">
                {/* Brand */}
                <Link to="/" className="navbar__brand">
                    <div className="navbar__logo">
                        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                            <defs>
                                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                            <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
                            <path d="M10 22V12l6-4 6 4v10l-6 4-6-4z" fill="rgba(255,255,255,0.95)" />
                            <path d="M16 8l6 4v10" stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" />
                        </svg>
                    </div>
                    <span className="navbar__brand-text">UniStop</span>
                </Link>

                {/* Desktop Nav Links */}
                <div className="navbar__links">
                    <Link
                        to="/home"
                        className={`navbar__link ${isActive('/home') ? 'navbar__link--active' : ''}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        Explore
                    </Link>
                    <Link
                        to="/saved"
                        className={`navbar__link ${isActive('/saved') ? 'navbar__link--active' : ''}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                        </svg>
                        Saved
                    </Link>
                </div>

                {/* Right section */}
                <div className="navbar__actions">
                    {user ? (
                        <div className="navbar__user">
                            <div className="navbar__avatar">
                                {user.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <button className="navbar__signout" onClick={handleSignOut}>
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <Link to="/" className="navbar__cta">
                            Sign in
                        </Link>
                    )}
                </div>

                {/* Mobile toggle */}
                <button
                    className={`navbar__toggle ${mobileOpen ? 'navbar__toggle--open' : ''}`}
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle navigation"
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`navbar__mobile ${mobileOpen ? 'navbar__mobile--open' : ''}`}>
                <Link
                    to="/home"
                    className={`navbar__mobile-link ${isActive('/home') ? 'navbar__mobile-link--active' : ''}`}
                >
                    Explore Events
                </Link>
                <Link
                    to="/saved"
                    className={`navbar__mobile-link ${isActive('/saved') ? 'navbar__mobile-link--active' : ''}`}
                >
                    Saved Events
                </Link>
                {user ? (
                    <button className="navbar__mobile-link navbar__mobile-signout" onClick={handleSignOut}>
                        Sign out
                    </button>
                ) : (
                    <Link to="/" className="navbar__mobile-link navbar__mobile-cta">
                        Sign in
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
