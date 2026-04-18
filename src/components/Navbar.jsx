import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shirt, Search, Plus, LayoutDashboard } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CURRENCIES } from '../utils/constants';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, userProfile, currency, setCurrency, searchQuery, setSearchQuery } = useAppContext();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          <div className="brand-logo">
            <Shirt size={16} />
          </div>
          CampusCloset
        </Link>
        <div className="nav-actions">
          <select 
            className="form-input" 
            style={{ width: 'auto', padding: '6px 12px', height: 'auto', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {Object.entries(CURRENCIES).map(([code, { symbol }]) => (
              <option key={code} value={code}>{code} ({symbol})</option>
            ))}
          </select>
          <Link to="/admin" className="btn btn-outline" style={{ border: 'none', color: 'var(--muted-foreground)' }}>
            Admin
          </Link>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search items or university..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); navigate('/'); }}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
              className="form-input"
              style={{ paddingLeft: '36px', borderRadius: '20px', height: '38px' }}
            />
          </div>
          <Link to="/list-item" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            List an Item
          </Link>
          {currentUser ? (
            <>
              <Link to="/dashboard" className="btn btn-outline" style={{ border: 'none', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <NotificationBell />
              <Link to="/profile">
                {userProfile?.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt="User Profile"
                    className="avatar"
                  />
                ) : (
                  <div className="avatar" style={{ background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {(userProfile?.name || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </Link>
            </>
          ) : (
            <Link to="/auth" className="btn btn-secondary">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
