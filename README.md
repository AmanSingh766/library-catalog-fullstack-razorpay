# Library Catalog — Full Stack Application
## Spring Boot + React + PostgreSQL + Razorpay

---

## Quick Start

### 1. PostgreSQL Setup
```sql
CREATE DATABASE library_db;
```

### 2. Razorpay Keys
Get keys from https://dashboard.razorpay.com (Test mode)
Update `backend/src/main/resources/application.properties`:
```
razorpay.key.id=rzp_test_YOUR_KEY_ID
razorpay.key.secret=YOUR_KEY_SECRET
```

### 3. Run Backend
```bash
cd backend
mvn spring-boot:run
```
Backend: http://localhost:8080

### 4. Run Frontend
```bash
cd frontend
npm install
npm start
```
Frontend: http://localhost:3000

---

## Login Credentials
| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | admin    | admin123  |
| User  | user     | user123   |

---

## Payment Flow
```
1. User adds books to cart
2. Clicks "Pay with Razorpay"
3. Library order created (CONFIRMED)
4. Razorpay modal opens
5. User pays
   ├── SUCCESS → Backend verifies signature
   │             → Checks inventory
   │             ├── Stock available → Order COMPLETED ✓
   │             └── Out of stock   → Auto REFUND + Order CANCELLED
   └── FAILURE  → Backend notified
                 → Inventory unchanged
                 → Order CANCELLED
```

## Borrowing Fee
- ₹7 per book for 14 days
- Minimum charge ₹1 (Razorpay requirement)

---

## Features
- JWT Authentication (User/Admin roles)
- Browse & search books catalog
- Add to cart, adjust quantity
- Razorpay payment with signature verification
- Auto inventory check post-payment
- Auto refund if out of stock
- Book borrowing (direct, 14-day loan)
- Book reservations
- Star ratings & reviews
- Threaded comments with replies
- Order tracking with timeline
- Payment history in profile
- Admin: catalog, users, borrows, orders, payments, inventory

## Tech Stack
| Layer     | Technology                    |
|-----------|-------------------------------|
| Backend   | Spring Boot 3.2, Java 17      |
| Security  | Spring Security + JWT         |
| Database  | PostgreSQL + JPA/Hibernate    |
| Payments  | Razorpay Java SDK             |
| Frontend  | React 18 + React Router v6    |
| Icons     | PrimeIcons                    |
| HTTP      | Axios with interceptors        |
| Alerts    | React Toastify                |
