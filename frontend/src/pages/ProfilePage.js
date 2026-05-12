import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCurrentUser, updateProfile, getMyPayments } from '../services/api';
import { useAuth } from '../context/AuthContext';
import 'primeicons/primeicons.css';

const paymentStatusCfg = {
  CREATED:        { color: '#d97706', bg: '#fef9c3', label: 'Pending' },
  PAID:           { color: '#16a34a', bg: '#dcfce7', label: 'Paid' },
  FAILED:         { color: '#dc2626', bg: '#fee2e2', label: 'Failed' },
  REFUNDED:       { color: '#7c3aed', bg: '#f3e8ff', label: 'Refunded' },
  INVENTORY_FAIL: { color: '#9a3412', bg: '#ffedd5', label: 'Out of Stock' },
};

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    Promise.all([getCurrentUser(), getMyPayments()])
      .then(([u, p]) => {
        setUser(u.data);
        setPayments(p.data);
        setForm({ fullName: u.data.fullName, email: u.data.email, password: '' });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile(form);
      setUser(res.data);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return (
    <div className="loading-center" style={{ minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amountPaise, 0);

  return (
    <div className="container page-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <i className="pi pi-user" style={{ fontSize: '1.6rem', color: '#2563eb' }} />
          <h1 className="page-title" style={{ margin: 0 }}>My Profile</h1>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
        {[
          { key: 'profile',  icon: 'user',        label: 'Profile' },
          { key: 'payments', icon: 'credit-card', label: `Payment History (${payments.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '.7rem 1.4rem', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: activeTab === t.key ? 700 : 500,
            color: activeTab === t.key ? '#2563eb' : '#64748b',
            borderBottom: activeTab === t.key ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-2px', fontSize: '.9rem',
            display: 'flex', alignItems: 'center', gap: '.4rem'
          }}>
            <i className={`pi pi-${t.icon}`} style={{ fontSize: '.85rem' }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: 560 }}>
          {/* User card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.2rem', color: 'white', fontWeight: 800
                }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 style={{ marginBottom: '.25rem', fontSize: '1.3rem' }}>{user?.fullName}</h2>
                  <p style={{ color: '#64748b', fontSize: '.875rem', display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.4rem' }}>
                    <i className="pi pi-at" />
                    {user?.username}
                  </p>
                  <span style={{
                    background: user?.role === 'ADMIN' ? '#f3e8ff' : '#dbeafe',
                    color: user?.role === 'ADMIN' ? '#7c3aed' : '#1d4ed8',
                    padding: '.15rem .65rem', borderRadius: 100, fontSize: '.78rem', fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: '.3rem'
                  }}>
                    <i className={`pi pi-${user?.role === 'ADMIN' ? 'shield' : 'user'}`} style={{ fontSize: '.75rem' }} />
                    {user?.role}
                  </span>
                </div>
              </div>

              {!editing ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', marginBottom: '1.5rem' }}>
                    {[
                      { icon: 'id-card',  label: 'Full Name',    val: user?.fullName },
                      { icon: 'envelope', label: 'Email',        val: user?.email },
                      { icon: 'calendar', label: 'Member Since', val: user?.createdAt?.split('T')[0] },
                    ].map(({ icon, label, val }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '.9rem' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <i className={`pi pi-${icon}`} style={{ color: '#64748b', fontSize: '.9rem' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
                          <div style={{ fontWeight: 500 }}>{val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary" style={{ gap: '.4rem' }} onClick={() => setEditing(true)}>
                    <i className="pi pi-pencil" />Edit Profile
                  </button>
                </>
              ) : (
                <form onSubmit={handleSave}>
                  <div className="form-group">
                    <label className="form-label">
                      <i className="pi pi-id-card" style={{ marginRight: '.4rem', color: '#64748b' }} />Full Name
                    </label>
                    <input className="form-control" value={form.fullName || ''}
                      onChange={e => setForm({ ...form, fullName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <i className="pi pi-envelope" style={{ marginRight: '.4rem', color: '#64748b' }} />Email
                    </label>
                    <input className="form-control" type="email" value={form.email || ''}
                      onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <i className="pi pi-lock" style={{ marginRight: '.4rem', color: '#64748b' }} />
                      New Password <span style={{ color: '#94a3b8', fontWeight: 400 }}>(leave blank to keep)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input className="form-control"
                        type={showPass ? 'text' : 'password'}
                        placeholder="New password"
                        value={form.password || ''}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} style={{
                        position: 'absolute', right: '.85rem', top: '50%',
                        transform: 'translateY(-50%)', background: 'none', border: 'none',
                        cursor: 'pointer', color: '#94a3b8', padding: 0
                      }}>
                        <i className={`pi pi-${showPass ? 'eye-slash' : 'eye'}`} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    <button type="submit" className="btn btn-success" style={{ gap: '.4rem' }} disabled={saving}>
                      {saving
                        ? <><i className="pi pi-spin pi-spinner" />Saving…</>
                        : <><i className="pi pi-check" />Save Changes</>}
                    </button>
                    <button type="button" className="btn btn-outline" style={{ gap: '.4rem' }}
                      onClick={() => setEditing(false)}>
                      <i className="pi pi-times" />Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Logout */}
          <button className="btn btn-danger" style={{ gap: '.5rem' }} onClick={handleLogout}>
            <i className="pi pi-sign-out" />Sign Out
          </button>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div>
          {/* Summary */}
          <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))' }}>
            {[
              { icon: 'list',         color: '#2563eb', bg: '#dbeafe', label: 'Total',      val: payments.length },
              { icon: 'check-circle', color: '#16a34a', bg: '#dcfce7', label: 'Paid',        val: payments.filter(p => p.status === 'PAID').length },
              { icon: 'indian-rupee', color: '#7c3aed', bg: '#f3e8ff', label: 'Total Spent', val: `₹${(totalPaid / 100).toFixed(0)}` },
              { icon: 'replay',       color: '#9a3412', bg: '#ffedd5', label: 'Refunded',    val: payments.filter(p => p.status === 'REFUNDED' || p.status === 'INVENTORY_FAIL').length },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: s.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <i className={`pi pi-${s.icon}`} style={{ color: s.color, fontSize: '1.1rem' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: '.75rem', color: '#64748b' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <i className="pi pi-credit-card" style={{ fontSize: '3.5rem', color: '#e2e8f0', marginBottom: '1rem', display: 'block' }} />
              <p>No payment history yet</p>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th><i className="pi pi-hashtag" style={{ marginRight: '.3rem' }} />ID</th>
                      <th><i className="pi pi-shopping-bag" style={{ marginRight: '.3rem' }} />Order</th>
                      <th><i className="pi pi-indian-rupee" style={{ marginRight: '.3rem' }} />Amount</th>
                      <th><i className="pi pi-credit-card" style={{ marginRight: '.3rem' }} />Payment ID</th>
                      <th>Status</th>
                      <th><i className="pi pi-calendar" style={{ marginRight: '.3rem' }} />Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => {
                      const cfg = paymentStatusCfg[p.status] || paymentStatusCfg.CREATED;
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.id}</td>
                          <td>#{p.libraryOrderId}</td>
                          <td style={{ fontWeight: 700, color: '#2563eb' }}>
                            ₹{(p.amountPaise / 100).toFixed(2)}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '.75rem', color: '#64748b' }}>
                            {p.razorpayPaymentId || '—'}
                          </td>
                          <td>
                            <span style={{
                              background: cfg.bg, color: cfg.color, padding: '.2rem .6rem',
                              borderRadius: 100, fontSize: '.75rem', fontWeight: 600
                            }}>
                              {cfg.label}
                            </span>
                          </td>
                          <td style={{ fontSize: '.8rem', color: '#64748b' }}>
                            {new Date(p.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
