import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getMyOrders, cancelOrder, getPaymentByOrder } from '../services/api';
import 'primeicons/primeicons.css';

const Icon = ({ name, style }) => (
  <i className={`pi pi-${name}`} style={{ fontSize: '1rem', ...style }} />
);

const orderStatusConfig = {
  PENDING:   { color: '#d97706', bg: '#fef9c3', icon: 'clock',            label: 'Pending' },
  CONFIRMED: { color: '#2563eb', bg: '#dbeafe', icon: 'check',            label: 'Confirmed' },
  READY:     { color: '#7c3aed', bg: '#f3e8ff', icon: 'box',              label: 'Ready for Pickup' },
  COMPLETED: { color: '#16a34a', bg: '#dcfce7', icon: 'check-circle',     label: 'Completed' },
  CANCELLED: { color: '#dc2626', bg: '#fee2e2', icon: 'times-circle',     label: 'Cancelled' },
};

const paymentStatusConfig = {
  CREATED:        { color: '#d97706', bg: '#fef9c3', icon: 'credit-card',         label: 'Payment Pending' },
  PAID:           { color: '#16a34a', bg: '#dcfce7', icon: 'check-circle',        label: 'Paid' },
  FAILED:         { color: '#dc2626', bg: '#fee2e2', icon: 'times-circle',        label: 'Payment Failed' },
  REFUNDED:       { color: '#7c3aed', bg: '#f3e8ff', icon: 'replay',              label: 'Refunded' },
  INVENTORY_FAIL: { color: '#9a3412', bg: '#ffedd5', icon: 'exclamation-triangle', label: 'Out of Stock' },
};

const StatusBadge = ({ status, type = 'order' }) => {
  const map = type === 'order' ? orderStatusConfig : paymentStatusConfig;
  const cfg = map[status] || map[type === 'order' ? 'PENDING' : 'CREATED'];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, padding: '.2rem .65rem',
      borderRadius: '100px', fontSize: '.78rem', fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: '.3rem'
    }}>
      <Icon name={cfg.icon} style={{ fontSize: '.78rem' }} />
      {cfg.label}
    </span>
  );
};

const TimelineStep = ({ steps, currentStatus, cancelled }) => {
  const currentIdx = cancelled ? -1 : steps.indexOf(currentStatus);
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: '.75rem' }}>
      {steps.map((step, i) => {
        const done = !cancelled && i <= currentIdx;
        const active = !cancelled && step === currentStatus;
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: done ? '#2563eb' : '#e2e8f0',
                border: `2px solid ${done ? '#2563eb' : '#cbd5e1'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: done ? 'white' : '#94a3b8', fontSize: '.8rem'
              }}>
                {done
                  ? <Icon name="check" style={{ fontSize: '.7rem', color: 'white' }} />
                  : <span style={{ fontWeight: 700 }}>{i + 1}</span>}
              </div>
              <span style={{
                fontSize: '.68rem', marginTop: '.3rem', textAlign: 'center',
                color: active ? '#2563eb' : '#94a3b8',
                fontWeight: active ? 700 : 400
              }}>
                {step.charAt(0) + step.slice(1).toLowerCase()}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                height: 2, flex: 1,
                background: !cancelled && i < currentIdx ? '#2563eb' : '#e2e8f0',
                marginBottom: '1.2rem', marginLeft: 2, marginRight: 2
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState({}); // orderId → payment
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getMyOrders();
      setOrders(res.data);
      // Load payments for each order
      const pmtMap = {};
      await Promise.all(res.data.map(async o => {
        try {
          const p = await getPaymentByOrder(o.id);
          if (p.data) pmtMap[o.id] = p.data;
        } catch {}
      }));
      setPayments(pmtMap);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order? If paid, a refund will be initiated.')) return;
    try {
      const res = await cancelOrder(orderId);
      setOrders(p => p.map(o => o.id === orderId ? res.data : o));
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel');
    }
  };

  const steps = ['CONFIRMED', 'READY', 'COMPLETED'];

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="container page-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <Icon name="shopping-bag" style={{ fontSize: '1.6rem', color: '#2563eb' }} />
          <h1 className="page-title" style={{ margin: 0 }}>My Orders</h1>
          {orders.length > 0 && (
            <span className="badge badge-blue">{orders.length}</span>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <Icon name="inbox" style={{ fontSize: '5rem', color: '#cbd5e1', marginBottom: '1.5rem' }} />
          <h2 style={{ color: '#334155', marginBottom: '.5rem' }}>No orders yet</h2>
          <p style={{ color: '#64748b' }}>Add books to cart and place an order</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => {
            const payment = payments[order.id];
            const isOpen = expanded === order.id;
            const cancelled = order.status === 'CANCELLED';

            return (
              <div key={order.id} className="card">
                <div className="card-body">
                  {/* Order header row */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem'
                  }}>
                    <div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '.6rem',
                        flexWrap: 'wrap', marginBottom: '.4rem'
                      }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                          Order #{order.id}
                        </span>
                        <StatusBadge status={order.status} type="order" />
                        {payment && <StatusBadge status={payment.status} type="payment" />}
                      </div>
                      <div style={{ fontSize: '.8rem', color: '#64748b', display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                          <Icon name="calendar" style={{ fontSize: '.8rem' }} />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                          <Icon name="book" style={{ fontSize: '.8rem' }} />
                          {order.totalItems} book(s)
                        </span>
                        {payment && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                            <Icon name="indian-rupee" style={{ fontSize: '.8rem' }} />
                            ₹{(payment.amountPaise / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setExpanded(isOpen ? null : order.id)}>
                        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} style={{ marginRight: '.3rem' }} />
                        {isOpen ? 'Hide' : 'Details'}
                      </button>
                      {order.status === 'CONFIRMED' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(order.id)}>
                          <Icon name="times" style={{ marginRight: '.3rem' }} />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isOpen && (
                    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                      {/* Books list */}
                      <div style={{
                        fontSize: '.8rem', color: '#64748b', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.75rem',
                        display: 'flex', alignItems: 'center', gap: '.4rem'
                      }}>
                        <Icon name="list" style={{ fontSize: '.8rem' }} />
                        Ordered Books
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.25rem' }}>
                        {order.items && order.items.map(item => (
                          <div key={item.id} style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '.75rem', background: '#f8fafc', borderRadius: 8
                          }}>
                            <div style={{
                              width: 38, height: 50, borderRadius: 6, flexShrink: 0,
                              background: 'linear-gradient(135deg,#667eea,#764ba2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: '1.1rem'
                            }}>📚</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{item.bookTitle}</div>
                              <div style={{ color: '#64748b', fontSize: '.78rem' }}>{item.bookAuthor}</div>
                            </div>
                            <div style={{
                              background: '#e0e7ff', color: '#3730a3', borderRadius: '100px',
                              padding: '.15rem .6rem', fontSize: '.78rem', fontWeight: 600
                            }}>×{item.quantity}</div>
                            <div style={{ fontWeight: 600, color: '#2563eb', fontSize: '.88rem' }}>
                              ₹{item.quantity * 7}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Payment details */}
                      {payment && (
                        <div style={{
                          background: payment.status === 'PAID' ? '#f0fdf4'
                            : payment.status === 'REFUNDED' || payment.status === 'INVENTORY_FAIL' ? '#fff7ed'
                            : '#f8fafc',
                          border: `1px solid ${payment.status === 'PAID' ? '#bbf7d0'
                            : payment.status === 'REFUNDED' || payment.status === 'INVENTORY_FAIL' ? '#fed7aa'
                            : '#e2e8f0'}`,
                          borderRadius: 10, padding: '1rem', marginBottom: '1.25rem'
                        }}>
                          <div style={{
                            fontWeight: 600, fontSize: '.8rem', color: '#64748b',
                            textTransform: 'uppercase', letterSpacing: '.05em',
                            marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.4rem'
                          }}>
                            <Icon name="credit-card" style={{ fontSize: '.8rem' }} />
                            Payment Details
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', fontSize: '.82rem' }}>
                            <div>
                              <span style={{ color: '#64748b' }}>Status: </span>
                              <StatusBadge status={payment.status} type="payment" />
                            </div>
                            <div>
                              <span style={{ color: '#64748b' }}>Amount: </span>
                              <strong>₹{(payment.amountPaise / 100).toFixed(2)}</strong>
                            </div>
                            {payment.razorpayPaymentId && (
                              <div style={{ gridColumn: '1/-1' }}>
                                <span style={{ color: '#64748b' }}>Payment ID: </span>
                                <span style={{ fontFamily: 'monospace', fontSize: '.78rem' }}>
                                  {payment.razorpayPaymentId}
                                </span>
                              </div>
                            )}
                            {payment.refundId && (
                              <div style={{ gridColumn: '1/-1' }}>
                                <span style={{ color: '#64748b' }}>Refund ID: </span>
                                <span style={{ fontFamily: 'monospace', fontSize: '.78rem' }}>
                                  {payment.refundId}
                                </span>
                              </div>
                            )}
                            {payment.failureReason && (
                              <div style={{ gridColumn: '1/-1', color: '#991b1b' }}>
                                <Icon name="exclamation-triangle" style={{ marginRight: '.3rem' }} />
                                {payment.failureReason}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {order.notes && (
                        <div style={{
                          padding: '.75rem', background: '#fefce8',
                          borderRadius: 8, fontSize: '.85rem', marginBottom: '1.25rem'
                        }}>
                          <Icon name="pencil" style={{ marginRight: '.4rem', color: '#92400e' }} />
                          <strong>Notes:</strong> {order.notes}
                        </div>
                      )}

                      {/* Timeline */}
                      {!cancelled && (
                        <>
                          <div style={{
                            fontWeight: 600, fontSize: '.8rem', color: '#64748b',
                            textTransform: 'uppercase', letterSpacing: '.05em',
                            marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem'
                          }}>
                            <Icon name="map-marker" style={{ fontSize: '.8rem' }} />
                            Order Progress
                          </div>
                          <TimelineStep
                            steps={steps}
                            currentStatus={order.status}
                            cancelled={cancelled}
                          />
                        </>
                      )}

                      {cancelled && (
                        <div style={{
                          background: '#fee2e2', borderRadius: 8, padding: '.85rem',
                          display: 'flex', alignItems: 'center', gap: '.5rem',
                          color: '#991b1b', fontSize: '.875rem'
                        }}>
                          <Icon name="times-circle" />
                          This order was cancelled.
                          {payment?.status === 'REFUNDED' && ' Payment has been refunded.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
