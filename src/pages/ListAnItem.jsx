import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../utils/constants';
import { supabase } from '../lib/supabase';

const ListAnItem = () => {
  const { addItem, currentUser, currency } = useAppContext();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0].subcategories[0],
    size: '',
    fit_description: '',
    condition: 'New',
    price: '',
    extra_day_price: '',
    deposit: '',
  });
  const [imageFiles, setImageFiles] = useState([]);
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

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (imageFiles.length + newFiles.length > 5) {
      alert('You can only upload a maximum of 5 images.');
      return;
    }
    setImageFiles([...imageFiles, ...newFiles]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imageFiles.length === 0) {
      alert('Please upload at least one image.');
      return;
    }
    setLoading(true);

    const imageUrls = [];
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, file);

      if (uploadError) {
        alert('Error uploading image: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage.from('item-images').getPublicUrl(filePath);
      imageUrls.push(data.publicUrl);
    }

    const itemData = {
      ...formData,
      price: Number(formData.price),
      extra_day_price: Number(formData.extra_day_price),
      deposit: Number(formData.deposit),
      images: imageUrls,
      currency: currency
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
                {CATEGORIES.map(group => (
                  <optgroup key={group.name} label={group.name}>
                    {group.subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </optgroup>
                ))}
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
              <label className="form-label">Price / 2 Days ({currency})</label>
              <input type="number" required min="1" name="price" className="form-input" placeholder="25" value={formData.price} onChange={handleChange} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Extra Day Price ({currency})</label>
              <input type="number" required min="1" name="extra_day_price" className="form-input" placeholder="10" value={formData.extra_day_price} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Refundable Deposit ({currency})</label>
            <input type="number" required min="0" name="deposit" className="form-input" placeholder="50" value={formData.deposit} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Images (up to 5)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
              {imageFiles.map((file, idx) => (
                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                  <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                  <button 
                    type="button"
                    onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== idx))}
                    style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                  >✕</button>
                </div>
              ))}
              {imageFiles.length < 5 && (
                <label style={{ width: '80px', height: '80px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: '24px' }}>
                  +
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
              )}
            </div>
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
