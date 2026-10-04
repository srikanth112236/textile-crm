import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notifications = await Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(20);
    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

    return res.json({ notifications, unreadCount });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (id === 'all') {
      await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
      return res.json({ message: 'All notifications marked as read' });
    }

    const notification = await Notification.findOneAndUpdate({ _id: id, recipient: userId }, { isRead: true }, { new: true });
    return res.json({ message: 'Notification marked as read', notification });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
};
