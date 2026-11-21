import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { ImportJob } from '../models/ImportJob';
import { getServerFeatureFlags } from '../config/featureFlags';
import redisClient from '../config/redis';

const MONGO_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const getSystemHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [products, users, orders, importTotal, importAgg, recentImports] = await Promise.all([
      Product.countDocuments({}),
      User.countDocuments({}),
      Order.countDocuments({}),
      ImportJob.countDocuments({}),
      ImportJob.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      ImportJob.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .select('fileName status mode totalRows created updated failed summary createdAt completedAt')
        .lean(),
    ]);

    const importStatuses: Record<string, number> = {};
    for (const row of importAgg as any[]) importStatuses[row._id || 'unknown'] = row.count;
    const memory = process.memoryUsage();

    res.status(200).json({
      success: true,
      data: {
        application: {
          status: 'ok',
          environment: process.env.NODE_ENV || 'development',
          uptimeSeconds: Math.round(process.uptime()),
          node: process.version,
          memoryMb: {
            rss: Math.round(memory.rss / 1024 / 1024),
            heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
          },
        },
        services: {
          mongodb: MONGO_STATES[mongoose.connection.readyState] || 'unknown',
          redis: redisClient?.status || 'unknown',
          elasticsearch:
            process.env.ELASTICSEARCH_ENABLED === 'false'
              ? 'disabled'
              : process.env.ELASTICSEARCH_URL
                ? 'configured'
                : 'not configured',
        },
        counts: {
          products,
          users,
          orders,
          imports: importTotal,
        },
        importStatuses,
        recentImports: (recentImports as any[]).map((job) => ({
          jobId: String(job._id),
          fileName: job.fileName,
          status: job.status,
          mode: job.mode,
          totalRows: job.totalRows,
          created: job.created,
          updated: job.updated,
          failed: job.failed,
          errorRows: job.summary?.errorRows || 0,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
        })),
        featureFlags: getServerFeatureFlags(),
      },
    });
  } catch (error: any) {
    console.error('System health error:', error);
    res.status(500).json({ error: 'Could not read system health.' });
  }
};
