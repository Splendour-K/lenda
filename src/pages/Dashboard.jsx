import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Package, Clock, Star, ArrowLeftRight, ShieldCheck,
  CheckCircle2, AlertCircle, Truck, Key, LayoutDashboard
} from 'lucide-react';
import './Dashboard.css';

/* ─────────────────────────────────────────
   Shared helpers
───────────────────────────────────────── */
const statusColor = (status) => {
  const map = {
    Requested: 'badge-warning',
    Accepted: 'badge-success',
    Ongoing: 'badge-success',
    Delivered: 'badge-success',
    Returned: 'badge-secondary',
    Rejected: 'badge-danger',
    Disputed: 'badge-danger',
  };
  return map[status] || 'badge-secondary';
};

const daysDiff = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

/* ─────────────────────────────────────────
   Borrower Dashboard
───────────────────────────────────────── */
const BorrowerDashboard = () => {
  const { currentUser, transactions, items, formatPrice, userProfile } = useAppContext();
  const navigate = useNavigate();

  const myBorrows = transactions.filter(t => t.borrower_id === currentUser?.id);
  const active = myBorrows.filter(t => ['Requested', 'Accepted', 'Ongoing', 'Delivered'].includes(t.status));
  const past = myBorrows.filter(t => ['Returned', 'Rejected'].includes(t.status));

  // Recommendations: items from same university
  const recommended = items.filter(i =>
    i.owner?.university &&
    userProfile?.university &&
    i.owner.university.toLowerCase() === userProfile.university.toLowerCase()
  ).slice(0, 4);

  return (
    <div className="dashboard-section animate-fade-in">
      {/* Stats row */}
      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <Package size={22} className="dash-stat-icon" />
          <div>
            <div className="dash-stat-value">{active.length}</div>
            <div className="dash-stat-label">Active Borrows</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <Clock size={22} className="dash-stat-icon" />
          <div>
            <div className="dash-stat-value">{past.length}</div>
            <div className="dash-stat-label">Completed</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <Star size={22} className="dash-stat-icon" />
          <div>
            <div className="dash-stat-value">{userProfile?.rating ?? '—'}</div>
            <div className="dash-stat-label">Your Rating</div>
          </div>
        </div>
      </div>

      {/* Active borrows */}
      <div className="dash-section-header">
        <h2>Active Requests</h2>
      </div>
      {active.length === 0 ? (
        <div className="dash-empty-card">
          <Package size={36} className="dash-empty-icon" />
          <p>No active borrows. Browse items to get started.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>Browse Items</button>
        </div>
      ) : (
        <div className="dash-list">
          {active.map(txn => {
            const daysLeft = daysDiff(txn.end_date);
            const isUrgent = daysLeft !== null && daysLeft <= 1;
            return (
              <div key={txn.id} className={`dash-txn-card ${isUrgent ? 'urgent' : ''}`}>
                <div className="dash-txn-main">
                  <div className="dash-txn-title">{txn.item?.title || 'Item'}</div>
                  <span className={`badge ${statusColor(txn.status)}`}>{txn.status}</span>
                </div>
                <div className="dash-txn-meta">
                  <span>📅 {txn.start_date} → {txn.end_date}</span>
                  {daysLeft !== null && (
                    <span className={isUrgent ? 'text-danger' : 'text-muted'}>
                      {daysLeft > 0 ? `${daysLeft}d remaining` : daysLeft === 0 ? 'Due today!' : 'Overdue!'}
                    </span>
                  )}
                  <span className="text-muted">Total: {formatPrice(txn.total_price)}</span>
                </div>
                {/* Show OTP if delivered */}
                {txn.status === 'Delivered' && (
                  <div className="dash-otp-display">
                    <Key size={14} /> Your handover code: <strong>{txn.otp_code}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recommendations */}
      {recommended.length > 0 && (
        <>
          <div className="dash-section-header mt-8">
            <h2>From Your University</h2>
            <span className="text-muted" style={{ fontSize: 13 }}>{userProfile?.university}</span>
          </div>
          <div className="dash-recommend-grid">
            {recommended.map(item => (
              <div key={item.id} className="dash-recommend-card" onClick={() => navigate(`/item/${item.id}`)}>
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="dash-recommend-img" />
                ) : (
                  <div className="dash-recommend-placeholder"><Package size={24} /></div>
                )}
                <div className="dash-recommend-body">
                  <div className="dash-recommend-title">{item.title}</div>
                  <div className="dash-recommend-price">{formatPrice(item.price, item.currency)}/2d</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   Lender Dashboard
───────────────────────────────────────── */
const LenderDashboard = () => {
  const { currentUser, transactions, items, formatPrice, verifyOTP, fetchTransactions } = useAppContext();
  const navigate = useNavigate();

  const [otpInput, setOtpInput] = useState({});
  const [otpStatus, setOtpStatus] = useState({});
  const [verifying, setVerifying] = useState(null);

  const myItems = items.filter(i => i.owner_id === currentUser?.id);
  const incoming = transactions.filter(t => t.item?.owner_id === currentUser?.id);

  const pending = incoming.filter(t => t.status === 'Requested');
  const active = incoming.filter(t => ['Accepted', 'Ongoing'].includes(t.status));
  const delivered = incoming.filter(t => t.status === 'Delivered');
  const completed = incoming.filter(t => ['Returned', 'Rejected'].includes(t.status));

  const totalRevenue = incoming
    .filter(t => ['Delivered', 'Returned'].includes(t.status))
    .reduce((sum, t) => sum + Number(t.total_price || 0), 0);

  const handleVerifyOTP = async (txnId) => {
    const code = otpInput[txnId];
    if (!code || code.length !== 5) {
      setOtpStatus(p => ({ ...p, [txnId]: { error: 'Please enter the 5-digit code.' } }));
      return;
    }
    setVerifying(txnId);
    const result = await verifyOTP(txnId, code);
    setVerifying(null);
    if (result.success) {
      setOtpStatus(p => ({ ...p, [txnId]: { success: 'Delivery confirmed!' } }));
    } else {
      setOtpStatus(p => ({ ...p, [txnId]: { error: result.error } }));
    }
  };

  const TxnCard = ({ txn, showOtp = false }) => {
    const daysLeft = daysDiff(txn.end_date);
    return (
      <div key={txn.id} className="dash-txn-card">
        <div className="dash-txn-main">
          <div>
            <div className="dash-txn-title">{txn.item?.title || 'Item'}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Borrower: {txn.borrower?.name || '—'}
            </div>
          </div>
          <span className={`badge ${statusColor(txn.status)}`}>{txn.status}</span>
        </div>
        <div className="dash-txn-meta">
          <span>📅 {txn.start_date} → {txn.end_date}</span>
          {daysLeft !== null && daysLeft <= 2 && (
            <span className="text-danger">
              {daysLeft >= 0 ? `${daysLeft}d remaining` : 'Overdue!'}
            </span>
          )}
          <span className="text-muted">{formatPrice(txn.total_price)}</span>
        </div>

        {showOtp && (
          <div className="dash-otp-form">
            <div className="dash-otp-label">
              <Key size={14} /> Enter borrower's handover code to confirm delivery:
            </div>
            <div className="dash-otp-row">
              <input
                type="text"
                maxLength={5}
                inputMode="numeric"
                placeholder="XXXXX"
                className="form-input dash-otp-input"
                value={otpInput[txn.id] || ''}
                onChange={e => setOtpInput(p => ({ ...p, [txn.id]: e.target.value.replace(/\D/g, '') }))}
              />
              <button
                className="btn btn-primary"
                onClick={() => handleVerifyOTP(txn.id)}
                disabled={verifying === txn.id}
              >
                {verifying === txn.id ? 'Verifying…' : 'Confirm'}
              </button>
            </div>
            {otpStatus[txn.id]?.success && (
              <div className="dash-otp-success"><CheckCircle2 size={14} /> {otpStatus[txn.id].success}</div>
            )}
            {otpStatus[txn.id]?.error && (
              <div className="dash-otp-error"><AlertCircle size={14} /> {otpStatus[txn.id].error}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-section animate-fade-in">
      {/* Stats row */}
      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <Package size={22} className="dash-stat-icon" />
          <div>
            <div className="dash-stat-value">{myItems.length}</div>
            <div className="dash-stat-label">Listed Items</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <Truck size={22} className="dash-stat-icon" />
          <div>
            <div className="dash-stat-value">{active.length + pending.length}</div>
            <div className="dash-stat-label">Active Rentals</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <ShieldCheck size={22} className="dash-stat-icon" />
          <div>
            <div className="dash-stat-value">{formatPrice(totalRevenue)}</div>
            <div className="dash-stat-label">Revenue</div>
          </div>
        </div>
      </div>

      {/* Pending requests needing OTP verification */}
      {delivered.length > 0 && (
        <>
          <div className="dash-section-header">
            <h2>🔑 Pending Verification</h2>
            <span className="badge badge-warning">{delivered.length}</span>
          </div>
          <div className="dash-list">
            {delivered.map(txn => <TxnCard key={txn.id} txn={txn} showOtp={true} />)}
          </div>
        </>
      )}

      {/* New incoming requests */}
      <div className="dash-section-header mt-6">
        <h2>Incoming Requests</h2>
        {pending.length > 0 && <span className="badge badge-warning">{pending.length} new</span>}
      </div>
      {pending.length === 0 ? (
        <div className="dash-empty-card">
          <AlertCircle size={28} className="dash-empty-icon" />
          <p>No pending requests right now.</p>
        </div>
      ) : (
        <div className="dash-list">
          {pending.map(txn => <TxnCard key={txn.id} txn={txn} />)}
        </div>
      )}

      {/* Active rentals */}
      {active.length > 0 && (
        <>
          <div className="dash-section-header mt-6">
            <h2>Active Rentals</h2>
          </div>
          <div className="dash-list">
            {active.map(txn => <TxnCard key={txn.id} txn={txn} />)}
          </div>
        </>
      )}

      {/* Manage listings */}
      <div className="dash-section-header mt-6">
        <h2>Your Listings</h2>
        <button className="btn btn-primary" onClick={() => navigate('/list-item')} style={{ fontSize: 13, padding: '6px 14px' }}>
          + Add Item
        </button>
      </div>
      {myItems.length === 0 ? (
        <div className="dash-empty-card">
          <Package size={28} className="dash-empty-icon" />
          <p>You haven't listed any items yet.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/list-item')}>List an Item</button>
        </div>
      ) : (
        <div className="dash-list">
          {myItems.map(item => (
            <div key={item.id} className="dash-txn-card" onClick={() => navigate(`/item/${item.id}`)} style={{ cursor: 'pointer' }}>
              <div className="dash-txn-main">
                <div className="dash-txn-title">{item.title}</div>
                <span className={`badge ${item.status === 'Available' ? 'badge-success' : 'badge-warning'}`}>{item.status}</span>
              </div>
              <div className="dash-txn-meta">
                <span>{item.category}</span>
                <span>{formatPrice(item.price, item.currency)}/2d</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   Main Dashboard Page
───────────────────────────────────────── */
const Dashboard = () => {
  const { currentUser, userProfile, activeRole, switchRole } = useAppContext();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <div className="container mt-8 text-center">
        <h2>Please login to view your dashboard.</h2>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/auth')}>Login</button>
      </div>
    );
  }

  return (
    <div className="container page-container animate-fade-in">
      {/* Header */}
      <div className="dash-header">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <LayoutDashboard size={24} className="text-primary" />
            <h1 style={{ margin: 0 }}>Dashboard</h1>
          </div>
          <p className="text-muted" style={{ fontSize: 14 }}>
            Welcome back, {userProfile?.name || 'User'}
          </p>
        </div>

        {/* Role switcher */}
        <div className="dash-role-switch">
          <button
            className={`dash-role-btn ${activeRole === 'borrower' ? 'active' : ''}`}
            onClick={() => switchRole('borrower')}
          >
            <Package size={15} /> Borrower
          </button>
          <button
            className={`dash-role-btn ${activeRole === 'lender' ? 'active' : ''}`}
            onClick={() => switchRole('lender')}
          >
            <ArrowLeftRight size={15} /> Lender
          </button>
        </div>
      </div>

      {/* Sub-dashboards */}
      {activeRole === 'borrower' ? <BorrowerDashboard /> : <LenderDashboard />}
    </div>
  );
};

export default Dashboard;
