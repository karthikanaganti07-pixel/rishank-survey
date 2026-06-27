import React, { useState, useEffect } from 'react';
import { FaPhoneAlt, FaMapMarkerAlt, FaSignOutAlt, FaWhatsapp, FaGlobeAsia, FaSun, FaMoon } from 'react-icons/fa';
import Login from './components/Login';
import ClientHub from './components/ClientHub';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('rishank_theme') || 'light';
  });

  // Apply theme class to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rishank_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Read session from storage on load
  useEffect(() => {
    const savedSession = localStorage.getItem('rishank_session');
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (e) {
        console.error("Failed to parse session", e);
        localStorage.removeItem('rishank_session');
      }
    }
  }, []);

  // Login action handler
  const handleLoginSuccess = (userData) => {
    localStorage.setItem('rishank_session', JSON.stringify(userData));
    setSession(userData);
  };

  // Logout action handler
  const handleLogout = () => {
    localStorage.removeItem('rishank_session');
    setSession(null);
  };


  return (
    <div>
      {/* Immersive background fixed nodes */}
      <div className="bg-particles">
        <div className="glowing-orbs orb-gold"></div>
        <div className="glowing-orbs orb-blue"></div>
      </div>


      {/* Premium Luxury Navigation Header Bar */}
      <header className="luxury-navbar">
        <div className="luxury-container navbar-content">
          <div className="logo-section" onClick={() => handleLogout()}>
            <FaGlobeAsia className="logo-icon" />
            <span>
              <span className="gold-text">RISHANK</span> SURVEY
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a 
              href="tel:09581421614" 
              className="navbar-contact-link"
            >
              <FaPhoneAlt className="navbar-contact-icon" />
              <span>095814 21614</span>
            </a>

            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <FaSun /> : <FaMoon />}
            </button>

            {session && (
              <button 
                onClick={handleLogout} 
                className="navbar-logout-btn"
                title="Secure logout session"
              >
                <FaSignOutAlt />
                <span className="hide-mobile">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Core View Area */}
      <main style={{ minHeight: 'calc(100vh - 70px)' }}>
        {!session ? (
          <Login 
            onLoginSuccess={handleLoginSuccess} 
          />
        ) : session.role === 'admin' ? (
          <AdminDashboard user={session} onLogout={handleLogout} />
        ) : (
          <ClientHub user={session} onLogout={handleLogout} />
        )}
      </main>

      {/* Direct Contact Footer Bar */}
      <footer className="footer-bar">
        <div className="luxury-container">
          <div className="footer-logo">
            <span>RISHANK LAND SURVEY SOLUTIONS</span>
          </div>
          <p className="footer-meta">
            Millimeter precision in land measurement mapping, layouts layouts, contours, and boundary demarcations. Serving Nalgonda and greater Telangana since 2012.
          </p>

          <div className="footer-contacts">
            <a href="tel:09581421614" className="footer-contact-item">
              <FaPhoneAlt className="footer-contact-icon" />
              <span>Office Call: +91 95814 21614</span>
            </a>

            <a 
              href="https://share.google/HBBDTg3AaljR1jH5I" 
              target="_blank" 
              rel="noreferrer" 
              className="footer-contact-item"
            >
              <FaMapMarkerAlt className="footer-contact-icon" />
              <span>Location: Raghunathapalem, Nalgonda, 508204</span>
            </a>
          </div>

          <div style={{ marginTop: '20px' }}>
            <a 
              href="https://share.google/HBBDTg3AaljR1jH5I" 
              target="_blank" 
              rel="noreferrer" 
              className="btn-premium"
              style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem' }}
            >
              <FaMapMarkerAlt /> Find Us On Google Maps
            </a>
          </div>

          <div style={{ marginTop: '35px' }} className="copyright-text">
            &copy; {new Date().getFullYear()} Rishank Land Survey Solutions. Crafted with 3D Precision Geomatics. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
