import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Edit3, X, Save } from 'lucide-react';

const Profile = () => {
  const { currentUser, userProfile, transactions, signOut, updateProfile } = useAppContext();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone_number: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!currentUser) {
    return (
      <div className="container mt-8 text-center">
        <h2>Please login to view your profile.</h2>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/auth')}>Login</button>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditData({ 
        name: userProfile?.name || '', 
        phone_number: userProfile?.phone_number || '' 
      });
      setAvatarFile(null);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const success = await updateProfile({
      name: editData.name,
      phone_number: editData.phone_number
    }, avatarFile);
    
    setLoading(false);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="container page-container animate-fade-in">
      <div className="card mb-8">
        {isEditing ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h2>Edit Profile</h2>
              <button className="btn btn-outline" onClick={handleEditToggle} disabled={loading}>
                <X size={16} /> Cancel
              </button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Profile Image</label>
              <input type="file" accept="image/*" className="form-input" onChange={e => setAvatarFile(e.target.files[0])} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" value={editData.phone_number} onChange={e => setEditData({...editData, phone_number: e.target.value})} placeholder="e.g. +233..." />
            </div>
            
            <button className="btn btn-primary mt-2" onClick={handleSaveProfile} disabled={loading}>
              <Save size={16} className="mr-2" /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-6">
              <img 
                src={userProfile?.avatar || 'https://storage.googleapis.com/banani-avatars/avatar%2Fmale%2F18-25%2FEuropean%2F1'} 
                alt="Profile" 
                className="avatar" 
                style={{ width: 80, height: 80 }} 
              />
              <div>
                <h1 className="mb-2">{userProfile?.name || currentUser.email}</h1>
                <div className="text-muted flex gap-4">
                  {userProfile?.is_verified && <span className="flex items-center gap-1 text-primary"><ShieldCheck size={16} /> Verified Student</span>}
                  <span>★ {userProfile?.rating || 'New'}</span>
                </div>
                {userProfile?.phone_number && <div className="text-muted mt-1 text-sm">{userProfile.phone_number}</div>}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={handleEditToggle}>
                <Edit3 size={16} className="mr-2" /> Edit
              </button>
              <button className="btn btn-outline" onClick={handleSignOut}>
                <LogOut size={16} className="mr-2" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <h2 className="mb-4">Your Requests & Orders</h2>
      <div className="card">
        {transactions.length === 0 ? (
          <p className="text-muted">You have no active requests or orders.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {transactions.map(txn => (
              <div key={txn.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <div className="flex justify-between items-center mb-2">
                  <div style={{ fontWeight: 600 }}>{txn.item?.title || 'Item'}</div>
                  <div className={`badge ${txn.status === 'Requested' ? 'badge-warning' : 'badge-success'}`}>
                    {txn.status}
                  </div>
                </div>
                <div className="text-muted" style={{ fontSize: 14 }}>
                  Dates: {txn.start_date} to {txn.end_date} <br/>
                  Total: ${txn.total_price}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
