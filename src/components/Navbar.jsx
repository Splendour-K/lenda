import React from 'react';
import { Link } from 'react-router-dom';
import { Shirt, Search, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser } = useAppContext();

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
          <Link to="/admin" className="btn btn-outline" style={{ border: 'none', color: 'var(--muted-foreground)' }}>
            Admin
          </Link>
          <div className="btn btn-outline search-btn">
            <Search size={16} style={{ marginRight: '8px' }} />
            Search items
          </div>
          <Link to="/list-item" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            List an Item
          </Link>
          {currentUser ? (
            <Link to="/profile">
              <img
                src={currentUser.user_metadata?.avatar || 'https://storage.googleapis.com/banani-avatars/avatar%2Fmale%2F18-25%2FEuropean%2F1'}
                alt="User Profile"
                className="avatar"
              />
            </Link>
          ) : (
            <Link to="/auth" className="btn btn-secondary">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
