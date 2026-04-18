import React, { useState, useRef, useEffect } from 'react';
import { Bell, ChevronRight, CheckCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell = () => {
  const { notifications, markNotificationRead, markAllRead, logNotificationClick } = useAppContext();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unread = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async (n) => {
    // Mark read & log click in parallel
    markNotificationRead(n.id);
    logNotificationClick(n.id);

    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  // Category icon mapping
  const iconForTitle = (title = '') => {
    if (title.includes('Request Sent'))   return '📤';
    if (title.includes('New Rental'))     return '🔔';
    if (title.includes('Accepted'))       return '🎉';
    if (title.includes('Delivered'))      return '✅';
    if (title.includes('Declined'))       return '❌';
    return '📬';
  };

  return (
    <div className="notif-wrapper" ref={dropdownRef}>
      <button className="notif-bell" onClick={() => setOpen(o => !o)} aria-label="Notifications">
        <Bell size={20} />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-title">Notifications</span>
            {unread > 0 && (
              <button className="notif-clear" onClick={markAllRead}>
                <CheckCheck size={13} style={{ marginRight: 3 }} />
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={28} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.is_read ? 'unread' : ''} ${n.link ? 'clickable' : ''}`}
                  onClick={() => handleClick(n)}
                  role={n.link ? 'button' : undefined}
                  tabIndex={n.link ? 0 : undefined}
                >
                  <div className="notif-item-icon">{iconForTitle(n.title)}</div>
                  <div className="notif-item-content">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-body">{n.body}</div>
                    <div className="notif-item-time">
                      {new Date(n.created_at).toLocaleString([], {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {n.link && (
                    <ChevronRight size={14} className="notif-chevron" />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notif-footer">
              <button className="notif-view-all" onClick={() => { setOpen(false); navigate('/dashboard'); }}>
                View all in Dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
