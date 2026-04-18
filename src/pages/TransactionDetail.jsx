import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import {
  ArrowLeft, User, MapPin, Star, Calendar, DollarSign,
  Package, ShieldCheck, Clock, CheckCircle2, AlertCircle,
  Key, Lock, ChevronRight, XCircle
} from 'lucide-react';
import './TransactionDetail.css';

/* ── Lifecycle bar (same visual as Dashboard) ── */
const STEPS = ['Requested', 'Accepted', 'Delivered', 'Returned'];

const LifecycleBar = ({ status }) => {
  const current = STEPS.indexOf(status);
  const isRejected = status === 'Rejected';
  return (
    <div className="td-lifecycle">
      {STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <div className={`td-step ${i < current ? 'done' : i === current ? 'active' : ''} ${isRejected && i === 0 ? 'rejected' : ''}`}>
            <div className="td-step-dot">
              {i < current ? <CheckCircle2 size={14} />
                : isRejected && i === 0 ? <XCircle size={14} />
                : <span>{i + 1}</span>}
            </div>
            <div className="td-step-label">{step}</div>
          </div>
          {i < STEPS.length - 1 && <div className={`td-step-line ${i < current ? 'done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ── OTP verifier widget (lender only) ── */
const OTPVerifier = ({ txn, onSuccess }) => {
  const { verifyOTP, currentUser } = useAppContext();
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | verifying | success | error | locked
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(txn.otp_attempts || 0);
  const MAX = 5;

  const isLenderView = txn.item?.owner_id === currentUser?.id;
  const isLocked = txn.otp_used || attempts >= MAX || !['Requested', 'Accepted'].includes(txn.status);

  if (!isLenderView) return null; // Only render for lender

  if (txn.otp_used || txn.status === 'Delivered') {
    return (
      <div className="td-otp-section">
        <h3><Key size={16} /> OTP Verification</h3>
        <div className="td-otp-locked">
          <CheckCircle2 size={18} />
          <div>
            <div className="td-otp-locked-title">Delivery Verified</div>
            <div className="td-otp-locked-sub">
              Confirmed {txn.otp_verified_at
                ? new Date(txn.otp_verified_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                : ''}
            </div>
          </div>
          <Lock size={16} style={{ marginLeft: 'auto' }} />
        </div>
      </div>
    );
  }

  if (txn.status === 'Requested') {
    return (
      <div className="td-otp-section">
        <h3><Key size={16} /> OTP Verification</h3>
        <div className="td-otp-pending-notice">
          Accept the request first before verifying delivery.
        </div>
      </div>
    );
  }

  const handleVerify = async () => {
    if (code.length !== 5) { setErrorMsg('Enter all 5 digits.'); setPhase('error'); return; }
    if (isLocked) return;
    setPhase('verifying');
    const result = await verifyOTP(txn.id, code);
    if (result.success) {
      setPhase('success');
      if (onSuccess) onSuccess();
    } else {
      setAttempts(a => a + 1);
      setErrorMsg(result.error);
      setPhase('error');
      setCode('');
    }
  };

  return (
    <div className="td-otp-section">
      <h3><Key size={16} /> Confirm Delivery via OTP</h3>
      <p className="td-otp-instructions">
        Ask the borrower for their 5-digit handover code and enter it below to confirm delivery.
      </p>

      {phase !== 'success' ? (
        <>
          <div className="td-otp-inputs">
            {[0,1,2,3,4].map(i => (
              <input
                key={i}
                id={`td-otp-${txn.id}-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`td-otp-box ${phase === 'error' ? 'err' : ''}`}
                value={code[i] || ''}
                disabled={isLocked || phase === 'verifying'}
                onChange={e => {
                  const val = e.target.value.replace(/\D/, '');
                  const arr = code.split('');
                  arr[i] = val;
                  setCode(arr.join('').slice(0, 5));
                  setPhase('idle');
                  if (val && i < 4) document.getElementById(`td-otp-${txn.id}-${i+1}`)?.focus();
                }}
                onKeyDown={e => {
                  if (e.key === 'Backspace' && !code[i] && i > 0)
                    document.getElementById(`td-otp-${txn.id}-${i-1}`)?.focus();
                }}
              />
            ))}
          </div>

          <div className="td-otp-actions">
            <div className="td-otp-pips">
              {Array.from({ length: MAX }).map((_, i) => (
                <div key={i} className={`td-pip ${i < attempts ? 'used' : ''}`} />
              ))}
              <span className="text-muted" style={{ fontSize: 12 }}>
                {MAX - attempts} attempt{MAX - attempts !== 1 ? 's' : ''} left
              </span>
            </div>
            <button
              className="btn btn-primary td-otp-btn"
              onClick={handleVerify}
              disabled={code.length !== 5 || phase === 'verifying' || isLocked}
            >
              {phase === 'verifying' ? 'Verifying…' : 'Confirm Delivery'}
              {phase !== 'verifying' && <ChevronRight size={16} />}
            </button>
          </div>

          {phase === 'error' && (
            <div className="td-feedback error">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}
          {isLocked && attempts >= MAX && (
            <div className="td-feedback error">
              <Lock size={14} /> Maximum attempts reached. Contact support.
            </div>
          )}
        </>
      ) : (
        <div className="td-feedback success large">
          <CheckCircle2 size={20} />
          <div>
            <div style={{ fontWeight: 700 }}>Delivery Confirmed!</div>
            <div style={{ fontSize: 13 }}>The transaction has been marked as Delivered and locked.</div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Page ── */
const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, formatPrice, acceptRequest, rejectRequest } = useAppContext();

  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  const fetchTxn = async () => {
    const { data } = await supabase
      .from('transactions')
      .select(`
        *,
        item:item_id(*, owner:owner_id(id, name, avatar, university, is_verified, rating)),
        borrower:borrower_id(id, name, avatar, university, is_verified, rating, phone_number)
      `)
      .eq('id', id)
      .single();
    if (data) setTxn(data);
    setLoading(false);
  };

  useEffect(() => { 
    fetchTxn(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="container mt-8 text-center td-loading">Loading transaction…</div>;
  if (!txn) return <div className="container mt-8 text-center">Transaction not found.</div>;

  const isLender   = txn.item?.owner_id === currentUser?.id;
  const isBorrower = txn.borrower_id === currentUser?.id;
  const daysDiff   = Math.ceil((new Date(txn.end_date) - new Date()) / 86_400_000);

  const handleAccept = async () => {
    setActioning('accept');
    await acceptRequest(txn.id);
    await fetchTxn();
    setActioning(null);
  };
  const handleReject = async () => {
    if (!confirm('Are you sure you want to decline this request?')) return;
    setActioning('reject');
    await rejectRequest(txn.id);
    await fetchTxn();
    setActioning(null);
  };

  const statusColors = {
    Requested: '#f59e0b',
    Accepted:  '#3b82f6',
    Delivered: '#22c55e',
    Returned:  '#6b7280',
    Rejected:  '#ef4444',
    Disputed:  '#ef4444',
  };

  return (
    <div className="container page-container animate-fade-in" style={{ maxWidth: 720 }}>
      {/* Back nav */}
      <button className="td-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Status banner */}
      <div className="td-status-banner" style={{ borderColor: statusColors[txn.status] || '#6b7280' }}>
        <div className="td-status-label">
          <span className="td-status-dot" style={{ background: statusColors[txn.status] }} />
          {txn.status}
        </div>
        <div className="td-status-id">#{txn.id.slice(0, 8).toUpperCase()}</div>
      </div>

      {/* Lifecycle */}
      <div className="td-card">
        <h3 className="td-section-title"><Clock size={15} /> Rental Lifecycle</h3>
        <LifecycleBar status={txn.status} />
      </div>

      {/* Item info */}
      <div className="td-card">
        <h3 className="td-section-title"><Package size={15} /> Item Being Requested</h3>
        <div className="td-item-row">
          {txn.item?.images?.[0] ? (
            <img src={txn.item.images[0]} alt={txn.item.title} className="td-item-thumb" />
          ) : (
            <div className="td-item-thumb-empty"><Package size={22} /></div>
          )}
          <div>
            <div className="td-item-title">{txn.item?.title}</div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              {txn.item?.category} • {txn.item?.condition} • Size {txn.item?.size}
            </div>
          </div>
        </div>
      </div>

      {/* Borrower info */}
      {(isLender || isBorrower) && txn.borrower && (
        <div className="td-card">
          <h3 className="td-section-title"><User size={15} /> Borrower</h3>
          <div className="td-person-row">
            {txn.borrower.avatar ? (
              <img src={txn.borrower.avatar} alt={txn.borrower.name} className="td-avatar" />
            ) : (
              <div className="td-avatar td-avatar-fallback">
                {(txn.borrower.name || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="td-person-info">
              <div className="td-person-name">
                {txn.borrower.name}
                {txn.borrower.is_verified && (
                  <span className="td-verified"><ShieldCheck size={13} /> Verified</span>
                )}
              </div>
              {txn.borrower.university && (
                <div className="td-person-meta"><MapPin size={12} /> {txn.borrower.university}</div>
              )}
              {txn.borrower.rating && (
                <div className="td-person-meta"><Star size={12} /> {txn.borrower.rating} rating</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment & Timeline */}
      <div className="td-card">
        <h3 className="td-section-title"><Calendar size={15} /> Rental Timeline & Payment</h3>
        <div className="td-info-grid">
          <div className="td-info-item">
            <div className="td-info-label">Request Date</div>
            <div className="td-info-value">{new Date(txn.created_at).toLocaleDateString([], { dateStyle: 'medium' })}</div>
          </div>
          <div className="td-info-item">
            <div className="td-info-label">Start Date</div>
            <div className="td-info-value">{txn.start_date}</div>
          </div>
          <div className="td-info-item">
            <div className="td-info-label">Due Date</div>
            <div className="td-info-value" style={{ color: daysDiff <= 1 && daysDiff >= 0 ? '#f59e0b' : daysDiff < 0 ? '#ef4444' : 'inherit' }}>
              {txn.end_date}
              {daysDiff <= 1 && !['Returned', 'Rejected'].includes(txn.status) && (
                <span style={{ fontSize: 11, marginLeft: 6 }}>
                  {daysDiff === 0 ? '(Today!)' : daysDiff < 0 ? '(Overdue!)' : `(${daysDiff}d left)`}
                </span>
              )}
            </div>
          </div>
          <div className="td-info-item">
            <div className="td-info-label">Total Amount</div>
            <div className="td-info-value primary">{formatPrice(txn.total_price, txn.item?.currency)}</div>
          </div>
          <div className="td-info-item">
            <div className="td-info-label">Refundable Deposit</div>
            <div className="td-info-value">{formatPrice(txn.item?.deposit || 0, txn.item?.currency)}</div>
          </div>
          <div className="td-info-item">
            <div className="td-info-label">Payment Status</div>
            <div className="td-info-value">
              <span className="badge badge-warning">Pending — Direct Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Borrower OTP display */}
      {isBorrower && ['Requested', 'Accepted'].includes(txn.status) && (
        <div className="td-card td-borrower-otp">
          <h3 className="td-section-title"><Key size={15} /> Your Handover Code</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
            Show this code to the lender when they hand over the item. They will enter it to confirm delivery.
          </p>
          <div className="td-otp-display-big">
            {(txn.otp_code || '-----').split('').map((d, i) => (
              <span key={i} className="td-otp-digit">{d}</span>
            ))}
          </div>
        </div>
      )}

      {/* Lender OTP verifier */}
      {isLender && (
        <div className="td-card">
          <OTPVerifier txn={txn} onSuccess={() => fetchTxn()} />
        </div>
      )}

      {/* Lender Accept/Reject actions */}
      {isLender && txn.status === 'Requested' && (
        <div className="td-card td-actions">
          <h3 className="td-section-title">Actions</h3>
          <div className="td-action-btns">
            <button
              className="btn btn-primary td-action-btn"
              disabled={actioning === 'accept'}
              onClick={handleAccept}
            >
              <CheckCircle2 size={16} />
              {actioning === 'accept' ? 'Accepting…' : 'Accept Request'}
            </button>
            <button
              className="btn btn-outline td-action-btn"
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
              disabled={actioning === 'reject'}
              onClick={handleReject}
            >
              <XCircle size={16} />
              {actioning === 'reject' ? 'Declining…' : 'Decline Request'}
            </button>
          </div>
        </div>
      )}

      {/* Delivered lock notice */}
      {txn.status === 'Delivered' && (
        <div className="td-card td-locked-notice">
          <Lock size={16} />
          <div>
            <div style={{ fontWeight: 600 }}>Transaction Locked</div>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
              Verified on {txn.otp_verified_at ? new Date(txn.otp_verified_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetail;
