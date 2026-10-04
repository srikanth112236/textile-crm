import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Employee from '../models/Employee';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecrettextilekey2026';

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      mustChangePassword: false,
    });

    await adminUser.save();

    const token = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: adminUser.role, mustChangePassword: false },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        mustChangePassword: false,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error registering admin', error: error.message });
  }
};

export const registerCompany = async (req: Request, res: Response) => {
  try {
    const { companyName, industry, taxId, contactName, email, phone, address } = req.body;

    if (!companyName || !contactName || !email) {
      return res.status(400).json({ message: 'Company name, contact name, and email are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const generatedPassword = `TextileAdmin@${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const adminUser = new User({
      name: contactName,
      email,
      password: hashedPassword,
      role: 'admin',
      mustChangePassword: true,
    });

    await adminUser.save();

    const token = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: adminUser.role, mustChangePassword: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Company registered successfully. Credentials generated.',
      token,
      company: { companyName, industry, taxId, address },
      credentials: {
        email: adminUser.email,
        temporaryPassword: generatedPassword,
        mustChangePassword: true,
      },
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        mustChangePassword: true,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error registering company', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let employeeInfo = null;
    if (user.role === 'employee' && user.employeeId) {
      employeeInfo = await Employee.findById(user.employeeId);
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId ? user.employeeId.toString() : undefined,
        mustChangePassword: user.mustChangePassword,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        employeeId: user.employeeId,
        employeeInfo,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.mustChangePassword = false;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId ? user.employeeId.toString() : undefined,
        mustChangePassword: false,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Password updated successfully',
      token,
      mustChangePassword: false,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let employeeInfo = null;
    if (user.role === 'employee' && user.employeeId) {
      employeeInfo = await Employee.findById(user.employeeId);
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        employeeId: user.employeeId,
        employeeInfo,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (firstName || lastName) {
      const newName = `${firstName || ''} ${lastName || ''}`.trim();
      if (newName) user.name = newName;
      await user.save();

      if (user.role === 'employee' && user.employeeId) {
        const emp = await Employee.findById(user.employeeId);
        if (emp) {
          if (firstName) emp.firstName = firstName;
          if (lastName) emp.lastName = lastName;
          await emp.save();
        }
      }
    }

    const updatedUser = await User.findById(user._id).select('-password');
    let employeeInfo = null;
    if (updatedUser?.role === 'employee' && updatedUser.employeeId) {
      employeeInfo = await Employee.findById(updatedUser.employeeId);
    }

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role,
        mustChangePassword: updatedUser?.mustChangePassword,
        employeeId: updatedUser?.employeeId,
        employeeInfo,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};
