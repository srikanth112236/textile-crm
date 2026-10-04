import { Response } from 'express';
import Attendance from '../models/Attendance';
import Employee from '../models/Employee';
import { AuthRequest } from '../middleware/auth';

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const clockIn = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'Only registered employees can clock in' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const todayStr = getTodayDateString();
    let record = await Attendance.findOne({ employee: employee._id, date: todayStr });

    const now = new Date();

    if (!record) {
      record = new Attendance({
        employee: employee._id,
        date: todayStr,
        clockIn: now,
        mandatoryHours: employee.mandatoryWorkingHours || 8,
        status: 'present',
        logs: [{ clockIn: now, durationHours: 0 }],
      });
    } else {
      // Check if there is an active un-closed session
      const activeSession = record.logs.find((log) => !log.clockOut);
      if (activeSession) {
        return res.status(400).json({
          message: `Already clocked in at ${new Date(activeSession.clockIn).toLocaleTimeString()}. Please clock out first.`,
          attendance: record,
        });
      }

      // Add a new session
      record.clockIn = record.clockIn || now;
      record.clockOut = undefined; // Reset overall clockOut since active session opened
      record.logs.push({ clockIn: now, durationHours: 0 });
      record.status = 'present';
    }

    await record.save();

    return res.json({
      message: `Clocked in successfully at ${now.toLocaleTimeString()}`,
      attendance: record,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error during clock in', error: error.message });
  }
};

export const clockOut = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'Only registered employees can clock out' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const todayStr = getTodayDateString();
    const record = await Attendance.findOne({ employee: employee._id, date: todayStr });

    if (!record || record.logs.length === 0) {
      return res.status(400).json({ message: 'You have not clocked in today yet' });
    }

    // Find the latest active session without clockOut
    const activeSessionIndex = record.logs.findIndex((log) => !log.clockOut);
    if (activeSessionIndex === -1) {
      return res.status(400).json({
        message: 'All sessions are clocked out. Click "Clock In" to start a new work session.',
        attendance: record,
      });
    }

    const clockOutTime = new Date();
    const activeSession = record.logs[activeSessionIndex];
    const diffMs = clockOutTime.getTime() - new Date(activeSession.clockIn).getTime();
    const sessionHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    activeSession.clockOut = clockOutTime;
    activeSession.durationHours = sessionHours;

    // Recalculate total hours across all completed sessions today
    const totalHoursToday = record.logs.reduce((sum, item) => sum + (item.durationHours || 0), 0);
    const mandatoryTarget = employee.mandatoryWorkingHours || 8;
    const metMandatoryHours = totalHoursToday >= mandatoryTarget;

    record.clockOut = clockOutTime;
    record.totalHours = parseFloat(totalHoursToday.toFixed(2));
    record.mandatoryHours = mandatoryTarget;
    record.metMandatoryHours = metMandatoryHours;

    await record.save();

    let warningMessage = null;
    if (!metMandatoryHours) {
      warningMessage = `Warning: You have completed ${record.totalHours} total hours today, which is less than your mandatory working target of ${mandatoryTarget} hours!`;
    }

    return res.json({
      message: `Clocked out session at ${clockOutTime.toLocaleTimeString()}. Total today: ${record.totalHours} hrs`,
      totalHours: record.totalHours,
      mandatoryTarget,
      metMandatoryHours,
      warningMessage,
      attendance: record,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error during clock out', error: error.message });
  }
};

export const getTodayStatus = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID missing' });
    }

    const employee = await Employee.findById(employeeId);
    const todayStr = getTodayDateString();
    const record = await Attendance.findOne({ employee: employeeId, date: todayStr });

    const activeSession = record?.logs?.find((log) => !log.clockOut);

    return res.json({
      date: todayStr,
      clockIn: activeSession ? activeSession.clockIn : record?.clockIn || null,
      clockOut: record?.clockOut || null,
      isCurrentlyClockedIn: !!activeSession,
      totalHours: record?.totalHours || 0,
      mandatoryHours: employee?.mandatoryWorkingHours || 8,
      metMandatoryHours: record?.metMandatoryHours || false,
      status: record?.status || 'absent',
      logs: record?.logs || [],
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching today status', error: error.message });
  }
};

export const getEmployeeAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.user?.role === 'employee' ? req.user.employeeId : req.query.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID required' });
    }

    const records = await Attendance.find({ employee: employeeId }).sort({ date: -1 });
    return res.json(records);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching attendance logs', error: error.message });
  }
};

export const getAllAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const filterDate = (req.query.date as string) || getTodayDateString();

    const records = await Attendance.find({ date: filterDate }).populate('employee');
    return res.json({ date: filterDate, records });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching all attendance', error: error.message });
  }
};
