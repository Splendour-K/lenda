import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Package, Clock, Star, ArrowLeftRight, ShieldCheck,
  CheckCircle2, AlertCircle, Truck, Key, LayoutDashboard,
  XCircle, ChevronRight, Lock, RotateCcw
} from 'lucide-react';
import './Dashboard.css';

/* ─────────────────────────────────────────
   Shared helpers
───────────────────────────────────────── */
const STATUS_ORDER = ['Requested', 'Accepted', 'Delivered', 'Returned'];

const STATUS_META = {
  Requested:  { color: 'badge-warning',   label: 'Requested' },
  Accepted:   { color: 'badge-info',      label: 'Accepted'  },
  Ongoing:    { color: 'badge-info',      label: 'Ongoing'   },
  Delivered:  { color: 'badge-success',   label: 'Delivered' },
  Returned:   { color: 'badge-secondary', label: 'Returned'  },
  Rejected:   { color: 'badge-danger',    label: 'Rejected'  },
  Disputed:   { color: 'badge-danger',    label: 'Disputed'  },
};

const statusColor = (s) => STATUS_META[s]?.color || 'badge-secondary';

const daysDiff = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86_400_000);
};

/* Lifecycle step bar */
const LifecycleBar = ({ status }) => {
  const steps = ['Requested', 'Accepted', 'Delivered', 'Returned'];
  const current = steps.indexOf(status);
  const isRejected = status === 'Rejected';

  return (
    <div className="lifecycle-bar">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className={`lifecycle-step ${i < current ? 'done' : i === current ? 'active' : ''} ${isRejected ? 'rejected' : ''}`}>
            {i < current ? <CheckCircle2 size={13} /> : i === current && isRejected ? <XCircle size={13} /> : <span>{i + 1}</span>}
            <span className="lifecycle-label">{step}</span>
          </div>
          {i < steps.length - 1 && <div className={`lifecycle-line ${i < current ? 'done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────
   Borrower Dashboard
───────────────────────────────────────── */
const BorrowerDashboard = () => {
  const { currentUser, transactions, items, formatPrice, userProfile } = useAppContext();
  const navigate = useNavigate();

  const myBorrows = transactions.filter(t => t.borrower_id === currentUser?.id);
  const active = myBorrows.filter(t => !['Returned', 'Rejected'].includes(t.status));
  const past   = myBorrows.filter(t => ['Returned', 'Rejected'].includes(t.status));

  const recommended = items.filter(i =>
    i.owner?.university &&
    userProfile?.university &&
    i.owner.university.toLowerCase() === userProfile.university.toLowerCase()
  ).slice(0, 4);

  return (
    <div className="dashboard-section animate-fade-in">
      {/* Stats */}
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
        <h2>Active Borrows</h2>
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
                  <div>
                    <div className="dash-txn-title">{txn.item?.title || 'Item'}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      📅 {txn.start_date} → {txn.end_date}
                      {daysLeft !== null && (
                        <span className={isUrgent ? 'text-danger' : ''} style={{ marginLeft: 8 }}>
                          {daysLeft > 0 ? `(${daysLeft}d left)` : daysLeft === 0 ? '(Due today!)' : '(Overdue!)'}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${statusColor(txn.status)}`}>{txn.status}</span>
                </div>

                <LifecycleBar status={txn.status} />

                {/* Show OTP for borrower to reference */}
                {['Requested', 'Accepted'].includes(txn.status) && txn.otp_code && (
                  <div className="dash-otp-display">
                    <Key size={14} />
                    <span>Your handover code: </span>
                    <strong className="otp-digits">{txn.otp_code}</strong>
                    <span className="text-muted" style={{ fontSize: 11, marginLeft: 8 }}>
                      (Share with lender on pickup)
                    </span>
                  </div>
                )}

                {txn.status === 'Delivered' && (
                  <div className="dash-otp-display success">
                    <CheckCircle2 size={14} />
                    <span>Delivered on {txn.otp_verified_at ? new Date(txn.otp_verified_at).toLocaleDateString() : '—'}</span>
                    <Lock size={12} style={{ marginLeft: 'auto' }} />
                    <span style={{ fontSize: 11 }}>Locked</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Past borrows */}
      {past.length > 0 && (
        <>
          <div className="dash-section-header mt-6">
            <h2>Past Borrows</h2>
          </div>
          <div className="dash-list">
            {past.map(txn => (
              <div key={txn.id} className="dash-txn-card" style={{ opacity: 0.75 }}>
                <div className="dash-txn-main">
                  <div className="dash-txn-title">{txn.item?.title || 'Item'}</div>
                  <span className={`badge ${statusColor(txn.status)}`}>{txn.status}</span>
                </div>
                <div className="dash-txn-meta">
                  <span>📅 {txn.start_date} → {txn.end_date}</span>
                  <span>{formatPrice(txn.total_price)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
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
                {item.images?.[0]
                  ? <img src={item.images[0]} alt={item.title} className="dash-recommend-img" />
                  : <div className="dash-recommend-placeholder"><Package size={24} /></div>
                }
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
   OTP Verification Widget (used by Lender)
───────────────────────────────────────── */
const OTPVerifier = ({ txn }) => {
  const { verifyOTP } = useAppContext();
  const [code, setCode] = useState('');
  const [state, setState] = useState('idle'); // idle | verifying | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(txn.otp_attempts || 0);

  const MAX_ATTEMPTS = 5;
  const remaining = MAX_ATTEMPTS - attempts;
  const isLocked = attempts >= MAX_ATTEMPTS || txn.otp_used;

  const handleVerify = async () => {
    if (!code || code.length !== 5) { setErrorMsg('Please enter the full 5-digit code.'); setState('error'); return; }
    if (isLocked) return;

    setState('verifying');
    const result = await verifyOTP(txn.id, code);

    if (result.success) {
      setState('success');
    } else {
      setAttempts(a => a + 1);
      setErrorMsg(result.error);
      setState('error');
      setCode('');
    }
  };

  if (txn.status === 'Delivered' || txn.otp_used) {
    return (
      <div className="otp-widget success-locked">
        <CheckCircle2 size={16} />
        <span>Delivery verified on {txn.otp_verified_at ? new Date(txn.otp_verified_at).toLocaleString() : '—'}</span>
        <Lock size={13} style={{ marginLeft: 'auto' }} />
      </div>
    );
  }

  return (
    <div className="otp-widget">
      <div className="otp-widget-label">
        <Key size={14} />
        <strong>Enter borrower's 5-digit handover code to confirm delivery</strong>
      </div>

      {state !== 'success' ? (
        <>
          <div className="otp-input-row">
            {[0,1,2,3,4].map(i => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-digit-box ${state === 'error' ? 'error' : state === 'success' ? 'success' : ''}`}
                value={code[i] || ''}
                disabled={isLocked || state === 'verifying'}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g,'');
                  const arr = code.split('');
                  arr[i] = val;
                  const next = arr.join('').slice(0,5);
                  setCode(next);
                  setState('idle');
                  if (val && i < 4) {
                    document.getElementById(`otp-${txn.id}-${i+1}`)?.focus();
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Backspace' && !code[i] && i > 0) {
                    document.getElementById(`otp-${txn.id}-${i-1}`)?.focus();
                  }
                }}
                id={`otp-${txn.id}-${i}`}
              />
            ))}
            <button
              className={`btn ${state === 'error' ? 'btn-outline' : 'btn-primary'} otp-submit-btn`}
              onClick={handleVerify}
              disabled={state === 'verifying' || isLocked || code.length !== 5}
            >
              {state === 'verifying' ? '…' : <ChevronRight size={18} />}
            </button>
          </div>

          {state === 'error' && (
            <div className="otp-feedback error">
              <AlertCircle size={13} />
              {errorMsg}
            </div>
          )}

          {!isLocked && (
            <div className="otp-attempts-bar">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <div key={i} className={`attempt-pip ${i < attempts ? 'used' : ''}`} />
              ))}
              <span className="text-muted" style={{ fontSize: 11 }}>
                {remaining} attempt{remaining !== 1 ? 's' : ''} left
              </span>
            </div>
          )}

          {isLocked && (
            <div className="otp-feedback error">
              <Lock size={13} /> Maximum attempts reached. This transaction is locked.
            </div>
          )}
        </>
      ) : (
        <div className="otp-feedback success">
          <CheckCircle2 size={14} /> Delivery confirmed! Transaction is now locked.
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   Lender Dashboard
───────────────────────────────────────── */
const LenderDashboard = () => {
  const { currentUser, transactions, items, formatPrice, acceptRequest, rejectRequest } = useAppContext();
  const navigate = useNavigate();
  const [actioning, setActioning] = useState(null);

  const myItems = items.filter(i => i.owner_id === currentUser?.id);
  const incoming = transactions.filter(t => t.item?.owner_id === currentUser?.id);

  const pending   = incoming.filter(t => t.status === 'Requested');
  const accepted  = incoming.filter(t => t.status === 'Accepted');
  const delivered = incoming.filter(t => t.status === 'Delivered');
  const completed = incoming.filter(t => ['Returned', 'Rejected'].includes(t.status));

  const totalRevenue = incoming
    .filter(t => ['Delivered', 'Returned'].includes(t.status))
    .reduce((sum, t) => sum + Number(t.total_price || 0), 0);

  const handleAccept = async (txnId) => {
    setActioning(txnId + '_accept');
    await acceptRequest(txnId);
    setActioning(null);
  };

  const handleReject = async (txnId) => {
    if (!confirm('Reject this rental request?')) return;
    setActioning(txnId + '_reject');
    await rejectRequest(txnId);
    setActioning(null);
  };

  const TxnCard = ({ txn, actions = null, showOtp = false }) => {
    const daysLeft = daysDiff(txn.end_date);
    const isUrgent = daysLeft !== null && daysLeft <= 1;

    return (
      <div className={`dash-txn-card ${isUrgent ? 'urgent' : ''}`}>
        <div className="dash-txn-main">
          <div>
            <div className="dash-txn-title">{txn.item?.title || 'Item'}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Borrower: <strong>{txn.borrower?.name || '—'}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge ${statusColor(txn.status)}`}>{txn.status}</span>
            <button className="dash-view-btn" onClick={() => navigate(`/transaction/${txn.id}`)}>View →</button>
          </div>
        </div>

        <LifecycleBar status={txn.status} />

        <div className="dash-txn-meta">
          <span>📅 {txn.start_date} → {txn.end_date}</span>
          {isUrgent && daysLeft !== null && (
            <span className="text-danger">
              {daysLeft >= 0 ? `${daysLeft}d remaining` : 'Overdue!'}
            </span>
          )}
          <span>{formatPrice(txn.total_price)}</span>
        </div>

        {actions}

        {showOtp && <OTPVerifier txn={txn} />}
      </div>
    );
  };

  return (
    <div className="dashboard-section animate-fade-in">
      {/* Stats */}
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
            <div className="dash-stat-value">{accepted.length + pending.length}</div>
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

      {/* ── New requests requiring Accept/Reject ── */}
      <div className="dash-section-header">
        <h2>New Requests</h2>
        {pending.length > 0 && <span className="badge badge-warning">{pending.length} new</span>}
      </div>
      {pending.length === 0 ? (
        <div className="dash-empty-card">
          <AlertCircle size={28} className="dash-empty-icon" />
          <p>No pending requests right now.</p>
        </div>
      ) : (
        <div className="dash-list">
          {pending.map(txn => (
            <TxnCard
              key={txn.id}
              txn={txn}
              actions={
                <div className="dash-action-row">
                  <button
                    className="btn btn-primary"
                    disabled={actioning === txn.id + '_accept'}
                    onClick={() => handleAccept(txn.id)}
                  >
                    <CheckCircle2 size={14} />
                    {actioning === txn.id + '_accept' ? 'Accepting…' : 'Accept & Generate Code'}
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                    disabled={actioning === txn.id + '_reject'}
                    onClick={() => handleReject(txn.id)}
                  >
                    <XCircle size={14} />
                    {actioning === txn.id + '_reject' ? 'Rejecting…' : 'Decline'}
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {/* ── Accepted → awaiting OTP verification ── */}
      {accepted.length > 0 && (
        <>
          <div className="dash-section-header mt-6">
            <h2>🔑 Awaiting Delivery Verification</h2>
            <span className="badge badge-warning">{accepted.length}</span>
          </div>
          <div className="dash-list">
            {accepted.map(txn => <TxnCard key={txn.id} txn={txn} showOtp={true} />)}
          </div>
        </>
      )}

      {/* ── Delivered (locked) ── */}
      {delivered.length > 0 && (
        <>
          <div className="dash-section-header mt-6">
            <h2>Delivered</h2>
          </div>
          <div className="dash-list">
            {delivered.map(txn => <TxnCard key={txn.id} txn={txn} showOtp={true} />)}
          </div>
        </>
      )}

      {/* ── Your listings ── */}
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

      {/* ── Completed / History ── */}
      {completed.length > 0 && (
        <>
          <div className="dash-section-header mt-6">
            <h2>History</h2>
          </div>
          <div className="dash-list">
            {completed.map(txn => (
              <div key={txn.id} className="dash-txn-card" style={{ opacity: 0.7 }}>
                <div className="dash-txn-main">
                  <div className="dash-txn-title">{txn.item?.title}</div>
                  <span className={`badge ${statusColor(txn.status)}`}>{txn.status}</span>
                </div>
                <div className="dash-txn-meta">
                  <span>{txn.borrower?.name || '—'}</span>
                  <span>📅 {txn.start_date} → {txn.end_date}</span>
                  <span>{formatPrice(txn.total_price)}</span>
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
        <div className="dash-role-switch">
          <button className={`dash-role-btn ${activeRole === 'borrower' ? 'active' : ''}`} onClick={() => switchRole('borrower')}>
            <Package size={15} /> Borrower
          </button>
          <button className={`dash-role-btn ${activeRole === 'lender' ? 'active' : ''}`} onClick={() => switchRole('lender')}>
            <ArrowLeftRight size={15} /> Lender
          </button>
        </div>
      </div>

      {activeRole === 'borrower' ? <BorrowerDashboard /> : <LenderDashboard />}
    </div>
  );
};

export default Dashboard;
