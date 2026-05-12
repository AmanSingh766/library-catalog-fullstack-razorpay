import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'primeicons/primeicons.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', email: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'fullName',  icon: 'id-card',   label: 'Full Name',  type: 'text',     placeholder: 'John Doe' },
    { key: 'username',  icon: 'user',       label: 'Username',   type: 'text',     placeholder: 'johndoe' },
    { key: 'email',     icon: 'envelope',   label: 'Email',      type: 'email',    placeholder: 'john@example.com' },
  ];

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <i className="pi pi-user-plus" style={{ fontSize: '2rem', color: 'white' }} />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the library catalog today</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <i className="pi pi-exclamation-circle" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {fields.map(field => (
            <div className="form-group" key={field.key}>
              <label className="form-label">
                <i className={`pi pi-${field.icon}`} style={{ marginRight: '.4rem', color: '#64748b' }} />
                {field.label}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <i className={`pi pi-${field.icon}`} style={{
                  position: 'absolute', left: '.85rem', top: '50%',
                  transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '.9rem'
                }} />
              </div>
            </div>
          ))}

          {/* Password */}
          <div className="form-group">
            <label className="form-label">
              <i className="pi pi-lock" style={{ marginRight: '.4rem', color: '#64748b' }} />
              Password <span style={{ color: '#94a3b8', fontSize: '.8rem' }}>(min 6 chars)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
              />
              <i className="pi pi-lock" style={{
                position: 'absolute', left: '.85rem', top: '50%',
                transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '.9rem'
              }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: '.85rem', top: '50%',
                transform: 'translateY(-50%)', background: 'none', border: 'none',
                cursor: 'pointer', color: '#94a3b8', padding: 0
              }}>
                <i className={`pi pi-${showPass ? 'eye-slash' : 'eye'}`} />
              </button>
            </div>
            {/* Password strength bar */}
            {form.password && (
              <div style={{ marginTop: '.4rem' }}>
                <div style={{ height: 4, background: '#e2e8f0', borderRadius: 4 }}>
                  <div style={{
                    height: '100%', borderRadius: 4, transition: 'width .3s',
                    width: form.password.length >= 10 ? '100%' : form.password.length >= 6 ? '60%' : '30%',
                    background: form.password.length >= 10 ? '#16a34a' : form.password.length >= 6 ? '#d97706' : '#dc2626',
                  }} />
                </div>
                <span style={{
                  fontSize: '.72rem', color:
                    form.password.length >= 10 ? '#16a34a' : form.password.length >= 6 ? '#d97706' : '#dc2626'
                }}>
                  {form.password.length >= 10 ? 'Strong' : form.password.length >= 6 ? 'Medium' : 'Weak'}
                </span>
              </div>
            )}
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '.5rem', gap: '.5rem' }}
            type="submit"
            disabled={loading}
          >
            {loading
              ? <><i className="pi pi-spin pi-spinner" /> Creating account...</>
              : <><i className="pi pi-check" /> Create Account</>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            <i className="pi pi-sign-in" style={{ marginRight: '.3rem' }} />
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
