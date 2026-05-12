import { useCallback } from 'react';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const useRazorpay = () => {
  const openRazorpay = useCallback(async ({ orderData, onSuccess, onFailure }) => {
    const loaded = await loadScript(RAZORPAY_SCRIPT);
    if (!loaded) { onFailure({ description: 'Razorpay SDK failed to load.' }); return; }

    const options = {
      key: orderData.keyId,
      amount: orderData.amountPaise,
      currency: orderData.currency || 'INR',
      name: 'Library Catalog',
      description: `Order #${orderData.libraryOrderId} — Book Borrowing Fee`,
      order_id: orderData.razorpayOrderId,
      prefill: { name: orderData.userName || '', email: orderData.userEmail || '' },
      theme: { color: '#2563eb' },
      modal: { ondismiss: () => onFailure({ description: 'Payment popup closed by user' }) },
      handler: function (response) {
        onSuccess({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      onFailure({ description: response.error.description, reason: response.error.reason });
    });
    rzp.open();
  }, []);

  return { openRazorpay };
};
