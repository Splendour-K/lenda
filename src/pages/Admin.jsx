import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Package, BarChart3, Star, ShieldCheck, 
  Trash2, Ban, CheckCircle2, AlertCircle, Search, 
  ArrowUpRight, DollarSign, Filter, MoreVertical
} from 'lucide-react';
import './Admin.css';

const Admin = () => {
  const { 
    currentUser, userProfile, formatPrice,
    adminFetchAllUsers, adminUpdateUser, adminDeleteUser,
    adminFetchAllItems, adminUpdateItem,
    adminFetchAllTransactions
  } = useAppContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('insights');
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Security: Redirect non-admins after profile is loaded
  useEffect(() => {
    // Wait until userProfile is actually fetched (not null)
    if (userProfile !== null) {
      if (!userProfile.is_admin) {
        navigate('/');
      }
    }
  }, [userProfile, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, i, t] = await Promise.all([
        adminFetchAllUsers(),
        adminFetchAllItems(),
        adminFetchAllTransactions()
      ]);
      setUsers(u);
      setItems(i);
      setTransactions(t);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.is_admin) loadData();
  }, [userProfile]);

  if (!userProfile?.is_admin) return null;

  /* ─────────────────────────────────────────
     Actions
  ───────────────────────────────────────── */
  const handleSuspendUser = async (id, isCurrentlySuspended) => {
    if (!confirm(`${isCurrentlySuspended ? 'Unsuspend' : 'Suspend'} this user?`)) return;
    await adminUpdateUser(id, { is_suspended: !isCurrentlySuspended });
    loadData();
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('PERMANENTLY DELETE this user? This cannot be undone.')) return;
    await adminDeleteUser(id);
    loadData();
  };

  const handleApproveSponsor = async (itemId) => {
    await adminUpdateItem(itemId, { 
      is_sponsored: true, 
      sponsor_requested: false,
      sponsor_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });
    loadData();
  };

  const handleRemoveSponsor = async (itemId) => {
    await adminUpdateItem(itemId, { is_sponsored: false, sponsor_expires_at: null });
    loadData();
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Delete this listing?')) return;
    await adminUpdateItem(itemId, { status: 'Deleted' });
    loadData();
  };

  /* ─────────────────────────────────────────
     Sub-sections
  ───────────────────────────────────────── */

  const InsightsView = () => {
    const totalRevenue = transactions
      .filter(t => ['Delivered', 'Returned'].includes(t.status))
      .reduce((sum, t) => sum + Number(t.total_price || 0), 0);
    
    const platformFee = totalRevenue * 0.1; // 10% hypothetical fee

    return (
      <div className="admin-insights animate-fade-in">
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrapper blue">
              <Users size={20} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-label">Total Users</div>
              <div className="admin-stat-value">{users.length}</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrapper purple">
              <Package size={20} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-label">Listings</div>
              <div className="admin-stat-value">{items.length}</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrapper green">
              <DollarSign size={20} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-label">Gross Volume</div>
              <div className="admin-stat-value">{formatPrice(totalRevenue)}</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrapper orange">
              <BarChart3 size={20} />
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-label">Platform Revenue</div>
              <div className="admin-stat-value">{formatPrice(platformFee)}</div>
            </div>
          </div>
        </div>

        <div className="admin-main-grid">
          <div className="card">
            <h3>Recent Transactions</h3>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Borrower</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map(t => (
                    <tr key={t.id}>
                      <td>{t.item?.title}</td>
                      <td>{t.borrower?.name}</td>
                      <td>{formatPrice(t.total_price)}</td>
                      <td><span className={`badge badge-info`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const UsersView = () => {
    const filteredUsers = users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="admin-table-container animate-fade-in">
        <div className="admin-table-actions">
          <div className="search-wrapper">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>University</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} alt="" className="admin-avatar" />
                    <div>
                      <div className="font-600">{u.name}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="capitalize">{u.role}</span></td>
                <td>{u.university || '—'}</td>
                <td>
                  {u.is_suspended ? (
                    <span className="badge badge-danger">Suspended</span>
                  ) : (
                    <span className="badge badge-success">Active</span>
                  )}
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      className="admin-action-btn" 
                      title={u.is_suspended ? 'Unsuspend' : 'Suspend'}
                      onClick={() => handleSuspendUser(u.id, u.is_suspended)}
                    >
                      <Ban size={16} />
                    </button>
                    <button 
                      className="admin-action-btn delete" 
                      title="Delete User"
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const ListingsView = () => {
    const filteredItems = items.filter(i => 
      i.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="admin-table-container animate-fade-in">
        <div className="admin-table-actions">
          <div className="search-wrapper">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search listings..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Listing</th>
              <th>Lender</th>
              <th>Price</th>
              <th>Status</th>
              <th>Sponsored</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(i => (
              <tr key={i.id}>
                <td className="font-600">{i.title}</td>
                <td>{i.owner?.name}</td>
                <td>{formatPrice(i.price)}</td>
                <td><span className={`badge ${i.status === 'Available' ? 'badge-success' : 'badge-warning'}`}>{i.status}</span></td>
                <td>
                  {i.is_sponsored ? (
                    <span className="badge badge-info flex items-center gap-1"><Star size={10} /> Active</span>
                  ) : i.sponsor_requested ? (
                    <span className="badge badge-warning">Requested</span>
                  ) : 'No'}
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    {i.sponsor_requested && (
                      <button className="admin-action-btn success" title="Approve Sponsor" onClick={() => handleApproveSponsor(i.id)}>
                        <ShieldCheck size={16} />
                      </button>
                    )}
                    {i.is_sponsored && (
                      <button className="admin-action-btn" title="Remove Sponsor" onClick={() => handleRemoveSponsor(i.id)}>
                        <Star size={16} className="text-primary" />
                      </button>
                    )}
                    <button className="admin-action-btn delete" title="Delete Listing" onClick={() => handleDeleteItem(i.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const SponsorshipsView = () => {
    const requests = items.filter(i => i.sponsor_requested);

    return (
      <div className="admin-sponsorships animate-fade-in">
        <h3>Pending Requests ({requests.length})</h3>
        {requests.length === 0 ? (
          <div className="dash-empty-card">
            <Star size={32} className="text-muted mb-3" />
            <p>No pending sponsorship requests.</p>
          </div>
        ) : (
          <div className="admin-requests-list">
            {requests.map(i => (
              <div key={i.id} className="admin-request-card">
                <div className="request-info">
                  <div className="request-title">{i.title}</div>
                  <div className="request-meta">Lender: {i.owner?.name} | {formatPrice(i.price)}</div>
                </div>
                <div className="request-actions">
                  <button className="btn btn-primary" onClick={() => handleApproveSponsor(i.id)}>
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button className="btn btn-outline" onClick={() => adminUpdateItem(i.id, { sponsor_requested: false })}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 className="mt-8">Active Sponsored Listings</h3>
        <div className="admin-table-container mt-4">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Expires At</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.filter(i => i.is_sponsored).map(i => (
                <tr key={i.id}>
                  <td>{i.title}</td>
                  <td>{i.sponsor_expires_at ? new Date(i.sponsor_expires_at).toLocaleDateString() : 'Never'}</td>
                  <td className="text-right">
                    <button className="admin-action-btn" onClick={() => handleRemoveSponsor(i.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <ShieldCheck size={24} className="text-primary" />
          <span>Lenda Admin</span>
        </div>
        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
            <BarChart3 size={18} /> Insights
          </button>
          <button className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={18} /> Users
          </button>
          <button className={`admin-nav-item ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
            <Package size={18} /> Listings
          </button>
          <button className={`admin-nav-item ${activeTab === 'sponsorships' ? 'active' : ''}`} onClick={() => setActiveTab('sponsorships')}>
            <Star size={18} /> Sponsorships
          </button>
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={() => navigate('/dashboard')}>
            <ArrowUpRight size={18} /> Back to App
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">
            <h1 className="capitalize">{activeTab}</h1>
            <p className="text-muted">Manage your marketplace operations</p>
          </div>
          <div className="admin-header-actions">
            <button className="btn btn-outline" onClick={loadData}>
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'insights' && <InsightsView />}
          {activeTab === 'users' && <UsersView />}
          {activeTab === 'listings' && <ListingsView />}
          {activeTab === 'sponsorships' && <SponsorshipsView />}
        </div>
      </main>
    </div>
  );
};

export default Admin;
