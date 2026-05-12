import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMyBorrows, getMyHistory, returnBook } from '../services/api';
import 'primeicons/primeicons.css';

const statusConfig = {
  BORROWED:  { bg: '#dbeafe', color: '#1d4ed8', icon: 'book',         label: 'Borrowed' },
  RETURNED:  { bg: '#dcfce7', color: '#166534', icon: 'check-circle', label: 'Returned' },
  RESERVED:  { bg: '#f3e8ff', color: '#7c3aed', icon: 'bookmark',     label: 'Reserved' },
  OVERDUE:   { bg: '#fee2e2', color: '#991b1b', icon: 'exclamation-triangle', label: 'Overdue' },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.BORROWED;
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, padding: '.2rem .65rem',
      borderRadius: 100, fontSize: '.78rem', fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: '.3rem'
    }}>
      <i className={`pi pi-${cfg.icon}`} style={{ fontSize: '.75rem' }} />
      {cfg.label}
    </span>
  );
}

function DaysLeft({ dueDate }) {
  const today = new Date();
  const due = new Date(dueDate);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) {
    return <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '.8rem' }}>
      <i className="pi pi-exclamation-triangle" style={{ marginRight: '.3rem' }} />
      {Math.abs(diff)} day(s) overdue
    </span>;
  }
  if (diff <= 2) {
    return <span style={{ color: '#d97706', fontWeight: 600, fontSize: '.8rem' }}>
      <i className="pi pi-clock" style={{ marginRight: '.3rem' }} />
      Due in {diff} day(s)!
    </span>;
  }
  return <span style={{ color: '#16a34a', fontSize: '.8rem' }}>
    <i className="pi pi-calendar" style={{ marginRight: '.3rem' }} />
    Due: {dueDate}
  </span>;
}

export default function MyAccountPage() {
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [borrows, hist] = await Promise.all([getMyBorrows(), getMyHistory()]);
      setActiveBorrows(borrows.data);
      setHistory(hist.data);
    } finally { setLoading(false); }
  };

  const handleReturn = async (recordId) => {
    setReturning(recordId);
    try {
      await returnBook(recordId);
      toast.success('Book returned successfully!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return');
    } finally { setReturning(null); }
  };

  if (loading) return (
    <div className="loading-center" style={{ minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="container page-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <i className="pi pi-book" style={{ fontSize: '1.6rem', color: '#2563eb' }} />
          <h1 className="page-title" style={{ margin: 0 }}>My Borrows</h1>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))' }}>
        {[
          { icon: 'book',         color: '#2563eb', bg: '#dbeafe', label: 'Active',   val: activeBorrows.length },
          { icon: 'check-circle', color: '#16a34a', bg: '#dcfce7', label: 'Returned', val: history.filter(h => h.status === 'RETURNED').length },
          { icon: 'bookmark',     color: '#7c3aed', bg: '#f3e8ff', label: 'Reserved', val: history.filter(h => h.status === 'RESERVED').length },
          { icon: 'list',         color: '#475569', bg: '#f1f5f9', label: 'Total',    val: history.length },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <i className={`pi pi-${s.icon}`} style={{ color: s.color, fontSize: '1.1rem' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '.78rem', color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab buttons */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'active',  icon: 'book',  label: `Active Borrows (${activeBorrows.length})` },
          { key: 'history', icon: 'list',  label: `History (${history.length})` },
        ].map(t => (
          <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab(t.key)} style={{ gap: '.4rem' }}>
            <i className={`pi pi-${t.icon}`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Active borrows */}
      {tab === 'active' && (
        activeBorrows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <i className="pi pi-inbox" style={{ fontSize: '4rem', color: '#e2e8f0', marginBottom: '1rem', display: 'block' }} />
            <h3 style={{ marginBottom: '.5rem' }}>No active borrows</h3>
            <p>Browse the catalog to find and borrow books</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeBorrows.map(record => (
              <div key={record.id} className="card">
                <div className="card-body" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{
                    width: 52, height: 68, borderRadius: 8, flexShrink: 0,
                    background: 'linear-gradient(135deg,#667eea,#764ba2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem'
                  }}>📚</div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '.2rem' }}>{record.bookTitle}</h3>
                    <p style={{ color: '#64748b', fontSize: '.82rem', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                      <i className="pi pi-user" style={{ fontSize: '.75rem' }} />{record.bookAuthor}
                    </p>
                    <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <StatusBadge status={record.status} />
                      <DaysLeft dueDate={record.dueDate} />
                    </div>
                    <div style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: '.3rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                      <i className="pi pi-calendar-plus" style={{ fontSize: '.72rem' }} />
                      Borrowed: {record.borrowDate}
                    </div>
                  </div>
                  <button className="btn btn-success" style={{ gap: '.4rem' }}
                    onClick={() => handleReturn(record.id)}
                    disabled={returning === record.id}>
                    {returning === record.id
                      ? <><i className="pi pi-spin pi-spinner" />Returning…</>
                      : <><i className="pi pi-undo" />Return Book</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* History tab */}
      {tab === 'history' && (
        history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <i className="pi pi-list" style={{ fontSize: '3rem', color: '#e2e8f0', marginBottom: '1rem', display: 'block' }} />
            <p>No borrowing history yet</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th><i className="pi pi-book" style={{ marginRight: '.4rem' }} />Book</th>
                    <th><i className="pi pi-user" style={{ marginRight: '.4rem' }} />Author</th>
                    <th><i className="pi pi-calendar-plus" style={{ marginRight: '.4rem' }} />Borrowed</th>
                    <th><i className="pi pi-calendar" style={{ marginRight: '.4rem' }} />Due</th>
                    <th><i className="pi pi-calendar-minus" style={{ marginRight: '.4rem' }} />Returned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.bookTitle}</strong></td>
                      <td style={{ color: '#64748b', fontSize: '.875rem' }}>{r.bookAuthor}</td>
                      <td style={{ fontSize: '.875rem' }}>{r.borrowDate}</td>
                      <td style={{ fontSize: '.875rem' }}>{r.dueDate}</td>
                      <td style={{ fontSize: '.875rem' }}>{r.returnDate || '—'}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
