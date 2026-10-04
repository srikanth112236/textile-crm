import { Response } from 'express';
import LeaveRequest from '../models/LeaveRequest';
import Employee from '../models/Employee';
import SalarySettings from '../models/SalarySettings';
import { AuthRequest } from '../middleware/auth';

export const applyLeave = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee account required to apply for leave' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Start Date, End Date, and Reason are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newLeave = new LeaveRequest({
      employee: employee._id,
      employeeCode: employee.employeeCode,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      leaveType: leaveType || 'casual',
      startDate,
      endDate,
      totalDays,
      reason,
      status: 'pending',
    });

    const savedLeave = await newLeave.save();
    return res.status(201).json({ message: 'Leave request submitted successfully', leave: savedLeave });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error submitting leave request', error: error.message });
  }
};

export const getMyLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee account required' });
    }

    let settings = await SalarySettings.findOne();
    const monthlyAllowed = settings?.monthlyPaidLeaves || 2;
    const yearlyAllowed = settings?.yearlyPaidLeaves || 24;

    const leaves = await LeaveRequest.find({ employee: employeeId }).sort({ createdAt: -1 });

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const approvedLeavesThisYear = leaves.filter((l) => {
      if (l.status !== 'approved') return false;
      const lYear = new Date(l.startDate).getFullYear();
      return lYear === currentYear;
    });

    const approvedLeavesThisMonth = approvedLeavesThisYear.filter((l) => {
      const lMonth = new Date(l.startDate).getMonth() + 1;
      return lMonth === currentMonth;
    });

    const usedThisMonth = approvedLeavesThisMonth.reduce((sum, l) => sum + l.totalDays, 0);
    const usedThisYear = approvedLeavesThisYear.reduce((sum, l) => sum + l.totalDays, 0);

    const remainingMonthly = Math.max(0, monthlyAllowed - usedThisMonth);
    const remainingYearly = Math.max(0, yearlyAllowed - usedThisYear);

    return res.json({
      leaves,
      stats: {
        monthlyAllowed,
        yearlyAllowed,
        usedThisMonth,
        usedThisYear,
        remainingMonthly,
        remainingYearly,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching leave history', error: error.message });
  }
};

export const getAllLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const leaves = await LeaveRequest.find().sort({ createdAt: -1 });
    return res.json(leaves);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching all leave requests', error: error.message });
  }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leave = await LeaveRequest.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leave.status = status;
    await leave.save();

    return res.json({ message: `Leave request ${status} successfully`, leave });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating leave status', error: error.message });
  }
};
