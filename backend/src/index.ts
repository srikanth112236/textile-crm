import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import path from 'path';
import fs from 'fs';
import User from './models/User';
import Employee from './models/Employee';
import SalarySettings from './models/SalarySettings';

import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import customerRoutes from './routes/customerRoutes';
import productRoutes from './routes/productRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import payrollRoutes from './routes/payrollRoutes';
import salarySettingsRoutes from './routes/salarySettingsRoutes';
import leaveRoutes from './routes/leaveRoutes';
import notificationRoutes from './routes/notificationRoutes';
import holidayRoutes from './routes/holidayRoutes';
import attendanceRequestRoutes from './routes/attendanceRequestRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/textile';

const allowedOrigins = [
  'https://textile-crm-frontend.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, postman, same-origin)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true); // Allow all origins in production for maximum compatibility
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);
app.use(express.json());

// API Route mounts
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/salary-settings', salarySettingsRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/attendance-requests', attendanceRequestRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Textile ERP Enterprise Backend Server is running!' });
});

// Serve static frontend in production (Single Web Service deployment)
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendBuildPath)) {
  console.log(`Serving frontend static files from: ${frontendBuildPath}`);
  app.use(express.static(frontendBuildPath));
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    }
  });
}

// Seed Default Admin & Employee Demo Accounts
const seedDefaultAccounts = async () => {
  try {
    // 1. Seed Salary Settings if missing
    const settingsCount = await SalarySettings.countDocuments();
    if (settingsCount === 0) {
      await SalarySettings.create({});
      console.log('Seeded default salary settings rules');
    }

    // 2. Seed Super Admin account
    let superAdmin = await User.findOne({ email: 'superadmin@gmail.com' });
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);

    if (!superAdmin) {
      superAdmin = new User({
        name: 'System Administrator',
        email: 'superadmin@gmail.com',
        password: hashedAdminPassword,
        role: 'admin',
        mustChangePassword: false,
      });
      await superAdmin.save();
      console.log('Seeded default Admin: superadmin@gmail.com / admin123');
    } else {
      // Ensure password is synchronized to admin123
      superAdmin.password = hashedAdminPassword;
      await superAdmin.save();
    }

    // 3. Seed Demo Employee account
    let demoEmployeeUser = await User.findOne({ email: 'employee@textile.com' });
    const hashedEmpPassword = await bcrypt.hash('emp123456', 10);

    if (!demoEmployeeUser) {
      let empDoc = await Employee.findOne({ email: 'employee@textile.com' });
      if (!empDoc) {
        empDoc = new Employee({
          employeeCode: 'EMP-1001',
          firstName: 'Rajesh',
          lastName: 'Kumar',
          email: 'employee@textile.com',
          phone: '9876543210',
          department: 'Production & Weaving',
          designation: 'Senior Operator',
          baseSalary: 35000,
          mandatoryWorkingHours: 8,
          status: 'active',
        });
        await empDoc.save();
      }

      demoEmployeeUser = new User({
        name: 'Rajesh Kumar',
        email: 'employee@textile.com',
        password: hashedEmpPassword,
        role: 'employee',
        employeeId: empDoc._id,
        mustChangePassword: false,
      });
      await demoEmployeeUser.save();
      empDoc.userId = demoEmployeeUser._id;
      await empDoc.save();
      console.log('Seeded default Employee: employee@textile.com / emp123456');
    } else {
      demoEmployeeUser.password = hashedEmpPassword;
      await demoEmployeeUser.save();
    }
  } catch (err) {
    console.error('Error seeding default database accounts:', err);
  }
};

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(`Connected to MongoDB at ${MONGO_URI}`);
    await seedDefaultAccounts();
    app.listen(PORT, () => {
      console.log(`Textile Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    app.listen(PORT, () => {
      console.log(`Textile Backend running on port ${PORT} (MongoDB offline mode)`);
    });
  });
