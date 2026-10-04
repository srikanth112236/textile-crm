import { Request, Response } from 'express';
import SalarySettings from '../models/SalarySettings';

export const getSalarySettings = async (req: Request, res: Response) => {
  try {
    let settings = await SalarySettings.findOne();
    if (!settings) {
      settings = new SalarySettings({
        workingDaysPerMonth: 26,
        mandatoryDailyHours: 8,
        monthlyPaidLeaves: 2,
        yearlyPaidLeaves: 24,
        overtimeRatePerHour: 250,
        hraPercentage: 20,
        pfDeductionPercentage: 12,
        shortHoursDeductionEnabled: true,
      });
      await settings.save();
    }
    return res.json(settings);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching salary settings', error: error.message });
  }
};

export const updateSalarySettings = async (req: Request, res: Response) => {
  try {
    let settings = await SalarySettings.findOne();
    if (!settings) {
      settings = new SalarySettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    return res.json({ message: 'Salary settings and rules updated successfully', settings });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating salary settings', error: error.message });
  }
};
