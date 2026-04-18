import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Ruler, ShieldCheck, User } from 'lucide-react';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, requestToBorrow } = useAppContext();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState('');
  
  useEffect(() => {
    const fetchItem = async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*, owner:owner_id(name, avatar, is_verified, rating)')
        .eq('id', id)
        .single();
      
      if (data) setItem(data);
      setLoading(false);
    };
    fetchItem();
  }, [id]);

  const handleRequest = async () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    if (!dates) return alert('Please enter rental dates');
    // Calculate total price: basic 2 day price for now
    const success = await requestToBorrow(item.id, dates.split(' to ')[0], dates.split(' to ')[1] || dates, item.price);
    if (success) navigate('/profile');
  };

  if (loading) return <div className="container mt-8 text-center">Loading...</div>;
  if (!item) return <div className="container mt-8 text-center">Item not found.</div>;

  return (
    <div className="container page-container animate-fade-in">
      <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
        {/* Left: Images */}
        <div style={{ flex: '1 1 500px' }}>
          <img 
            src={item.images[0] || 'https://via.placeholder.com/600x800'} 
            alt={item.title}
            style={{ width: '100%', borderRadius: 'var(--radius-lg)', objectFit: 'cover', aspectRatio: '3/4' }}
          />
        </div>

        {/* Right: Details */}
        <div style={{ flex: '1 1 400px', padding: '20px 0' }}>
          <div className="badge badge-warning mb-2">{item.category}</div>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>{item.title}</h1>
          <div className="text-muted mb-6">{item.condition}</div>

          <div className="card mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={item.owner.avatar} alt="Owner" className="avatar" style={{ width: 48, height: 48 }} />
              <div>
                <div style={{ fontWeight: 600 }}>{item.owner.name}</div>
                <div className="text-muted flex items-center gap-2" style={{ fontSize: 13 }}>
                  {item.owner.is_verified && <span className="flex items-center gap-2 text-primary"><ShieldCheck size={14} /> Verified Student</span>}
                  <span>★ {item.owner.rating || 'New'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-2">Details</h3>
            <div className="flex flex-col gap-2 text-muted">
              <div className="flex items-center gap-2"><Ruler size={16} /> Size: <span style={{ color: 'var(--foreground)'}}>{item.size}</span></div>
              <div className="flex items-center gap-2"><User size={16} /> Fits: <span style={{ color: 'var(--foreground)'}}>{item.fit_description || 'N/A'}</span></div>
            </div>
          </div>

          <div className="card" style={{ border: '2px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-4">
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                ${item.price} <span className="text-muted" style={{ fontSize: 14, fontWeight: 400 }}>/ 2 days</span>
              </div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                Refundable deposit: ${item.deposit}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Rental Dates</label>
              <input 
                type="text" 
                placeholder="e.g. Oct 15 to Oct 17" 
                className="form-input"
                value={dates}
                onChange={(e) => setDates(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-full mt-4" onClick={handleRequest} style={{ padding: '14px' }}>
              Request to Borrow
            </button>
            <p className="text-center text-muted mt-4" style={{ fontSize: 12 }}>
              You won't be charged yet. Payment is handled directly between students.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
