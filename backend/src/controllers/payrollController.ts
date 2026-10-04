import { Request, Response } from 'express';
import Payroll from '../models/Payroll';
import Employee from '../models/Employee';
import Attendance from '../models/Attendance';
import LeaveRequest from '../models/LeaveRequest';
import SalarySettings from '../models/SalarySettings';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const generateMonthlyPayroll = async (req: Request, res: Response) => {
  try {
    const { month, year, employeeId } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month (1-12) and Year are required' });
    }

    let settings = await SalarySettings.findOne();
    if (!settings) {
      settings = new SalarySettings();
      await settings.save();
    }

    const totalWorkingDaysInMonth = settings.workingDaysPerMonth || 26;
    const monthlyPaidLeaveLimit = settings.monthlyPaidLeaves || 2;

    const query: any = { status: 'active' };
    if (employeeId) {
      query._id = employeeId;
    }

    const employees = await Employee.find(query);
    if (employees.length === 0) {
      return res.status(404).json({ message: 'No active employees found for payroll' });
    }

    const createdPayrolls = [];
    const updatedPayrolls = [];

    for (const emp of employees) {
      const requiredDailyHours = emp.mandatoryWorkingHours || settings.mandatoryDailyHours || 8;
      const totalRequiredHours = totalWorkingDaysInMonth * requiredDailyHours;

      const monthStr = month.toString().padStart(2, '0');
      const startDate = `${year}-${monthStr}-01`;
      const endDate = `${year}-${monthStr}-31`;

      const attendanceLogs = await Attendance.find({
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate },
      });

      const approvedLeaves = await LeaveRequest.find({
        employee: emp._id,
        status: 'approved',
        startDate: { $gte: startDate, $lte: endDate },
      });

      const totalApprovedLeaveDays = approvedLeaves.reduce((acc, l) => acc + l.totalDays, 0);
      const paidLeaveDays = Math.min(totalApprovedLeaveDays, monthlyPaidLeaveLimit);
      const unpaidLeaveDaysFromExceeded = Math.max(0, totalApprovedLeaveDays - monthlyPaidLeaveLimit);

      const daysPresent = attendanceLogs.filter((a) => a.status === 'present' || a.status === 'half_day').length;
      
      const effectiveWorkingDays = daysPresent + paidLeaveDays;
      const daysAbsent = Math.max(0, totalWorkingDaysInMonth - effectiveWorkingDays);

      const totalHoursWorked = attendanceLogs.reduce((acc, cur) => acc + (cur.totalHours || 0), 0);

      const baseSalary = emp.baseSalary;
      const dailyRate = baseSalary / totalWorkingDaysInMonth;
      const hourlyRate = dailyRate / requiredDailyHours;

      const unpaidLeaveDeductions = Math.round((daysAbsent + unpaidLeaveDaysFromExceeded) * dailyRate);

      let hourlyDeductions = 0;
      if (settings.shortHoursDeductionEnabled) {
        const expectedHoursForPresentDays = daysPresent * requiredDailyHours;
        const shortHours = Math.max(0, expectedHoursForPresentDays - totalHoursWorked);
        hourlyDeductions = Math.round(shortHours * hourlyRate);
      }

      const netSalary = Math.max(0, Math.round(baseSalary - unpaidLeaveDeductions - hourlyDeductions));

      const payrollNumber = `PAY-${year}${monthStr}-${emp.employeeCode}`;

      let payrollDoc = await Payroll.findOne({ employee: emp._id, month: Number(month), year: Number(year) });

      if (payrollDoc) {
        payrollDoc.daysPresent = daysPresent;
        payrollDoc.daysAbsent = daysAbsent;
        payrollDoc.totalHoursWorked = totalHoursWorked;
        payrollDoc.requiredHours = totalRequiredHours;
        payrollDoc.baseSalary = baseSalary;
        payrollDoc.hourlyDeductions = hourlyDeductions;
        payrollDoc.unpaidLeaveDeductions = unpaidLeaveDeductions;
        payrollDoc.netSalary = netSalary;
        await payrollDoc.save();
        updatedPayrolls.push(payrollDoc);
      } else {
        payrollDoc = new Payroll({
          payrollNumber,
          employee: emp._id,
          employeeCode: emp.employeeCode,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          month: Number(month),
          year: Number(year),
          totalWorkingDays: totalWorkingDaysInMonth,
          daysPresent,
          daysAbsent,
          totalHoursWorked,
          requiredHours: totalRequiredHours,
          baseSalary,
          hourlyDeductions,
          unpaidLeaveDeductions,
          netSalary,
          status: 'draft',
        });
        await payrollDoc.save();
        createdPayrolls.push(payrollDoc);
      }

      // Notify employee if user account exists
      if (emp.userId) {
        await Notification.create({
          recipient: emp.userId,
          recipientRole: 'employee',
          title: `Salary Payslip Generated (${month}/${year})`,
          message: `Your payroll ${payrollNumber} for net salary ₹${netSalary.toLocaleString()} has been processed and is ready for review.`,
          type: 'payroll',
        });
      }
    }

    return res.json({
      message: `Payroll calculated using global salary components for ${month}/${year}`,
      createdCount: createdPayrolls.length,
      updatedCount: updatedPayrolls.length,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error calculating payroll', error: error.message });
  }
};

export const getPayrolls = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    const filter: any = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const payrolls = await Payroll.find(filter).populate('employee').sort({ createdAt: -1 });
    return res.json(payrolls);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching payroll records', error: error.message });
  }
};

export const getMyPayslips = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee account missing' });
    }

    const payslips = await Payroll.find({ employee: employeeId }).sort({ year: -1, month: -1 });
    return res.json(payslips);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching payslips', error: error.message });
  }
};

export const approveAndPayPayroll = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payroll = await Payroll.findById(id).populate('employee');
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }

    payroll.status = status || 'paid';
    if (payroll.status === 'paid') {
      payroll.paidAt = new Date();
    }
    await payroll.save();

    // Trigger Notification to Employee
    const emp: any = payroll.employee;
    if (emp && emp.userId) {
      await Notification.create({
        recipient: emp.userId,
        recipientRole: 'employee',
        title: `Salary Paid: ₹${payroll.netSalary.toLocaleString()}`,
        message: `Your salary for ${payroll.month}/${payroll.year} (${payroll.payrollNumber}) has been marked as ${payroll.status.toUpperCase()}.`,
        type: 'payroll',
      });
    }

    return res.json({ message: `Payroll status updated to ${payroll.status}`, payroll });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating payroll status', error: error.message });
  }
};

export const bulkMarkPaid = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Array of payroll IDs is required' });
    }

    const payrolls = await Payroll.find({ _id: { $in: ids } }).populate('employee');
    let count = 0;

    for (const p of payrolls) {
      p.status = 'paid';
      p.paidAt = new Date();
      await p.save();
      count++;

      const emp: any = p.employee;
      if (emp && emp.userId) {
        await Notification.create({
          recipient: emp.userId,
          recipientRole: 'employee',
          title: `Salary Disbursed: ₹${p.netSalary.toLocaleString()}`,
          message: `Your salary for ${p.month}/${p.year} (${p.payrollNumber}) has been marked as PAID.`,
          type: 'payroll',
        });
      }
    }

    return res.json({ message: `Successfully marked ${count} payroll records as PAID`, count });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error bulk updating payroll records', error: error.message });
  }
};
