import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Check, X, AlertTriangle } from 'lucide-react';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [uRes, iRes, tRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('items').select('*, owner:owner_id(name)').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*, item:item_id(title), borrower:borrower_id(name)').order('created_at', { ascending: false })
    ]);
    
    if (uRes.data) setUsers(uRes.data);
    if (iRes.data) setItems(iRes.data);
    if (tRes.data) setTransactions(tRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const verifyUser = async (id, isVerified) => {
    await supabase.from('users').update({ is_verified: isVerified }).eq('id', id);
    fetchData();
  };

  const updateItemStatus = async (id, status) => {
    await supabase.from('items').update({ status }).eq('id', id);
    fetchData();
  };

  const updateTxnStatus = async (id, status) => {
    await supabase.from('transactions').update({ status }).eq('id', id);
    fetchData();
  };

  if (loading) return <div className="container mt-8 text-center">Loading admin dashboard...</div>;

  return (
    <div className="container page-container animate-fade-in">
      <h1 className="mb-6 flex items-center gap-2"><AlertTriangle /> Admin Dashboard</h1>
      
      <div className="grid mb-8" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* USERS */}
        <div className="card" style={{ height: 'auto' }}>
          <h2 className="mb-4">Users ({users.length})</h2>
          <div className="flex flex-col gap-2">
            {users.map(u => (
              <div key={u.id} className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <img src={u.avatar} alt="avatar" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                  {u.name} {u.is_verified && <ShieldCheck size={14} className="text-primary" />}
                </div>
                {!u.is_verified ? (
                  <button className="badge badge-success" style={{ cursor: 'pointer', border: 'none' }} onClick={() => verifyUser(u.id, true)}>Verify</button>
                ) : (
                  <button className="badge" style={{ cursor: 'pointer', border: 'none', background: '#e2e8f0' }} onClick={() => verifyUser(u.id, false)}>Unverify</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ITEMS */}
        <div className="card" style={{ height: 'auto' }}>
          <h2 className="mb-4">Items ({items.length})</h2>
          <div className="flex flex-col gap-2">
            {items.map(i => (
              <div key={i.id} className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{i.title}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>by {i.owner?.name}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`badge ${i.status === 'Available' ? 'badge-success' : 'badge-warning'}`}>{i.status}</span>
                  <select 
                    className="form-input" 
                    style={{ padding: '4px 8px', fontSize: 12 }} 
                    value={i.status} 
                    onChange={(e) => updateItemStatus(i.id, e.target.value)}
                  >
                    <option value="Available">Available</option>
                    <option value="Hidden">Hidden</option>
                    <option value="Rented">Rented</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="card" style={{ height: 'auto' }}>
        <h2 className="mb-4">Transactions ({transactions.length})</h2>
        <div className="flex flex-col gap-2">
          {transactions.map(t => (
            <div key={t.id} className="flex justify-between items-center" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{t.item?.title}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>Borrower: {t.borrower?.name} | {t.start_date} to {t.end_date} | ${t.total_price}</div>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="form-input" 
                  style={{ padding: '4px 8px', fontSize: 13 }}
                  value={t.status}
                  onChange={(e) => updateTxnStatus(t.id, e.target.value)}
                >
                  <option value="Requested">Requested</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Returned">Returned</option>
                  <option value="Disputed">Disputed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
