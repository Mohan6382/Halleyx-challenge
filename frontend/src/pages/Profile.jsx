import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000/api';

// Simple avatar initials generator
const getInitials = (name = '') =>
  name ? name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) : '?';

const getAvatarColor = (name = '') => {
  const colors = [
    ['#6366f1', '#4f46e5'], ['#10b981', '#059669'], ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626'], ['#8b5cf6', '#7c3aed'], ['#06b6d4', '#0891b2'],
    ['#ec4899', '#db2777'],
  ];
  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx] || colors[0];
};

const InputField = ({ label, id, type = 'text', value, onChange, placeholder, hint, icon, readOnly, error }) => (
  <div className="profile-field">
    <label htmlFor={id} className="profile-label">{label}</label>
    <div className="profile-input-wrapper">
      {icon && <span className="profile-input-icon">{icon}</span>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`profile-input ${icon ? 'has-icon' : ''} ${error ? 'error' : ''} ${readOnly ? 'readonly' : ''}`}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
      />
    </div>
    {hint && <p className="profile-hint">{hint}</p>}
    {error && <p className="profile-error">{error}</p>}
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'security'

  const [profile, setProfile] = useState({ name: '', email: '', avatar: '', createdAt: '' });
  const [form, setForm] = useState({ name: '', email: '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const deleteConfirmRef = useRef(null);

  const getToken = () => localStorage.getItem('token') || '';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data.success) {
        const p = res.data.data;
        setProfile(p);
        setForm({ name: p.name, email: p.email });
      }
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateInfo = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePassword = () => {
    const e = {};
    if (!passForm.currentPassword) e.currentPassword = 'Current password is required';
    if (!passForm.newPassword) e.newPassword = 'New password is required';
    else if (passForm.newPassword.length < 6) e.newPassword = 'At least 6 characters required';
    if (passForm.newPassword !== passForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveInfo = async () => {
    if (!validateInfo()) return;
    setSaving(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/profile`, {
        name: form.name,
        email: form.email,
      }, { headers: { Authorization: `Bearer ${getToken()}` } });

      if (res.data.success) {
        const updated = res.data.data;
        setProfile(prev => ({ ...prev, ...updated }));
        // Sync to localStorage
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, ...updated }));
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      const msg = err.response?.data?.error;
      toast.error(typeof msg === 'string' ? msg : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    setSaving(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/profile`, {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      }, { headers: { Authorization: `Bearer ${getToken()}` } });

      if (res.data.success) {
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Password changed successfully!');
      }
    } catch (err) {
      const msg = err.response?.data?.error;
      if (typeof msg === 'string' && msg.includes('incorrect')) {
        setErrors(prev => ({ ...prev, currentPassword: msg }));
      } else {
        toast.error(typeof msg === 'string' ? msg : 'Failed to change password');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Account deleted');
      navigate('/login');
    } catch (err) {
      toast.error('Failed to delete account');
      setDeleting(false);
    }
  };

  const [gradStart, gradEnd] = getAvatarColor(profile.name);
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  const isGoogleUser = !!profile.avatar;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        <p className="text-slate-400 text-sm animate-pulse">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* Top hero stripe */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        height: 180,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dot grid */}
        <div style={{ position:'absolute', inset:0, opacity:0.12,
          backgroundImage:'radial-gradient(#a5b4fc 1px,transparent 1px)',
          backgroundSize:'20px 20px' }} />
        {/* Glow */}
        <div style={{ position:'absolute', top:-60, left:'30%', width:320, height:320,
          background:'radial-gradient(circle,rgba(99,102,241,0.3) 0%,transparent 70%)',
          borderRadius:'50%' }} />
      </div>

      <div className="max-w-3xl mx-auto px-4" style={{ marginTop: -90, position: 'relative', zIndex: 1 }}>

        {/* Avatar Card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '28px 32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 22, marginBottom: 20,
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name}
                style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: `linear-gradient(135deg, ${gradStart} 0%, ${gradEnd} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, color: '#fff',
                border: '3px solid #fff', boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                letterSpacing: '-1px',
              }}>
                {getInitials(profile.name)}
              </div>
            )}
            {/* Online indicator */}
            <div style={{ position:'absolute', bottom:4, right:4, width:14, height:14,
              borderRadius:'50%', background:'#10b981', border:'2px solid #fff' }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.name}
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{profile.email}</p>
            <div style={{ display:'flex', gap: 10, flexWrap:'wrap' }}>
              <span style={{ background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', borderRadius:999, fontSize:11, fontWeight:700, padding:'3px 10px', letterSpacing:'0.04em', textTransform:'uppercase' }}>
                Active
              </span>
              {isGoogleUser && (
                <span style={{ background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:999, fontSize:11, fontWeight:700, padding:'3px 10px', letterSpacing:'0.04em', textTransform:'uppercase' }}>
                  Google Account
                </span>
              )}
              <span style={{ background:'#faf5ff', color:'#7c3aed', border:'1px solid #e9d5ff', borderRadius:999, fontSize:11, fontWeight:600, padding:'3px 10px' }}>
                Member since {memberSince}
              </span>
            </div>
          </div>

          {/* Back button */}
          <button onClick={() => navigate(-1)}
            style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'8px 16px', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.borderColor='#cbd5e1'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#e2e8f0'; }}
          >
            <svg style={{width:15,height:15}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, background:'#fff', borderRadius:14, padding:5, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', border:'1px solid #e2e8f0', marginBottom:20 }}>
          {[
            { key:'info', label:'Profile Info', icon:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { key:'security', label:'Security', icon:'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setErrors({}); }}
              style={{
                flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'10px 16px', borderRadius:10, border:'none', cursor:'pointer',
                fontSize:13, fontWeight:700, transition:'all 0.2s',
                background: activeTab === tab.key ? '#6366f1' : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#64748b',
                boxShadow: activeTab === tab.key ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
              }}>
              <svg style={{width:15,height:15}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: PROFILE INFO ── */}
        {activeTab === 'info' && (
          <div style={{ background:'#fff', borderRadius:20, padding:32, boxShadow:'0 4px 24px rgba(0,0,0,0.06)', border:'1px solid #e2e8f0', marginBottom:20 }}>
            <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Personal Information</h3>
            <p style={{ fontSize:13, color:'#94a3b8', marginBottom:28 }}>Update your display name and email address.</p>

            <div style={{ display:'grid', gap:20 }}>
              <InputField
                label="Full Name"
                id="name"
                value={form.name}
                onChange={e => { setForm(f => ({...f, name:e.target.value})); setErrors(er => ({...er, name:undefined})); }}
                placeholder="Your full name"
                error={errors.name}
                icon={
                  <svg style={{width:16,height:16}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <InputField
                label="Email Address"
                id="email"
                type="email"
                value={form.email}
                onChange={e => { setForm(f => ({...f, email:e.target.value})); setErrors(er => ({...er, email:undefined})); }}
                placeholder="your@email.com"
                error={errors.email}
                icon={
                  <svg style={{width:16,height:16}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>

            <div style={{ marginTop:28, display:'flex', justifyContent:'flex-end', gap:12 }}>
              <button
                onClick={() => { setForm({ name:profile.name, email:profile.email }); setErrors({}); }}
                style={{ padding:'10px 20px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer' }}
              >
                Reset
              </button>
              <button
                onClick={handleSaveInfo} disabled={saving}
                style={{
                  padding:'10px 26px', borderRadius:10, border:'none',
                  background: saving ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)',
                  color:'#fff', fontSize:13, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow:'0 4px 12px rgba(99,102,241,0.3)', display:'flex', alignItems:'center', gap:8,
                  transition:'all 0.2s',
                }}
              >
                {saving && (
                  <svg style={{width:14,height:14,animation:'spin 1s linear infinite'}} fill="none" viewBox="0 0 24 24">
                    <circle style={{opacity:0.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{opacity:0.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: SECURITY ── */}
        {activeTab === 'security' && (
          <>
            <div style={{ background:'#fff', borderRadius:20, padding:32, boxShadow:'0 4px 24px rgba(0,0,0,0.06)', border:'1px solid #e2e8f0', marginBottom:20 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Change Password</h3>
              <p style={{ fontSize:13, color:'#94a3b8', marginBottom:28 }}>
                {isGoogleUser ? 'Password changes are not available for Google-linked accounts.' : 'Choose a strong password of at least 6 characters.'}
              </p>

              {isGoogleUser ? (
                <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
                  <svg style={{width:18,height:18,color:'#3b82f6',flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p style={{ fontSize:13, color:'#1e40af', margin:0 }}>Your account is linked with Google. Password login is not available.</p>
                </div>
              ) : (
                <div style={{ display:'grid', gap:18 }}>
                  <InputField
                    label="Current Password"
                    id="currentPassword"
                    type="password"
                    value={passForm.currentPassword}
                    onChange={e => { setPassForm(f => ({...f, currentPassword:e.target.value})); setErrors(er => ({...er, currentPassword:undefined})); }}
                    placeholder="Enter current password"
                    error={errors.currentPassword}
                    icon={<svg style={{width:16,height:16}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>}
                  />
                  <InputField
                    label="New Password"
                    id="newPassword"
                    type="password"
                    value={passForm.newPassword}
                    onChange={e => { setPassForm(f => ({...f, newPassword:e.target.value})); setErrors(er => ({...er, newPassword:undefined})); }}
                    placeholder="Minimum 6 characters"
                    hint="Use a mix of letters, numbers, and symbols"
                    error={errors.newPassword}
                    icon={<svg style={{width:16,height:16}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>}
                  />
                  <InputField
                    label="Confirm New Password"
                    id="confirmPassword"
                    type="password"
                    value={passForm.confirmPassword}
                    onChange={e => { setPassForm(f => ({...f, confirmPassword:e.target.value})); setErrors(er => ({...er, confirmPassword:undefined})); }}
                    placeholder="Repeat new password"
                    error={errors.confirmPassword}
                    icon={<svg style={{width:16,height:16}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                  />
                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <button
                      onClick={handleChangePassword} disabled={saving}
                      style={{
                        padding:'10px 26px', borderRadius:10, border:'none',
                        background: saving ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)',
                        color:'#fff', fontSize:13, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer',
                        boxShadow:'0 4px 12px rgba(99,102,241,0.3)', display:'flex', alignItems:'center', gap:8,
                      }}
                    >
                      {saving && (
                        <svg style={{width:14,height:14,animation:'spin 1s linear infinite'}} fill="none" viewBox="0 0 24 24">
                          <circle style={{opacity:0.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path style={{opacity:0.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      )}
                      Update Password
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div style={{ background:'#fff', borderRadius:20, padding:28, boxShadow:'0 4px 24px rgba(0,0,0,0.06)', border:'1.5px solid #fee2e2', marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
                <div>
                  <h3 style={{ fontSize:15, fontWeight:800, color:'#ef4444', marginBottom:4 }}>Danger Zone</h3>
                  <p style={{ fontSize:13, color:'#94a3b8', margin:0 }}>
                    Permanently delete your account. This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{ padding:'10px 20px', borderRadius:10, border:'1.5px solid #ef4444', background:'#fff', color:'#ef4444', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s', whiteSpace:'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color='#ef4444'; }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      {showDeleteModal && (
        <div
          onClick={() => setShowDeleteModal(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:420, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg style={{width:28,height:28,color:'#ef4444'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
            </div>
            <h3 style={{ fontSize:18, fontWeight:800, color:'#0f172a', textAlign:'center', marginBottom:8 }}>Delete Account?</h3>
            <p style={{ fontSize:14, color:'#64748b', textAlign:'center', lineHeight:1.6, marginBottom:24 }}>
              This will permanently delete your account, all your dashboard configurations, and cannot be reversed.
            </p>
            <div style={{ display:'flex', gap:12 }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:13, fontWeight:700, cursor:'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount} disabled={deleting}
                style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background: deleting ? '#fca5a5' : '#ef4444', color:'#fff', fontSize:13, fontWeight:700, cursor: deleting ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
              >
                {deleting && (
                  <svg style={{width:14,height:14,animation:'spin 1s linear infinite'}} fill="none" viewBox="0 0 24 24">
                    <circle style={{opacity:0.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{opacity:0.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                )}
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .profile-field { display:flex; flex-direction:column; gap:6px; }
        .profile-label { font-size:13px; font-weight:700; color:#374151; letter-spacing:0.01em; }
        .profile-input-wrapper { position:relative; }
        .profile-input-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#9ca3af; pointer-events:none; display:flex; }
        .profile-input { width:100%; padding:11px 14px; border:1.5px solid #e2e8f0; border-radius:10px; font-size:14px; color:#0f172a; background:#fff; outline:none; transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box; }
        .profile-input.has-icon { padding-left:40px; }
        .profile-input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,0.12); }
        .profile-input.error { border-color:#ef4444; }
        .profile-input.error:focus { box-shadow:0 0 0 3px rgba(239,68,68,0.12); }
        .profile-input.readonly { background:#f8fafc; color:#94a3b8; cursor:default; }
        .profile-hint { font-size:12px; color:#94a3b8; margin:0; }
        .profile-error { font-size:12px; color:#ef4444; margin:0; font-weight:500; }
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
      `}</style>
    </div>
  );
};

export default Profile;
