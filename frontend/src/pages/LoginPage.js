import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'primeicons/primeicons.css';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      toast.success(`Welcome back, ${user.username}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <i className="pi pi-book" style={{ fontSize: '2rem', color: 'white' }} />
          </div>
          <h1 className="auth-title">Library Catalog</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <i className="pi pi-exclamation-circle" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <i className="pi pi-user" style={{ marginRight: '.4rem', color: '#64748b' }} />
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <i className="pi pi-user" style={{
                position: 'absolute', left: '.85rem', top: '50%',
                transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '.9rem'
              }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <i className="pi pi-lock" style={{ marginRight: '.4rem', color: '#64748b' }} />
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
              />
              <i className="pi pi-lock" style={{
                position: 'absolute', left: '.85rem', top: '50%',
                transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '.9rem'
              }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: '.85rem', top: '50%',
                transform: 'translateY(-50%)', background: 'none', border: 'none',
                cursor: 'pointer', color: '#94a3b8', fontSize: '.9rem', padding: 0
              }}>
                <i className={`pi pi-${showPass ? 'eye-slash' : 'eye'}`} />
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '.5rem', gap: '.5rem' }}
            type="submit"
            disabled={loading}
          >
            {loading
              ? <><i className="pi pi-spin pi-spinner" /> Signing in...</>
              : <><i className="pi pi-sign-in" /> Sign In</>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.875rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            <i className="pi pi-user-plus" style={{ marginRight: '.3rem' }} />
            Register here
          </Link>
        </p>

        {/* Demo credentials */}
        <div style={{
          marginTop: '1rem', padding: '1rem', background: '#f8fafc',
          borderRadius: 10, fontSize: '.8rem', color: '#64748b',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.5rem', fontWeight: 600, color: '#475569' }}>
            <i className="pi pi-info-circle" />
            Demo Credentials
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div>
              <i className="pi pi-shield" style={{ color: '#7c3aed', marginRight: '.3rem' }} />
              <strong>Admin:</strong> admin / admin123
            </div>
            <div>
              <i className="pi pi-user" style={{ color: '#2563eb', marginRight: '.3rem' }} />
              <strong>User:</strong> user / user123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
