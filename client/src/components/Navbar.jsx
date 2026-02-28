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

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    const handleSignOut = async () => {
        setMobileOpen(false);
        await supabase.auth.signOut();
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="navbar__inner">
                {/* Brand — uses favicon.png */}
                <Link to="/" className="navbar__brand">
                    <img
                        src="/favicon.png"
                        alt="UniStop logo"
                        className="navbar__logo-img"
                    />
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
                            Send Magic Link
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

            {/* Mobile Menu Overlay */}
            {mobileOpen && (
                <div
                    className="navbar__mobile-backdrop"
                    onClick={() => setMobileOpen(false)}
                />
            )}
            <div className={`navbar__mobile ${mobileOpen ? 'navbar__mobile--open' : ''}`}>
                <Link
                    to="/home"
                    className={`navbar__mobile-link ${isActive('/home') ? 'navbar__mobile-link--active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Explore Events
                </Link>
                <Link
                    to="/saved"
                    className={`navbar__mobile-link ${isActive('/saved') ? 'navbar__mobile-link--active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                    Saved Events
                </Link>

                <div className="navbar__mobile-divider" />

                {user ? (
                    <button className="navbar__mobile-link navbar__mobile-signout" onClick={handleSignOut}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign out
                    </button>
                ) : (
                    <Link
                        to="/"
                        className="navbar__mobile-link navbar__mobile-cta"
                        onClick={() => setMobileOpen(false)}
                    >
                        Send Magic Link
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
