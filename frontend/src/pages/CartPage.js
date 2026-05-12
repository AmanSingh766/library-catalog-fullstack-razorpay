import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getCart, updateCartItem, removeFromCart, clearCart,
  placeOrder, createRazorpayOrder, verifyPayment, paymentFailure
} from '../services/api';
import { useRazorpay } from '../hooks/useRazorpay';
import 'primeicons/primeicons.css';

// ── PrimeIcon helper ──────────────────────────────────────────
const Icon = ({ name, style }) => (
  <i className={`pi pi-${name}`} style={{ fontSize: '1rem', ...style }} />
);

// ── Status chip ───────────────────────────────────────────────
const PaymentStatusChip = ({ status }) => {
  const map = {
    CREATED:        { bg: '#fef9c3', color: '#854d0e', label: 'Pending Payment', icon: 'clock' },
    PAID:           { bg: '#dcfce7', color: '#166534', label: 'Paid',            icon: 'check-circle' },
    FAILED:         { bg: '#fee2e2', color: '#991b1b', label: 'Payment Failed',  icon: 'times-circle' },
    REFUNDED:       { bg: '#e0e7ff', color: '#3730a3', label: 'Refunded',        icon: 'replay' },
    INVENTORY_FAIL: { bg: '#ffedd5', color: '#9a3412', label: 'Out of Stock',    icon: 'exclamation-triangle' },
  };
  const cfg = map[status] || map.CREATED;
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '.25rem .75rem', borderRadius: '100px',
      fontSize: '.8rem', fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: '.35rem'
    }}>
      <Icon name={cfg.icon} style={{ fontSize: '.85rem' }} />
      {cfg.label}
    </span>
  );
};

// ── Cart item card ────────────────────────────────────────────
const CartItemCard = ({ item, onQuantity, onRemove }) => (
  <div className="card" style={{ marginBottom: '1rem' }}>
    <div className="card-body" style={{
      display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap'
    }}>
      <div style={{
        width: 56, height: 72, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg,#667eea,#764ba2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.6rem'
      }}></div>

      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.15rem' }}>
          {item.bookTitle}
        </div>
        <div style={{ color: '#64748b', fontSize: '.8rem', marginBottom: '.4rem' }}>
          {item.bookAuthor}
        </div>
        {item.bookGenre && (
          <span className="badge badge-blue" style={{ fontSize: '.7rem' }}>
            {item.bookGenre}
          </span>
        )}
        <div style={{
          marginTop: '.4rem', fontSize: '.78rem',
          color: item.availableCopies > 0 ? '#16a34a' : '#dc2626',
          display: 'flex', alignItems: 'center', gap: '.3rem'
        }}>
          <Icon
            name={item.availableCopies > 0 ? 'check-circle' : 'times-circle'}
            style={{ fontSize: '.8rem' }}
          />
          {item.availableCopies > 0
            ? `${item.availableCopies} copies available`
            : 'Currently unavailable'}
        </div>
      </div>

      {/* Borrowing fee */}
      <div style={{ textAlign: 'center', minWidth: 80 }}>
        <div style={{ fontSize: '.72rem', color: '#94a3b8', marginBottom: '.2rem' }}>
          Fee / copy
        </div>
        <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '1rem' }}>
          ₹7
        </div>
        <div style={{ fontSize: '.68rem', color: '#94a3b8' }}>14 days</div>
      </div>

      {/* Quantity stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <button
          onClick={() => onQuantity(item.id, item.quantity - 1)}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '1.5px solid #e2e8f0', background: '#f8fafc',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1rem', color: '#475569'
          }}>
          <Icon name="minus" style={{ fontSize: '.7rem' }} />
        </button>
        <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', fontSize: '1rem' }}>
          {item.quantity}
        </span>
        <button
          onClick={() => onQuantity(item.id, item.quantity + 1)}
          disabled={item.quantity >= item.availableCopies}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '1.5px solid #e2e8f0', background: '#f8fafc',
            cursor: item.quantity >= item.availableCopies ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1rem', color: '#475569',
            opacity: item.quantity >= item.availableCopies ? .4 : 1
          }}>
          <Icon name="plus" style={{ fontSize: '.7rem' }} />
        </button>
      </div>

      {/* Line total */}
      <div style={{ textAlign: 'right', minWidth: 60 }}>
        <div style={{ fontSize: '.72rem', color: '#94a3b8' }}>Total</div>
        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>
          ₹{item.quantity * 7}
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        style={{
          background: '#fee2e2', color: '#dc2626', border: 'none',
          width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
        <Icon name="trash" style={{ fontSize: '.9rem' }} />
      </button>
    </div>
  </div>
);

// ── Payment Result Modal ──────────────────────────────────────
const PaymentResultModal = ({ result, onClose }) => {
  if (!result) return null;
  const isSuccess = result.status === 'PAID';
  const isOutOfStock = result.status === 'INVENTORY_FAIL' || result.status === 'REFUNDED';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 300, padding: '1rem'
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '2.5rem',
        maxWidth: 440, width: '100%', textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,.2)'
      }}>
        {isSuccess ? (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              <Icon name="check-circle" style={{ fontSize: '4rem', color: '#16a34a' }} />
            </div>
            <h2 style={{ color: '#166534', marginBottom: '.5rem' }}>Payment Successful!</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Your payment of <strong>₹{(result.amountPaise / 100).toFixed(2)}</strong> was received.
              Inventory checked ✓ Books reserved ✓ Order completed!
            </p>
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 10, padding: '1rem', marginBottom: '1.5rem',
              textAlign: 'left', fontSize: '.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                <span style={{ color: '#64748b' }}>Payment ID</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '.78rem' }}>
                  {result.razorpayPaymentId}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Order ID</span>
                <span style={{ fontWeight: 600 }}>#{result.libraryOrderId}</span>
              </div>
            </div>
          </>
        ) : isOutOfStock ? (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              <Icon name="exclamation-triangle" style={{ fontSize: '4rem', color: '#d97706' }} />
            </div>
            <h2 style={{ color: '#92400e', marginBottom: '.5rem' }}>Out of Stock!</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Payment was received but books are currently <strong>out of stock</strong>.
              Your payment of <strong>₹{(result.amountPaise / 100).toFixed(2)}</strong> has been
              automatically <strong>refunded</strong>.
            </p>
            <div style={{
              background: '#fff7ed', border: '1px solid #fed7aa',
              borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', fontSize: '.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: '#9a3412' }}>
                <Icon name="info-circle" />
                Refund will reflect in 5–7 business days.
              </div>
              {result.refundId && (
                <div style={{ marginTop: '.4rem', color: '#64748b' }}>
                  Refund ID: <span style={{ fontFamily: 'monospace' }}>{result.refundId}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <Icon name="times-circle" style={{ fontSize: '4rem', color: '#dc2626' }} />
            </div>
            <h2 style={{ color: '#991b1b', marginBottom: '.5rem' }}>Payment Failed</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              {result.failureReason || 'Payment could not be processed. No amount was charged.'}
            </p>
          </>
        )}
        <button
          onClick={onClose}
          className={`btn btn-${isSuccess ? 'success' : isOutOfStock ? 'warning' : 'primary'} btn-lg`}
          style={{ width: '100%' }}>
          <Icon name={isSuccess ? 'check' : 'arrow-left'} style={{ marginRight: '.5rem' }} />
          {isSuccess ? 'View My Orders' : 'Back to Cart'}
        </button>
      </div>
    </div>
  );
};

// ── Main CartPage ─────────────────────────────────────────────
export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const navigate = useNavigate();
  const { openRazorpay } = useRazorpay();

  useEffect(() => { loadCart(); }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const res = await getCart();
      setCartItems(res.data);
    } catch { toast.error('Failed to load cart'); }
    finally {
      setLoading(false);
      if (window.refreshCartCount) window.refreshCartCount();
    }
  };

  const handleQuantity = async (itemId, newQty) => {
    try {
      if (newQty <= 0) {
        await removeFromCart(itemId);
        setCartItems(p => p.filter(i => i.id !== itemId));
        toast.info('Item removed from cart');
      } else {
        const res = await updateCartItem(itemId, newQty);
        setCartItems(p => p.map(i => i.id === itemId ? res.data : i));
      }
      if (window.refreshCartCount) window.refreshCartCount();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId);
      setCartItems(p => p.filter(i => i.id !== itemId));
      if (window.refreshCartCount) window.refreshCartCount();
    } catch { toast.error('Failed to remove item'); }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear entire cart?')) return;
    try {
      await clearCart();
      setCartItems([]);
      if (window.refreshCartCount) window.refreshCartCount();
      toast.success('Cart cleared');
    } catch { toast.error('Failed to clear cart'); }
  };

  // ── MAIN PAYMENT FLOW ──────────────────────────────────────
  const handlePayNow = async () => {
    if (cartItems.length === 0) return;
    setPaying(true);
    let libraryOrderId = null;

    try {
      // STEP 1: Create library order (CONFIRMED status, inventory NOT reduced yet)
      const orderRes = await placeOrder(notes);
      libraryOrderId = orderRes.data.id;
      toast.info('Order created. Opening payment gateway…', { autoClose: 2000 });

      // STEP 2: Create Razorpay order
      const rzpRes = await createRazorpayOrder(libraryOrderId);
      const orderData = rzpRes.data;

      // STEP 3: Open Razorpay modal
      openRazorpay({
        orderData,

        // ── SUCCESS: Verify signature → check inventory → complete ──
        onSuccess: async (paymentData) => {
          try {
            toast.loading('Verifying payment & checking inventory…', { toastId: 'verify' });
            const verifyRes = await verifyPayment(paymentData);
            toast.dismiss('verify');
            const result = verifyRes.data;

            if (result.status === 'PAID') {
              toast.success('Payment verified! Order completed.');
            } else if (result.status === 'REFUNDED' || result.status === 'INVENTORY_FAIL') {
              toast.warn('Books out of stock. Payment refunded automatically.');
            }

            setCartItems([]);
            if (window.refreshCartCount) window.refreshCartCount();
            setPaymentResult({ ...result, libraryOrderId });
          } catch (err) {
            toast.dismiss('verify');
            toast.error('Verification failed: ' + (err.response?.data?.message || err.message));
          } finally {
            setPaying(false);
          }
        },

        // ── FAILURE: Notify backend → rollback inventory ──
        onFailure: async (error) => {
          try {
            const rzpOrderId = orderData.razorpayOrderId;
            await paymentFailure(rzpOrderId, error.description || 'Payment failed');
            toast.error('Payment failed. No amount charged. Order cancelled.');
          } catch (e) {
            console.error('Failure handler error:', e);
          } finally {
            setPaying(false);
            // Reload cart — items are back since order cancelled
            loadCart();
          }
        },
      });

    } catch (err) {
      setPaying(false);
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      // If order was created but razorpay failed to create, reload cart
      loadCart();
    }
  };

  // ── Payment result modal close ──────────────────────────────
  const handleModalClose = () => {
    const status = paymentResult?.status;
    setPaymentResult(null);
    if (status === 'PAID') navigate('/my-orders');
  };

  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);
  const totalAmountINR = totalItems * 7;

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="container page-content">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <Icon name="shopping-cart" style={{ fontSize: '1.6rem', color: '#2563eb' }} />
          <h1 className="page-title" style={{ margin: 0 }}>My Cart</h1>
          {cartItems.length > 0 && (
            <span className="badge badge-blue">{cartItems.length} item(s)</span>
          )}
        </div>
        {cartItems.length > 0 && (
          <button className="btn btn-outline btn-sm" onClick={handleClear}>
            <Icon name="trash" style={{ marginRight: '.4rem' }} />
            Clear Cart
          </button>
        )}
      </div>

      {/* Pricing info banner */}
      {cartItems.length > 0 && (
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 10, padding: '.85rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '.75rem',
          marginBottom: '1.5rem', fontSize: '.875rem', color: '#1e40af'
        }}>
          <Icon name="info-circle" style={{ fontSize: '1.1rem' }} />
          <span>
            <strong>Borrowing fee: ₹7 per book</strong> for 14 days.
            Payments are secured by Razorpay. Auto-refund if books are out of stock.
          </span>
        </div>
      )}

      {cartItems.length === 0 ? (
        // Empty cart
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <Icon name="shopping-cart" style={{ fontSize: '5rem', color: '#cbd5e1', marginBottom: '1.5rem' }} />
          <h2 style={{ color: '#334155', marginBottom: '.5rem' }}>Your cart is empty</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            Browse the catalog and add books to your cart
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
            <Icon name="book" style={{ marginRight: '.5rem' }} />
            Browse Catalog
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 340px',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          {/* Cart Items */}
          <div>
            {cartItems.map(item => (
              <CartItemCard
                key={item.id}
                item={item}
                onQuantity={handleQuantity}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* Order Summary */}
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <Icon name="list" />
              Order Summary
            </div>
            <div className="card-body">
              {/* Line items */}
              <div style={{ marginBottom: '1.25rem' }}>
                {cartItems.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '.85rem', marginBottom: '.5rem', color: '#475569'
                  }}>
                    <span style={{ flex: 1, marginRight: '.5rem' }}>
                      {item.bookTitle} ×{item.quantity}
                    </span>
                    <span style={{ fontWeight: 600 }}>₹{item.quantity * 7}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', color: '#64748b', marginBottom: '.5rem' }}>
                  <span>Total books</span><strong>{totalItems}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', color: '#64748b', marginBottom: '.5rem' }}>
                  <span>Borrow period</span><strong>14 days</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', color: '#64748b', marginBottom: '.75rem' }}>
                  <span>Fee per book</span><strong>₹7</strong>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  borderTop: '2px solid #e2e8f0', paddingTop: '.75rem',
                  fontSize: '1.1rem', fontWeight: 700
                }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#2563eb' }}>₹{totalAmountINR}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <Icon name="pencil" style={{ fontSize: '.85rem' }} />
                  Order Notes (optional)
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Any special instructions…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Razorpay Pay Button */}
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginBottom: '.75rem', fontSize: '1rem', gap: '.5rem' }}
                onClick={handlePayNow}
                disabled={paying}>
                {paying ? (
                  <>
                    <Icon name="spin2" style={{ animation: 'spin .8s linear infinite' }} />
                    Processing…
                  </>
                ) : (
                  <>
                    <Icon name="credit-card" />
                    Pay ₹{totalAmountINR} with Razorpay
                  </>
                )}
              </button>

              {/* Trust badges */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: '1rem',
                fontSize: '.75rem', color: '#94a3b8', flexWrap: 'wrap'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                  <Icon name="lock" style={{ color: '#16a34a', fontSize: '.85rem' }} />
                  Secure Payment
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                  <Icon name="shield" style={{ color: '#2563eb', fontSize: '.85rem' }} />
                  Razorpay Secured
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                  <Icon name="replay" style={{ color: '#7c3aed', fontSize: '.85rem' }} />
                  Auto Refund
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Result Modal */}
      <PaymentResultModal result={paymentResult} onClose={handleModalClose} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
