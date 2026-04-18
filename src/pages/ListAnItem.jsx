import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const ListAnItem = () => {
  const { addItem, currentUser } = useAppContext();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Suit',
    size: '',
    fit_description: '',
    condition: 'New',
    price: '',
    extra_day_price: '',
    deposit: '',
    images: 'https://storage.googleapis.com/banani-generated-images/generated-images/df09e697-1fcf-4642-b55d-5225a559ebe7.jpg'
  });
  const [loading, setLoading] = useState(false);

  if (!currentUser) {
    return (
      <div className="container mt-8 text-center">
        <h2>Please login to list an item.</h2>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/auth')}>Login</button>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const itemData = {
      ...formData,
      price: Number(formData.price),
      extra_day_price: Number(formData.extra_day_price),
      deposit: Number(formData.deposit),
      images: [formData.images]
    };
    
    const success = await addItem(itemData);
    setLoading(false);
    if (success) {
      alert('Item listed successfully!');
      navigate('/');
    }
  };

  return (
    <div className="container page-container animate-fade-in" style={{ maxWidth: 600 }}>
      <h1 className="mb-6">List an Item</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input name="title" required className="form-input" placeholder="e.g. Black Slim Fit Suit" value={formData.title} onChange={handleChange} />
          </div>

          <div className="flex gap-4 mb-4">
            <div style={{ flex: 1 }}>
              <label className="form-label">Category</label>
              <select name="category" className="form-input" value={formData.category} onChange={handleChange}>
                <option value="Suit">Suit</option>
                <option value="Shoes">Shoes</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Size</label>
              <input name="size" required className="form-input" placeholder="e.g. 38R" value={formData.size} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Fit Description / Guidance</label>
            <input name="fit_description" className="form-input" placeholder="e.g. Fits 5'9'' - 5'11'', slim build" value={formData.fit_description} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Condition</label>
            <select name="condition" className="form-input" value={formData.condition} onChange={handleChange}>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Slightly Used">Slightly Used</option>
            </select>
          </div>

          <div className="flex gap-4 mb-4">
            <div style={{ flex: 1 }}>
              <label className="form-label">Price / 2 Days ($)</label>
              <input type="number" required min="1" name="price" className="form-input" placeholder="25" value={formData.price} onChange={handleChange} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Extra Day Price ($)</label>
              <input type="number" required min="1" name="extra_day_price" className="form-input" placeholder="10" value={formData.extra_day_price} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Refundable Deposit ($)</label>
            <input type="number" required min="0" name="deposit" className="form-input" placeholder="50" value={formData.deposit} onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-primary btn-full mt-6" disabled={loading}>
            {loading ? 'Listing Item...' : 'List Item'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ListAnItem;
