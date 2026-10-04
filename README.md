# Textile CRM & ERP Enterprise System

A full-stack Textile Management & CRM platform built with React, Vite, TypeScript, Node.js, Express, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**: Role-based access control (Admin, Employee, Customer).
- **Employee Management**: Employee directory, designations, departments, salary details.
- **Attendance & Leave Management**: Daily attendance tracking, leave requests, approval workflow.
- **Payroll & Salary Management**: Automated payroll calculations, slip generation, salary configurations.
- **Customer & Order Management**: Customer database, invoicing, order tracking.
- **Product Inventory**: Textile products catalog and pricing management.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, jsPDF, XLSX
- **Backend**: Node.js, Express.js, TypeScript, Mongoose (MongoDB), JWT, BcryptJS
- **Deployment**: Render (render.com)

---

## 📦 Project Structure

```
textile-crm/
├── backend/            # Express.js + TypeScript backend server
│   ├── src/            # Controllers, Models, Routes, Middleware
│   ├── package.json
│   └── tsconfig.json
├── frontend/           # React + Vite + TypeScript frontend client
│   ├── src/            # Components, Pages, Context, Utils
│   ├── package.json
│   └── vite.config.ts
├── render.yaml         # Render Blueprint Deployment Configuration
├── package.json        # Root package.json with unified build & start scripts
├── .gitignore          # Git ignore rules
└── README.md           # Documentation
```

---

## ⚙ Local Setup & Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/srikanth112236/textile-crm.git
   cd textile-crm
   ```

2. **Install dependencies**:
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables**:
   Create a `.env` file inside the `backend` directory based on `.env.example`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/textile
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Run in Development Mode**:
   - Backend (Port 5000):
     ```bash
     npm run dev:backend
     ```
   - Frontend (Port 3000):
     ```bash
     npm run dev:frontend
     ```

---

## ☁ Deploying to Render (onrender.com)

### Option 1: Automatic Blueprint Deployment (Recommended)

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: setup render deployment files"
   git branch -M main
   git remote add origin https://github.com/srikanth112236/textile-crm.git
   git push -u origin main
   ```

2. Open [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository `srikanth112236/textile-crm`.
5. Render will automatically detect `render.yaml` and configure the Web Service.
6. Set your `MONGO_URI` environment variable in the Render Dashboard (e.g., MongoDB Atlas connection string).
7. Click **Apply** to deploy!

### Option 2: Manual Web Service Deployment

1. Go to [Render Dashboard](https://dashboard.render.com) and click **New +** -> **Web Service**.
2. Connect repository `https://github.com/srikanth112236/textile-crm`.
3. Configure settings:
   - **Name**: `textile-crm`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = `<Your MongoDB Atlas connection URI>`
   - `JWT_SECRET` = `<Random Secret Key>`
5. Click **Create Web Service**.

---

## 🗝 Default Demo Accounts

Upon initial startup with a connected database, the system automatically seeds default accounts:

- **Admin Account**: `superadmin@gmail.com` / `admin123`
- **Employee Account**: `employee@textile.com` / `emp123456`
