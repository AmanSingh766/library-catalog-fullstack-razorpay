import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getBook, borrowBook, reserveBook, addToCart,
  getBookReviews, addReview,
  getBookComments, addComment, editComment, deleteComment
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import 'primeicons/primeicons.css';

const genreGradient = {
  'Fantasy':            'linear-gradient(135deg,#f093fb,#f5576c)',
  'Science Fiction':    'linear-gradient(135deg,#4facfe,#00f2fe)',
  'Classic Fiction':    'linear-gradient(135deg,#43e97b,#38f9d7)',
  'Romance':            'linear-gradient(135deg,#fa709a,#fee140)',
  'Technology':         'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'Dystopian Fiction':  'linear-gradient(135deg,#30cfd0,#330867)',
};

function StarRating({ rating, interactive = false, onRate }) {
  return (
    <div style={{ display: 'flex', gap: '.2rem' }}>
      {[1,2,3,4,5].map(i => (
        <i key={i}
          className={`pi pi-star${i <= rating ? '-fill' : ''}`}
          style={{
            fontSize: interactive ? '1.5rem' : '1rem',
            color: i <= rating ? '#f59e0b' : '#d1d5db',
            cursor: interactive ? 'pointer' : 'default',
            transition: 'color .1s'
          }}
          onClick={() => interactive && onRate && onRate(i)}
        />
      ))}
    </div>
  );
}

function Avatar({ name, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#667eea,#764ba2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.38
    }}>
      {name?.[0]?.toUpperCase() || <i className="pi pi-user" style={{ fontSize: size * 0.4 }} />}
    </div>
  );
}

// ── Comment component with replies ──────────────────────────
function CommentItem({ comment, bookId, onReplyAdded, onDeleted, onEdited, currentUserId, isAdmin }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const res = await addComment(bookId, replyText, comment.id);
      onReplyAdded(comment.id, res.data);
      setReplyText(''); setShowReply(false);
      toast.success('Reply posted!');
    } catch { toast.error('Failed to post reply'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await editComment(comment.id, editText);
      onEdited(res.data); setEditing(false);
      toast.success('Comment updated!');
    } catch { toast.error('Failed to edit comment'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(comment.id);
      onDeleted(comment.id);
    } catch { toast.error('Failed to delete'); }
  };

  const canModify = currentUserId === comment.userId || isAdmin;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        background: '#f8fafc', borderRadius: 10, padding: '1rem',
        borderLeft: `3px solid ${comment.parentId ? '#2563eb' : '#e2e8f0'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <Avatar name={comment.username} size={32} />
            <div>
              <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{comment.username}</span>
              <div style={{ fontSize: '.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <i className="pi pi-clock" style={{ fontSize: '.68rem' }} />
                {new Date(comment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {comment.edited && <em style={{ marginLeft: '.3rem' }}>(edited)</em>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.4rem' }}>
            {currentUserId === comment.userId && !editing && (
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                <i className="pi pi-pencil" style={{ fontSize: '.75rem' }} />
              </button>
            )}
            {canModify && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                <i className="pi pi-trash" style={{ fontSize: '.75rem' }} />
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleEdit}>
            <textarea className="form-control" rows={2} value={editText}
              onChange={e => setEditText(e.target.value)} required />
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                <i className="pi pi-check" style={{ marginRight: '.3rem' }} />Save
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
                <i className="pi pi-times" style={{ marginRight: '.3rem' }} />Cancel
              </button>
            </div>
          </form>
        ) : (
          <p style={{ fontSize: '.88rem', color: '#334155', lineHeight: 1.65, margin: '.25rem 0 .6rem' }}>
            {comment.content}
          </p>
        )}

        {!editing && (
          <button onClick={() => setShowReply(!showReply)} style={{
            background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer',
            fontSize: '.8rem', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: '.3rem'
          }}>
            <i className="pi pi-reply" style={{ fontSize: '.8rem' }} />
            Reply
          </button>
        )}
      </div>

      {showReply && (
        <form onSubmit={handleReply} style={{ marginTop: '.5rem', marginLeft: '1.75rem' }}>
          <textarea className="form-control" rows={2} placeholder="Write a reply…"
            value={replyText} onChange={e => setReplyText(e.target.value)} required />
          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.4rem' }}>
            <button type="submit" className="btn btn-primary btn-sm">
              <i className="pi pi-send" style={{ marginRight: '.3rem' }} />Post Reply
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowReply(false)}>Cancel</button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginLeft: '1.75rem', marginTop: '.5rem' }}>
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} bookId={bookId}
              onReplyAdded={onReplyAdded} onDeleted={onDeleted} onEdited={onEdited}
              currentUserId={currentUserId} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('reviews');

  useEffect(() => {
    Promise.all([getBook(id), getBookReviews(id), getBookComments(id)])
      .then(([b, r, c]) => { setBook(b.data); setReviews(r.data); setComments(c.data); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleBorrow = async () => {
    setBorrowing(true);
    try {
      await borrowBook(id);
      toast.success('Book borrowed! Due in 14 days.');
      const b = await getBook(id); setBook(b.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to borrow'); }
    finally { setBorrowing(false); }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addToCart(id, 1);
      toast.success('Added to cart!');
      if (window.refreshCartCount) window.refreshCartCount();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add to cart'); }
    finally { setAddingToCart(false); }
  };

  const handleReserve = async () => {
    try { await reserveBook(id); toast.success('Book reserved!'); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.warn('Please select a rating'); return; }
    try {
      const res = await addReview(id, rating, reviewText);
      setReviews([res.data, ...reviews]);
      setRating(0); setReviewText('');
      toast.success('Review submitted!');
    } catch { toast.error('Failed to submit review'); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await addComment(id, newComment, null);
      setComments([res.data, ...comments]);
      setNewComment('');
      toast.success('Comment posted!');
    } catch { toast.error('Failed to post comment'); }
  };

  if (loading) return (
    <div className="loading-center" style={{ minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b' }}>Loading book details…</p>
      </div>
    </div>
  );

  if (!book) return (
    <div className="container page-content" style={{ textAlign: 'center', padding: '4rem' }}>
      <i className="pi pi-exclamation-triangle" style={{ fontSize: '3rem', color: '#dc2626', marginBottom: '1rem', display: 'block' }} />
      <h2>Book not found</h2>
    </div>
  );

  return (
    <div className="container page-content">
      <button className="btn btn-outline btn-sm" style={{ marginBottom: '1.5rem', gap: '.4rem' }}
        onClick={() => navigate(-1)}>
        <i className="pi pi-arrow-left" />
        Back to Catalog
      </button>

      {/* Book Info */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Cover */}
            <div style={{
              width: 180, height: 240, borderRadius: 14, flexShrink: 0,
              background: genreGradient[book.genre] || 'linear-gradient(135deg,#667eea,#764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '5rem', boxShadow: '0 8px 24px rgba(0,0,0,.15)'
            }}></div>

            <div style={{ flex: 1, minWidth: 240 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.85rem', flexWrap: 'wrap' }}>
                {book.genre && <span className="badge badge-blue">{book.genre}</span>}
                <span className={`badge ${book.availableCopies > 0 ? 'badge-green' : 'badge-red'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                  <i className={`pi pi-${book.availableCopies > 0 ? 'check-circle' : 'times-circle'}`} style={{ fontSize: '.75rem' }} />
                  {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Out of Stock'}
                </span>
              </div>

              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '.3rem', color: '#1e293b' }}>
                {book.title}
              </h1>
              <p style={{ color: '#64748b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <i className="pi pi-user" style={{ fontSize: '.85rem' }} />
                {book.author}
              </p>

              {book.averageRating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
                  <StarRating rating={Math.round(book.averageRating)} />
                  <span style={{ fontWeight: 700 }}>{book.averageRating}</span>
                  <span style={{ color: '#64748b', fontSize: '.85rem' }}>({book.reviewCount} reviews)</span>
                </div>
              )}

              {/* Book meta */}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '.4rem 1.25rem', fontSize: '.875rem', marginBottom: '1.5rem' }}>
                {book.isbn && (
                  <>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                      <i className="pi pi-barcode" style={{ fontSize: '.8rem' }} />ISBN
                    </span>
                    <span>{book.isbn}</span>
                  </>
                )}
                {book.publisher && (
                  <>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                      <i className="pi pi-building" style={{ fontSize: '.8rem' }} />Publisher
                    </span>
                    <span>{book.publisher}</span>
                  </>
                )}
                {book.publicationDate && (
                  <>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                      <i className="pi pi-calendar" style={{ fontSize: '.8rem' }} />Published
                    </span>
                    <span>{book.publicationDate}</span>
                  </>
                )}
                <>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <i className="pi pi-copy" style={{ fontSize: '.8rem' }} />Total Copies
                  </span>
                  <span>{book.totalCopies}</span>
                </>
                <>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <i className="pi pi-credit-card" style={{ fontSize: '.8rem' }} />Borrow Fee
                  </span>
                  <span style={{ color: '#2563eb', fontWeight: 700 }}>₹7 / 14 days</span>
                </>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-lg" onClick={handleBorrow}
                  disabled={borrowing || book.availableCopies === 0}
                  style={{ gap: '.5rem' }}>
                  {borrowing
                    ? <><i className="pi pi-spin pi-spinner" />Processing…</>
                    : <><i className="pi pi-book" />Borrow Book</>}
                </button>

                <button className="btn btn-secondary btn-lg" onClick={handleAddToCart}
                  disabled={addingToCart || book.availableCopies === 0}
                  style={{ gap: '.5rem' }}>
                  {addingToCart
                    ? <><i className="pi pi-spin pi-spinner" />Adding…</>
                    : <><i className="pi pi-shopping-cart" />Add to Cart</>}
                </button>

                {book.availableCopies === 0 && (
                  <button className="btn btn-outline btn-lg" onClick={handleReserve} style={{ gap: '.5rem' }}>
                    <i className="pi pi-bookmark" />Reserve
                  </button>
                )}
              </div>
            </div>
          </div>

          {book.description && (
            <div style={{ marginTop: '1.75rem', paddingTop: '1.75rem', borderTop: '1px solid #e2e8f0' }}>
              <h3 style={{ marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <i className="pi pi-align-left" style={{ color: '#2563eb' }} />
                About this Book
              </h3>
              <p style={{ color: '#475569', lineHeight: 1.8, fontSize: '.95rem' }}>{book.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
        {[
          { key: 'reviews', icon: 'star', label: `Reviews (${reviews.length})` },
          { key: 'comments', icon: 'comments', label: `Discussion (${comments.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '.75rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: activeTab === tab.key ? 700 : 500,
            color: activeTab === tab.key ? '#2563eb' : '#64748b',
            borderBottom: activeTab === tab.key ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-2px', fontSize: '.9rem',
            display: 'flex', alignItems: 'center', gap: '.4rem'
          }}>
            <i className={`pi pi-${tab.icon}`} style={{ fontSize: '.85rem' }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="card">
          <div className="card-body">
            {/* Write review */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1.25rem', marginBottom: '1.75rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <i className="pi pi-star" style={{ color: '#f59e0b' }} />
                Write a Review
              </h4>
              <form onSubmit={handleReview}>
                <div className="form-group">
                  <label className="form-label">Your Rating</label>
                  <StarRating rating={rating} interactive onRate={setRating} />
                  {rating > 0 && (
                    <span style={{ fontSize: '.8rem', color: '#64748b', marginTop: '.3rem', display: 'block' }}>
                      {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Your Review</label>
                  <textarea className="form-control" rows={3}
                    placeholder="Share your thoughts about this book…"
                    value={reviewText} onChange={e => setReviewText(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ gap: '.4rem' }}>
                  <i className="pi pi-send" />Submit Review
                </button>
              </form>
            </div>

            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                <i className="pi pi-star" style={{ fontSize: '2.5rem', color: '#e2e8f0', marginBottom: '.75rem', display: 'block' }} />
                No reviews yet. Be the first to review!
              </div>
            ) : reviews.map(r => (
              <div key={r.id} style={{ padding: '1rem 0', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem' }}>
                <Avatar name={r.username} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
                    <strong style={{ fontSize: '.9rem' }}>{r.username}</strong>
                    <StarRating rating={r.rating} />
                  </div>
                  <p style={{ color: '#475569', fontSize: '.88rem', lineHeight: 1.6 }}>{r.comment}</p>
                  <span style={{ color: '#94a3b8', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '.3rem', marginTop: '.4rem' }}>
                    <i className="pi pi-clock" style={{ fontSize: '.72rem' }} />
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="card">
          <div className="card-body">
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1.25rem', marginBottom: '1.75rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <i className="pi pi-comments" style={{ color: '#2563eb' }} />
                Join the Discussion
              </h4>
              <form onSubmit={handleAddComment}>
                <div className="form-group">
                  <textarea className="form-control" rows={3}
                    placeholder="Ask a question or share your thoughts about this book…"
                    value={newComment} onChange={e => setNewComment(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ gap: '.4rem' }}>
                  <i className="pi pi-send" />Post Comment
                </button>
              </form>
            </div>

            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                <i className="pi pi-comments" style={{ fontSize: '2.5rem', color: '#e2e8f0', marginBottom: '.75rem', display: 'block' }} />
                No comments yet. Start the discussion!
              </div>
            ) : comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} bookId={id}
                onReplyAdded={(parentId, reply) => setComments(prev => prev.map(c =>
                  c.id === parentId ? { ...c, replies: [...(c.replies || []), reply] } : c
                ))}
                onDeleted={cid => setComments(prev => prev.filter(c => c.id !== cid))}
                onEdited={updated => setComments(prev => prev.map(c => c.id === updated.id ? updated : c))}
                currentUserId={user?.id} isAdmin={isAdmin()} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
