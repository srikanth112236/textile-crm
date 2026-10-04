import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import AttendanceRequest from '../models/AttendanceRequest';
import Employee from '../models/Employee';
import Attendance from '../models/Attendance';
import Notification from '../models/Notification';

export const createAttendanceRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, date, requestType, breakType, startTime, endTime, durationHours, reason } = req.body;
    let targetEmployeeId = employeeId;
    let empCode = '';
    let empName = '';

    if (req.user && req.user.role === 'employee') {
      const emp = await Employee.findOne({ userId: req.user.id });
      if (!emp) {
        res.status(404).json({ success: false, message: 'Employee profile not found' });
        return;
      }
      targetEmployeeId = emp._id;
      empCode = emp.employeeCode;
      empName = `${emp.firstName} ${emp.lastName}`;
    } else {
      if (!targetEmployeeId) {
        res.status(400).json({ success: false, message: 'Employee ID is required' });
        return;
      }
      const emp = await Employee.findById(targetEmployeeId);
      if (!emp) {
        res.status(404).json({ success: false, message: 'Employee not found' });
        return;
      }
      empCode = emp.employeeCode;
      empName = `${emp.firstName} ${emp.lastName}`;
    }

    if (!date || !reason) {
      res.status(400).json({ success: false, message: 'Date and reason are required' });
      return;
    }

    const newRequest = await AttendanceRequest.create({
      employee: targetEmployeeId,
      employeeCode: empCode,
      employeeName: empName,
      date,
      requestType: requestType || 'break',
      breakType: breakType || 'official_out',
      startTime: startTime || '',
      endTime: endTime || '',
      durationHours: Number(durationHours) || 1,
      reason,
      status: 'pending',
    });

    // Save a notification record
    if (req.user?.id) {
      await Notification.create({
        recipient: req.user.id,
        recipientRole: 'admin',
        title: 'New Break / Adjustment Request',
        message: `${empName} requested ${breakType || requestType} on ${date} (${durationHours || 1} hrs). Reason: ${reason}`,
        type: 'attendance',
      });
    }

    res.status(201).json({ success: true, request: newRequest, message: 'Request submitted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, date, status } = req.query;
    let query: any = {};

    if (req.user && req.user.role === 'employee') {
      const emp = await Employee.findOne({ userId: req.user.id });
      if (emp) {
        query.employee = emp._id;
      }
    }

    if (month) {
      query.date = { $regex: `^${month}` }; // YYYY-MM
    } else if (date) {
      query.date = date;
    }

    if (status) {
      query.status = status;
    }

    const requests = await AttendanceRequest.find(query).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAttendanceRequestStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!['approved_paid', 'approved_deduction', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const attendanceReq = await AttendanceRequest.findById(id);
    if (!attendanceReq) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    attendanceReq.status = status;
    if (adminNote !== undefined) {
      attendanceReq.adminNote = adminNote;
    }
    await attendanceReq.save();

    // If approved, update attendance record if present
    const emp = await Employee.findById(attendanceReq.employee);
    if (emp) {
      const attendance = await Attendance.findOne({ employee: emp._id, date: attendanceReq.date });
      if (attendance) {
        if (status === 'approved_paid') {
          // Add break duration to total hours without deduction or mark note
          attendance.notes = (attendance.notes ? attendance.notes + ' | ' : '') + `Paid break approved (${attendanceReq.breakType}: ${attendanceReq.durationHours}h)`;
          attendance.totalHours += attendanceReq.durationHours;
          attendance.metMandatoryHours = attendance.totalHours >= (attendance.mandatoryHours || 8);
          await attendance.save();
        } else if (status === 'approved_deduction') {
          attendance.notes = (attendance.notes ? attendance.notes + ' | ' : '') + `Break approved with deduction (${attendanceReq.breakType}: ${attendanceReq.durationHours}h)`;
          await attendance.save();
        }
      }

      // Notify employee
      if (emp.userId) {
        let statusMsg = status === 'approved_paid' 
          ? 'approved as paid official time' 
          : status === 'approved_deduction' 
            ? 'approved with time deduction' 
            : 'rejected';
        await Notification.create({
          recipient: emp.userId,
          recipientRole: 'employee',
          title: 'Break / Adjustment Request Update',
          message: `Your request for ${attendanceReq.date} (${attendanceReq.breakType}) was ${statusMsg}. ${adminNote ? 'Note: ' + adminNote : ''}`,
          type: 'attendance',
        });
      }
    }

    res.json({ success: true, request: attendanceReq, message: `Request ${status.replace('_', ' ')} successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
