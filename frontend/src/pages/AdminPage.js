import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminGetAllPayments } from '../services/api';
import 'primeicons/primeicons.css';
import {
  getBooks, adminGetAllUsers, adminCreateUser, adminUpdateUser, adminDeleteUser,
  adminCreateBook, adminUpdateBook, adminDeleteBook, adminGetAllBorrows, adminGetReports,
  adminGetAllOrders, adminUpdateOrderStatus,
} from '../services/api';

// Sidebar items
const sidebarItems = [
  { id: 'dashboard', icon: 'chart-bar',    label: 'Dashboard' },
  { id: 'books',     icon: 'book',         label: 'Catalog' },
  { id: 'users',     icon: 'users',        label: 'Users' },
  { id: 'borrows',   icon: 'list',         label: 'Borrows' },
  { id: 'inventory', icon: 'box',          label: 'Inventory' },
  { id: 'orders',    icon: 'shopping-bag', label: 'Orders' },
  { id: 'payments',  icon: 'credit-card',  label: 'Payments' },
];

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ===== Dashboard =====
function Dashboard({ reports }) {
  return (
    <div>
      <h2 style={{marginBottom:'1.5rem'}}>Dashboard</h2>
      <div className="stats-grid">
        {[
          ['Total Users', reports?.totalUsers, ''],
          ['Total Borrows', reports?.totalBorrows, ''],
          ['Active Borrows', reports?.activeBorrows, ''],
        ].map(([label, value, icon]) => (
          <div key={label} className="stat-card">
            <div style={{fontSize:'2rem', marginBottom:'.5rem'}}>{icon}</div>
            <div className="stat-value">{value ?? '...'}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Books =====
function BooksPanel() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { loadBooks(); }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await getBooks(0, 100);
      setBooks(res.data.content);
    } finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditBook(null);
    setForm({ title:'', author:'', genre:'', isbn:'', publisher:'', description:'', totalCopies:1, publicationDate:'' });
    setShowModal(true);
  };

  const openEdit = (book) => {
    setEditBook(book);
    setForm({ ...book, publicationDate: book.publicationDate || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editBook) {
        await adminUpdateBook(editBook.id, form);
        toast.success('Book updated!');
      } else {
        await adminCreateBook(form);
        toast.success('Book added!');
      }
      setShowModal(false);
      loadBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save book');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await adminDeleteBook(id);
      toast.success('Book deleted');
      loadBooks();
    } catch { toast.error('Failed to delete'); }
  };

  const f = (field, type='text') => ({
    type, value: form[field] || '', className: 'form-control',
    onChange: e => setForm({...form, [field]: e.target.value})
  });

  return (
    <div>
      <div className="page-header">
        <h2>Catalog Management</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Book</button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Author</th><th>Genre</th><th>ISBN</th><th>Available</th><th>Total</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {books.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.title}</strong></td>
                    <td>{b.author}</td>
                    <td><span className="badge badge-blue">{b.genre}</span></td>
                    <td style={{fontSize:'.8rem', color:'#64748b'}}>{b.isbn}</td>
                    <td>{b.availableCopies}</td>
                    <td>{b.totalCopies}</td>
                    <td style={{display:'flex', gap:'.5rem'}}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(b)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editBook ? 'Edit Book' : 'Add New Book'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input {...f('title')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Author *</label>
                <input {...f('author')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Genre</label>
                <input {...f('genre')} />
              </div>
              <div className="form-group">
                <label className="form-label">ISBN</label>
                <input {...f('isbn')} />
              </div>
              <div className="form-group">
                <label className="form-label">Publisher</label>
                <input {...f('publisher')} />
              </div>
              <div className="form-group">
                <label className="form-label">Publication Date</label>
                <input {...f('publicationDate', 'date')} />
              </div>
              <div className="form-group">
                <label className="form-label">Total Copies</label>
                <input type="number" min="1" className="form-control"
                  value={form.totalCopies || 1}
                  onChange={e => setForm({...form, totalCopies: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description || ''}
                onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div style={{display:'flex', gap:'.75rem', justifyContent:'flex-end'}}>
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Book</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ===== Users =====
function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminGetAllUsers();
      setUsers(res.data);
    } finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditUser(null);
    setForm({ username:'', password:'', email:'', fullName:'', role:'USER' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ email: user.email, fullName: user.fullName, role: user.role });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await adminUpdateUser(editUser.id, form);
        toast.success('User updated!');
      } else {
        await adminCreateUser(form);
        toast.success('User created!');
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete user?')) return;
    try {
      await adminDeleteUser(id);
      toast.success('User deleted');
      loadUsers();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
      </div>
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Username</th><th>Full Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-purple' : 'badge-blue'}`}>{u.role}</span></td>
                    <td style={{fontSize:'.8rem', color:'#64748b'}}>{u.createdAt?.split('T')[0]}</td>
                    <td style={{display:'flex', gap:'.5rem'}}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showModal && (
        <Modal title={editUser ? 'Edit User' : 'Add User'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave}>
            {!editUser && (
              <>
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input className="form-control" value={form.username || ''} required
                    onChange={e => setForm({...form, username: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-control" type="password" value={form.password || ''} required
                    onChange={e => setForm({...form, password: e.target.value})} />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={form.fullName || ''}
                onChange={e => setForm({...form, fullName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-control" type="email" value={form.email || ''} required
                onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role || 'USER'}
                onChange={e => setForm({...form, role: e.target.value})}>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div style={{display:'flex', gap:'.75rem', justifyContent:'flex-end'}}>
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ===== Borrows =====
function BorrowsPanel() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetAllBorrows().then(res => setBorrows(res.data)).finally(() => setLoading(false));
  }, []);

  const statusBadge = { 'BORROWED': 'badge-blue', 'RETURNED': 'badge-green', 'RESERVED': 'badge-purple', 'OVERDUE': 'badge-red' };

  return (
    <div>
      <div className="page-header"><h2>Borrow Records</h2></div>
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>User</th><th>Book</th><th>Borrowed</th><th>Due</th><th>Returned</th><th>Status</th></tr>
              </thead>
              <tbody>
                {borrows.map(r => (
                  <tr key={r.id}>
                    <td>{r.username}</td>
                    <td><strong>{r.bookTitle}</strong></td>
                    <td>{r.borrowDate}</td>
                    <td>{r.dueDate}</td>
                    <td>{r.returnDate || '—'}</td>
                    <td><span className={`badge ${statusBadge[r.status]}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Inventory =====
function InventoryPanel() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooks(0, 100).then(res => setBooks(res.data.content)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header"><h2>Inventory Management</h2></div>
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Author</th><th>Total</th><th>Available</th><th>Borrowed</th><th>Status</th></tr>
              </thead>
              <tbody>
                {books.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.title}</strong></td>
                    <td>{b.author}</td>
                    <td>{b.totalCopies}</td>
                    <td style={{color: b.availableCopies > 0 ? '#16a34a' : '#dc2626', fontWeight:600}}>
                      {b.availableCopies}
                    </td>
                    <td>{b.totalCopies - b.availableCopies}</td>
                    <td>
                      <span className={`badge ${b.availableCopies > 0 ? 'badge-green' : 'badge-red'}`}>
                        {b.availableCopies > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


// ===== Orders Panel =====
function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusOptions = ['PENDING','CONFIRMED','READY','COMPLETED','CANCELLED'];
  const statusBadge = {
    PENDING:'badge-yellow', CONFIRMED:'badge-blue', READY:'badge-purple',
    COMPLETED:'badge-green', CANCELLED:'badge-red'
  };

  useEffect(() => {
    adminGetAllOrders().then(res => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (orderId, status) => {
    try {
      const res = await adminUpdateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? res.data : o));
      toast.success('Order status updated!');
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div>
      <div className="page-header"><h2>Orders Management</h2></div>
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order #</th><th>User</th><th>Books</th><th>Total</th><th>Date</th><th>Status</th><th>Update</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>{o.username}</td>
                    <td style={{maxWidth:200}}>
                      {o.items && o.items.slice(0,2).map(i => (
                        <div key={i.id} style={{fontSize:'.8rem'}}>{i.bookTitle} ×{i.quantity}</div>
                      ))}
                      {o.items && o.items.length > 2 && <div style={{fontSize:'.75rem',color:'#64748b'}}>+{o.items.length-2} more</div>}
                    </td>
                    <td>{o.totalItems} copies</td>
                    <td style={{fontSize:'.8rem',color:'#64748b'}}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td><span className={`badge ${statusBadge[o.status]}`}>{o.status}</span></td>
                    <td>
                      <select className="form-control" style={{fontSize:'.8rem',padding:'.25rem .5rem'}}
                        value={o.status} onChange={e => handleStatusChange(o.id, e.target.value)}>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


// ===== Payments Panel =====
function PaymentsPanel() {
  const [payments, setPayments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const statusCfg = {
    CREATED:        { bg:'#fef9c3', color:'#854d0e', label:'Pending' },
    PAID:           { bg:'#dcfce7', color:'#166534', label:'Paid' },
    FAILED:         { bg:'#fee2e2', color:'#991b1b', label:'Failed' },
    REFUNDED:       { bg:'#e0e7ff', color:'#3730a3', label:'Refunded' },
    INVENTORY_FAIL: { bg:'#ffedd5', color:'#9a3412', label:'Out of Stock' },
  };

  React.useEffect(() => {
    adminGetAllPayments().then(res => setPayments(res.data)).finally(() => setLoading(false));
  }, []);

  const totalRevenue = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amountPaise, 0);
  const totalRefunded = payments.filter(p => p.status === 'REFUNDED' || p.status === 'INVENTORY_FAIL').reduce((s, p) => s + p.amountPaise, 0);

  return (
    <div>
      <div className="page-header"><h2 style={{display:'flex',alignItems:'center',gap:'.5rem'}}><i className="pi pi-credit-card" />Payments</h2></div>
      <div className="stats-grid" style={{marginBottom:'1.5rem'}}>
        {[
          ['Total Transactions', payments.length, 'pi-list'],
          ['Revenue Collected', `₹${(totalRevenue/100).toFixed(0)}`, 'pi-indian-rupee'],
          ['Refunds Issued', `₹${(totalRefunded/100).toFixed(0)}`, 'pi-replay'],
          ['Successful', payments.filter(p=>p.status==='PAID').length, 'pi-check-circle'],
        ].map(([label, value, icon]) => (
          <div key={label} className="stat-card">
            <div style={{fontSize:'1.5rem',marginBottom:'.5rem'}}><i className={`pi ${icon}`} style={{color:'#2563eb'}} /></div>
            <div className="stat-value" style={{fontSize:'1.5rem'}}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>User</th><th>Order</th><th>Amount</th><th>Razorpay Order ID</th><th>Payment ID</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const cfg = statusCfg[p.status] || statusCfg.CREATED;
                  return (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>-</td>
                      <td>#{p.libraryOrderId}</td>
                      <td style={{fontWeight:600}}>₹{(p.amountPaise/100).toFixed(2)}</td>
                      <td style={{fontFamily:'monospace',fontSize:'.75rem'}}>{p.razorpayOrderId}</td>
                      <td style={{fontFamily:'monospace',fontSize:'.75rem'}}>{p.razorpayPaymentId || '-'}</td>
                      <td>
                        <span style={{background:cfg.bg,color:cfg.color,padding:'.2rem .6rem',borderRadius:'100px',fontSize:'.75rem',fontWeight:600}}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{fontSize:'.8rem',color:'#64748b'}}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reports, setReports] = useState(null);

  useEffect(() => {
    adminGetReports().then(res => setReports(res.data));
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard reports={reports} />;
      case 'books': return <BooksPanel />;
      case 'users': return <UsersPanel />;
      case 'borrows': return <BorrowsPanel />;
      case 'inventory': return <InventoryPanel />;
      case 'orders': return <OrdersPanel />;
      case 'payments': return <PaymentsPanel />;
      default: return null;
    }
  };

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div style={{padding:'1rem 1.5rem', fontWeight:700, fontSize:'1rem', color:'white', marginBottom:'.5rem', borderBottom:'1px solid rgba(255,255,255,.1)', paddingBottom:'1rem'}}>
          🛡️ Admin Panel
        </div>
        {sidebarItems.map(item => (
          <div key={item.id}
            className={`admin-sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}>
            <i className={`pi pi-${item.icon}`} style={{fontSize:'1rem'}} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="admin-content">
        {renderContent()}
      </div>
    </div>
  );
}
