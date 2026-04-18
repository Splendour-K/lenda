import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Ruler, ShieldCheck, User } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, requestToBorrow, formatPrice } = useAppContext();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  
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
    if (!startDate || !endDate) return alert('Please select rental dates');
    
    // Format dates to YYYY-MM-DD
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    const success = await requestToBorrow(item.id, startStr, endStr, item.price);
    if (success) navigate('/profile');
  };

  if (loading) return <div className="container mt-8 text-center">Loading...</div>;
  if (!item) return <div className="container mt-8 text-center">Item not found.</div>;

  return (
    <div className="container page-container animate-fade-in">
      <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
        {/* Left: Images */}
        <div style={{ flex: '1 1 500px' }}>
          {item.images && item.images.length > 0 ? (
            <Carousel showThumbs={true} infiniteLoop useKeyboardArrows autoPlay>
              {item.images.map((img, idx) => (
                <div key={idx} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <img src={img} alt={`${item.title} ${idx+1}`} style={{ objectFit: 'cover', aspectRatio: '3/4' }} />
                </div>
              ))}
            </Carousel>
          ) : (
            <img src="https://via.placeholder.com/600x800" alt={item.title} style={{ width: '100%', borderRadius: 'var(--radius-lg)', objectFit: 'cover', aspectRatio: '3/4' }} />
          )}
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
                {formatPrice(item.price, item.currency)} <span className="text-muted" style={{ fontSize: 14, fontWeight: 400 }}>/ 2 days</span>
              </div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                Refundable deposit: {formatPrice(item.deposit, item.currency)}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Rental Dates</label>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                minDate={new Date()}
                placeholderText="Select rental dates"
                className="form-input"
                withPortal
                dateFormat="MMM d, yyyy"
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
