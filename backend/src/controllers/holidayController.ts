import { Request, Response } from 'express';
import Holiday from '../models/Holiday';

export const getHolidays = async (req: Request, res: Response): Promise<void> => {
  try {
    const holidays = await Holiday.find({}).sort({ date: 1 });
    res.json({ success: true, holidays });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, date, type, isPaid } = req.body;
    if (!name || !date) {
      res.status(400).json({ success: false, message: 'Name and Date are required' });
      return;
    }

    let holiday = await Holiday.findOne({ date });
    if (holiday) {
      holiday.name = name;
      holiday.type = type || holiday.type;
      holiday.isPaid = isPaid !== undefined ? isPaid : holiday.isPaid;
      await holiday.save();
    } else {
      holiday = await Holiday.create({ name, date, type: type || 'festive', isPaid: isPaid !== undefined ? isPaid : true });
    }

    res.json({ success: true, holiday, message: 'Holiday saved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Holiday.findByIdAndDelete(id);
    res.json({ success: true, message: 'Holiday removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
