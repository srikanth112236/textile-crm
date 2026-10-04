import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';
import Employee from '../models/Employee';
import User from '../models/User';

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    return res.json(employees);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    const userAccount = await User.findOne({ employeeId: employee._id }).select('-password');
    return res.json({ employee, userAccount });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching employee', error: error.message });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      joiningDate,
      baseSalary,
      mandatoryWorkingHours,
      password: customPassword,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !department || !designation || !baseSalary) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    const existingEmp = await Employee.findOne({ email });
    const existingUser = await User.findOne({ email });
    if (existingEmp || existingUser) {
      return res.status(400).json({ message: 'An account or employee with this email already exists' });
    }

    // Generate unique employee code
    const count: number = await Employee.countDocuments();
    const employeeCode: string = `EMP-${(1001 + count).toString().padStart(4, '0')}`;

    // Auto-generate password if custom password not provided
    const initialPassword = customPassword || `Emp@${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    const newEmployee = new Employee({
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      joiningDate: joiningDate || new Date(),
      baseSalary: Number(baseSalary),
      mandatoryWorkingHours: mandatoryWorkingHours ? Number(mandatoryWorkingHours) : 8,
      status: 'active',
    });

    const savedEmployee = await newEmployee.save();

    const newUser = new User({
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      role: 'employee',
      mustChangePassword: true,
      employeeId: savedEmployee._id,
    });

    const savedUser = await newUser.save();
    savedEmployee.userId = savedUser._id;
    await savedEmployee.save();

    return res.status(201).json({
      message: 'Employee created successfully',
      employee: savedEmployee,
      createdCredentials: {
        email: savedUser.email,
        initialPassword,
        employeeCode: savedEmployee.employeeCode,
        mustChangePassword: true,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
};

export const importExcelEmployees = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel or CSV file' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ message: 'Uploaded file contains no data' });
    }

    const createdList: any[] = [];
    const skippedList: any[] = [];

    for (const row of rows) {
      const firstName = row.FirstName || row['First Name'] || row.firstName || row.name?.split(' ')[0] || 'Employee';
      const lastName = row.LastName || row['Last Name'] || row.lastName || row.name?.split(' ')[1] || 'User';
      const email = (row.Email || row.email || '').toLowerCase().trim();
      const phone = String(row.Phone || row.phone || '0000000000');
      const department = row.Department || row.department || 'General';
      const designation = row.Designation || row.designation || 'Staff';
      const baseSalary = Number(row.BaseSalary || row.Salary || row.baseSalary || 25000);
      const mandatoryWorkingHours = Number(row.WorkingHours || row.mandatoryWorkingHours || 8);

      if (!email) {
        skippedList.push({ row, reason: 'Missing email' });
        continue;
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        skippedList.push({ email, reason: 'Email already exists' });
        continue;
      }

      const currentDocCount: number = await Employee.countDocuments();
      const empIndex: number = currentDocCount + createdList.length;
      const empCodeStr: string = `EMP-${(1001 + empIndex).toString().padStart(4, '0')}`;
      const initialPassword = `Emp@${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedPassword = await bcrypt.hash(initialPassword, 10);

      const newEmpDoc = new Employee({
        employeeCode: empCodeStr,
        firstName,
        lastName,
        email,
        phone,
        department,
        designation,
        joiningDate: new Date(),
        baseSalary,
        mandatoryWorkingHours,
        status: 'active',
      });

      const savedEmpDoc = await newEmpDoc.save();

      const newUserDoc = new User({
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        role: 'employee',
        mustChangePassword: true,
        employeeId: savedEmpDoc._id,
      });

      const savedUserDoc = await newUserDoc.save();
      savedEmpDoc.userId = savedUserDoc._id;
      await savedEmpDoc.save();

      createdList.push({
        employeeCode: savedEmpDoc.employeeCode,
        name: `${firstName} ${lastName}`,
        email: savedEmpDoc.email,
        initialPassword,
      });
    }

    return res.status(201).json({
      message: `Processed Excel import: ${createdList.length} employees created, ${skippedList.length} skipped`,
      createdCount: createdList.length,
      createdCredentials: createdList,
      skipped: skippedList,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error parsing Excel file', error: error.message });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (req.body.firstName || req.body.lastName) {
      await User.findOneAndUpdate(
        { employeeId: updatedEmployee._id },
        { name: `${updatedEmployee.firstName} ${updatedEmployee.lastName}` }
      );
    }

    return res.json({ message: 'Employee updated successfully', employee: updatedEmployee });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    await User.findOneAndDelete({ employeeId: employee._id });
    return res.json({ message: 'Employee and user account deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
};
