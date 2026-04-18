# Change8 eCommerce Admin Dashboard

A secure, role-based eCommerce Admin Dashboard built with Node.js, Express, AdminJS, Sequelize, and PostgreSQL.

## Features
- JWT Authentication + bcrypt password hashing
- Role-Based Access Control (Admin / Regular User)
- Admin Dashboard with summary cards (Users, Orders, Products, Revenue)
- User Dashboard with personal orders
- Settings management page
- Full CRUD via AdminJS panel

## Tech Stack
- Node.js + Express
- AdminJS
- Sequelize ORM + PostgreSQL
- bcryptjs + jsonwebtoken

## Setup

### 1. Clone the repository
git clone https://github.com/hirumisenevirathna/change8-admin.git
cd change8-admin

### 2. Install dependencies
npm install

### 3. Create .env file
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_secret_key
PORT=3000

### 4. Seed the database
npm run seed

### 5. Start the server
npm run dev

## Login Credentials
| Role  | Email | Password |
|-------|-------|----------|
| Admin | admin@change8.com | admin123 |
| User  | user@change8.com  | user123  |

## Pages
- Admin Panel: http://localhost:3000/admin
- Admin Dashboard: http://localhost:3000/dashboard
- User Dashboard: http://localhost:3000/user-dashboard
- Settings: http://localhost:3000/settings-page
- API Login: POST http://localhost:3000/api/login