import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBooks, searchBooks } from '../services/api';
import 'primeicons/primeicons.css';

const genreEmoji = {
  'Fantasy': '', 'Science Fiction': '', 'Classic Fiction': '',
  'Romance': '', 'Technology': '', 'Dystopian Fiction': '',
  'Literary Fiction': '', 'Philosophical Fiction': '',
};
const genreGradient = {
  'Fantasy':            'linear-gradient(135deg,#f093fb,#f5576c)',
  'Science Fiction':    'linear-gradient(135deg,#4facfe,#00f2fe)',
  'Classic Fiction':    'linear-gradient(135deg,#43e97b,#38f9d7)',
  'Romance':            'linear-gradient(135deg,#fa709a,#fee140)',
  'Technology':         'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'Dystopian Fiction':  'linear-gradient(135deg,#30cfd0,#330867)',
  'Literary Fiction':   'linear-gradient(135deg,#667eea,#764ba2)',
  'Philosophical Fiction': 'linear-gradient(135deg,#f7971e,#ffd200)',
};

function StarRating({ rating }) {
  if (!rating) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem', marginTop: '.35rem' }}>
      {[1,2,3,4,5].map(i => (
        <i key={i}
          className={`pi pi-star${i <= Math.round(rating) ? '-fill' : ''}`}
          style={{ fontSize: '.65rem', color: i <= Math.round(rating) ? '#f59e0b' : '#d1d5db' }}
        />
      ))}
      <span style={{ fontSize: '.72rem', color: '#64748b', marginLeft: '.2rem' }}>
        {rating}
      </span>
    </div>
  );
}

function BookCard({ book, onClick }) {
  return (
    <div className="book-card" onClick={() => onClick(book.id)}
      style={{ cursor: 'pointer', transition: 'transform .18s, box-shadow .18s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Cover */}
      <div style={{
        height: 190,
        background: genreGradient[book.genre] || 'linear-gradient(135deg,#667eea,#764ba2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3.2rem', position: 'relative'
      }}>
        {genreEmoji[book.genre] || ''}
        {/* Availability badge */}
        <span style={{
          position: 'absolute', top: 8, right: 8,
          background: book.availableCopies > 0 ? '#dcfce7' : '#fee2e2',
          color: book.availableCopies > 0 ? '#166534' : '#991b1b',
          fontSize: '.65rem', fontWeight: 700, padding: '.15rem .45rem',
          borderRadius: 100, display: 'flex', alignItems: 'center', gap: '.25rem'
        }}>
          <i className={`pi pi-${book.availableCopies > 0 ? 'check-circle' : 'times-circle'}`}
            style={{ fontSize: '.65rem' }} />
          {book.availableCopies > 0 ? `${book.availableCopies} avail.` : 'Out of stock'}
        </span>
      </div>

      {/* Info */}
      <div className="book-info">
        <div className="book-title" style={{ fontSize: '.875rem', lineHeight: 1.3, marginBottom: '.2rem' }}>
          {book.title}
        </div>
        <div className="book-author" style={{ fontSize: '.78rem' }}>
          <i className="pi pi-user" style={{ fontSize: '.7rem', marginRight: '.25rem', color: '#94a3b8' }} />
          {book.author}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.5rem' }}>
          {book.genre && (
            <span className="book-genre" style={{ fontSize: '.68rem' }}>
              {book.genre}
            </span>
          )}
          <span style={{ fontSize: '.72rem', color: '#2563eb', fontWeight: 600 }}>₹7</span>
        </div>
        <StarRating rating={book.averageRating} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => { loadBooks(); }, [page, search]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = search
        ? await searchBooks(search, page)
        : await getBooks(page);
      setBooks(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setSearch(keyword);
  };

  const clearSearch = () => {
    setSearch(''); setKeyword(''); setPage(0);
  };

  const pageNumbers = () => {
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  };

  return (
    <div className="container page-content">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              <i className="pi pi-book" style={{ color: '#2563eb', marginRight: '.5rem' }} />
              Library Catalog
            </h1>
            {!loading && (
              <p style={{ color: '#64748b', fontSize: '.85rem', marginTop: '.25rem' }}>
                {search
                  ? `${totalElements} result(s) for "${search}"`
                  : `${totalElements} books available`}
              </p>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{
            display: 'flex', gap: '.5rem', alignItems: 'center',
            background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 100,
            padding: '.35rem .35rem .35rem 1rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)',
            flex: '1 1 320px', maxWidth: 520
          }}>
            <i className="pi pi-search" style={{ color: '#94a3b8', fontSize: '.9rem', flexShrink: 0 }} />
            <input
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '.9rem', background: 'transparent' }}
              placeholder="Search by title, author, ISBN, genre…"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            {keyword && (
              <button type="button" onClick={clearSearch} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0 .25rem'
              }}>
                <i className="pi pi-times" style={{ fontSize: '.8rem' }} />
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-sm" style={{ borderRadius: 100, gap: '.35rem' }}>
              <i className="pi pi-search" style={{ fontSize: '.8rem' }} />
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading-center" style={{ minHeight: 300 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#64748b' }}>Loading catalog…</p>
          </div>
        </div>
      ) : books.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <i className="pi pi-search" style={{ fontSize: '3.5rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }} />
          <h3 style={{ color: '#334155', marginBottom: '.5rem' }}>No books found</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Try a different search term</p>
          {search && (
            <button className="btn btn-outline" onClick={clearSearch}>
              <i className="pi pi-times" style={{ marginRight: '.4rem' }} />
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="books-grid">
          {books.map(book => (
            <BookCard key={book.id} book={book} onClick={id => navigate(`/books/${id}`)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(0)} disabled={page === 0} title="First page">
            <i className="pi pi-angle-double-left" />
          </button>
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0} title="Previous">
            <i className="pi pi-angle-left" />
          </button>
          {pageNumbers().map(n => (
            <button key={n} className={page === n ? 'active' : ''} onClick={() => setPage(n)}>
              {n + 1}
            </button>
          ))}
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} title="Next">
            <i className="pi pi-angle-right" />
          </button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} title="Last page">
            <i className="pi pi-angle-double-right" />
          </button>
        </div>
      )}
    </div>
  );
}
