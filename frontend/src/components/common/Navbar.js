import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCartCount } from '../../services/api';
import 'primeicons/primeicons.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  const refreshCount = () => {
    if (user) getCartCount().then(res => setCartCount(res.data.count)).catch(() => {});
  };

  useEffect(() => { refreshCount(); }, [user]);
  useEffect(() => { window.refreshCartCount = refreshCount; }, [user]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <i className="pi pi-book" style={{ fontSize: '1.3rem' }} />
          LibraryCatalog
        </Link>
        <ul className="navbar-nav">
          <li>
            <NavLink to="/">
              <i className="pi pi-home" style={{ marginRight: '.35rem' }} />
              Catalog
            </NavLink>
          </li>
          <li>
            <NavLink to="/cart" style={{ position: 'relative' }}>
              <i className="pi pi-shopping-cart" style={{ marginRight: '.35rem' }} />
              Cart
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-8px',
                  background: '#ef4444', color: 'white', borderRadius: '50%',
                  width: 18, height: 18, fontSize: '.7rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{cartCount}</span>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/my-orders">
              <i className="pi pi-shopping-bag" style={{ marginRight: '.35rem' }} />
              Orders
            </NavLink>
          </li>
          <li>
            <NavLink to="/my-account">
              <i className="pi pi-book" style={{ marginRight: '.35rem' }} />
              Borrows
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile">
              <i className="pi pi-user" style={{ marginRight: '.35rem' }} />
              Profile
            </NavLink>
          </li>
          {isAdmin() && (
            <li>
              <NavLink to="/admin">
                <i className="pi pi-cog" style={{ marginRight: '.35rem' }} />
                Admin
              </NavLink>
            </li>
          )}
          <li>
            <button className="nav-btn" onClick={handleLogout}>
              <i className="pi pi-sign-out" style={{ marginRight: '.35rem' }} />
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
