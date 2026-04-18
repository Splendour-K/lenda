import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shirt, Search, Plus, LayoutDashboard, User, Home } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CURRENCIES } from '../utils/constants';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, userProfile, currency, setCurrency, searchQuery, setSearchQuery, notifications } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const unread = notifications.filter(n => !n.is_read).length;

  const handleSearch = (val) => {
    setSearchQuery(val);
    if (location.pathname !== '/') navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ── Top navbar ── */}
      <header className="navbar">
        <div className="container navbar-content">
          {/* Brand */}
          <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
            <div className="brand-logo"><Shirt size={15} /></div>
            Lenda
          </Link>

          {/* Desktop search */}
          <div className="navbar-search">
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search items, categories, universities…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 36, borderRadius: 24, height: 40, fontSize: 14, background: 'var(--secondary)', borderColor: 'transparent' }}
              />
            </div>
          </div>

          {/* Desktop actions */}
          <div className="nav-actions">
            {/* Currency picker */}
            <select
              className="form-input hide-mobile"
              style={{ width: 'auto', padding: '6px 10px', height: 'auto', borderRadius: 20, fontSize: 13 }}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {Object.entries(CURRENCIES).map(([code, { symbol }]) => (
                <option key={code} value={code}>{code} ({symbol})</option>
              ))}
            </select>

            {/* Desktop nav links */}
            <div className="nav-desktop-only">
              <Link to="/list-item" className="btn btn-primary" style={{ textDecoration: 'none', fontSize: 13, padding: '8px 14px' }}>
                <Plus size={14} style={{ marginRight: 4 }} /> List Item
              </Link>
              {currentUser && (
                <>
                  <Link to="/dashboard" className="btn btn-outline" style={{ border: 'none', color: 'var(--muted-foreground)', fontSize: 13, padding: '8px 12px', textDecoration: 'none' }}>
                    <LayoutDashboard size={15} style={{ marginRight: 4 }} /> Dashboard
                  </Link>
                  <NotificationBell />
                </>
              )}
            </div>

            {/* Avatar / Login */}
            {currentUser ? (
              <Link to="/profile" style={{ display: 'flex' }}>
                {userProfile?.avatar ? (
                  <img src={userProfile.avatar} alt="Profile" className="avatar" />
                ) : (
                  <div className="avatar" style={{ background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                    {(userProfile?.name || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </Link>
            ) : (
              <Link to="/auth" className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: 13, padding: '8px 14px' }}>Login</Link>
            )}
          </div>
        </div>

        {/* Mobile search bar (below brand row) */}
        <div className="mobile-search-bar">
          <div className="mobile-search-wrapper">
            <Search size={15} className="mobile-search-icon" />
            <input
              type="search"
              placeholder="Search items or university…"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </header>

      {/* ── Mobile bottom navigation ── */}
      <nav className="bottom-nav">
        <Link to="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
          <Home size={21} />
          Browse
        </Link>
        <Link to="/list-item" className={`bottom-nav-item ${isActive('/list-item') ? 'active' : ''}`}>
          <Plus size={21} />
          List
        </Link>
        {currentUser ? (
          <>
            <button
              className={`bottom-nav-item ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard size={21} />
              {unread > 0 && <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>}
              Dash
            </button>
            <Link to="/profile" className={`bottom-nav-item ${isActive('/profile') ? 'active' : ''}`}>
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="profile" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <User size={21} />
              )}
              Profile
            </Link>
          </>
        ) : (
          <Link to="/auth" className={`bottom-nav-item ${isActive('/auth') ? 'active' : ''}`}>
            <User size={21} />
            Login
          </Link>
        )}
      </nav>
    </>
  );
};

export default Navbar;
