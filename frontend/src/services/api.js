import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const register = (data) =>
  api.post('/auth/register', data);

// Books
export const getBooks = (page = 0, size = 12) =>
  api.get(`/books?page=${page}&size=${size}`);

export const searchBooks = (keyword, page = 0, size = 12) =>
  api.get(`/books/search?keyword=${keyword}&page=${page}&size=${size}`);

export const getBook = (id) => api.get(`/books/${id}`);

export const getGenres = () => api.get('/books/genres');

export const getBookReviews = (id) => api.get(`/books/${id}/reviews`);

export const addReview = (bookId, rating, comment) =>
  api.post(`/books/${bookId}/reviews`, { rating, comment });

// Borrow
export const borrowBook = (bookId) => api.post(`/borrow/${bookId}`);

export const returnBook = (recordId) => api.post(`/borrow/return/${recordId}`);

export const reserveBook = (bookId) => api.post(`/borrow/reserve/${bookId}`);

export const getMyBorrows = () => api.get('/borrow/my-borrows');

export const getMyHistory = () => api.get('/borrow/my-history');

// User
export const getCurrentUser = () => api.get('/users/me');

export const updateProfile = (data) => api.put('/users/me', data);

// Admin
export const adminGetAllUsers = () => api.get('/admin/users');

export const adminCreateUser = (data) => api.post('/admin/users', data);

export const adminUpdateUser = (id, data) => api.put(`/admin/users/${id}`, data);

export const adminDeleteUser = (id) => api.delete(`/admin/users/${id}`);

export const adminCreateBook = (data) => api.post('/admin/books', data);

export const adminUpdateBook = (id, data) => api.put(`/admin/books/${id}`, data);

export const adminDeleteBook = (id) => api.delete(`/admin/books/${id}`);

export const adminGetAllBorrows = () => api.get('/admin/borrows');

export const adminGetReports = () => api.get('/admin/reports');

// Cart
export const getCart = () => api.get('/cart');
export const getCartCount = () => api.get('/cart/count');
export const addToCart = (bookId, quantity = 1) => api.post(`/cart/add/${bookId}`, { quantity });
export const updateCartItem = (cartItemId, quantity) => api.put(`/cart/${cartItemId}`, { quantity });
export const removeFromCart = (cartItemId) => api.delete(`/cart/${cartItemId}`);
export const clearCart = () => api.delete('/cart/clear');

// Orders
export const placeOrder = (notes = '') => api.post('/orders/place', { notes });
export const getMyOrders = () => api.get('/orders/my-orders');
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const cancelOrder = (id) => api.put(`/orders/${id}/cancel`);
export const adminGetAllOrders = () => api.get('/orders/admin/all');
export const adminUpdateOrderStatus = (id, status) => api.put(`/orders/admin/${id}/status`, { status });

// Comments
export const getBookComments = (bookId) => api.get(`/comments/book/${bookId}`);
export const addComment = (bookId, content, parentId = null) =>
  api.post(`/comments/book/${bookId}`, { content, parentId });
export const editComment = (commentId, content) => api.put(`/comments/${commentId}`, { content });
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`);

export default api;


// Payments
export const createRazorpayOrder = (libraryOrderId) =>
  api.post(`/payments/create-order/${libraryOrderId}`);

export const verifyPayment = (data) =>
  api.post('/payments/verify', data);

export const paymentFailure = (razorpayOrderId, reason) =>
  api.post('/payments/failure', { razorpayOrderId, reason });

export const getPaymentByOrder = (libraryOrderId) =>
  api.get(`/payments/order/${libraryOrderId}`);

export const getMyPayments = () => api.get('/payments/my-payments');

export const adminGetAllPayments = () => api.get('/payments/admin/all');
