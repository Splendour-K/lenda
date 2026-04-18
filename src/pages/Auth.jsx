import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Shirt } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!avatarFile) {
          alert('Please select a profile image.');
          setLoading(false);
          return;
        }
        await signUp(email, password, name, university, avatarFile);
      }
      navigate('/');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center" style={{ minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="flex flex-col items-center mb-6">
          <div style={{ width: 48, height: 48, background: 'var(--primary)', color: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Shirt size={24} />
          </div>
          <h2>{isLogin ? 'Welcome back' : 'Create an account'}</h2>
          <p className="text-muted text-center mt-2">
            {isLogin ? 'Enter your details to login.' : 'Join the campus marketplace today.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">University</label>
                <input
                  type="text"
                  className="form-input"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Ashesi University"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Profile Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {avatarFile && (
                    <img 
                      src={URL.createObjectURL(avatarFile)} 
                      alt="Preview" 
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '50%' }} 
                    />
                  )}
                  <label className="btn btn-outline" style={{ cursor: 'pointer', flex: 1, textAlign: 'center' }}>
                    {avatarFile ? 'Change Image' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => setAvatarFile(e.target.files[0])}
                      required={!avatarFile}
                    />
                  </label>
                </div>
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full mt-4" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center text-muted" style={{ fontSize: 14 }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
