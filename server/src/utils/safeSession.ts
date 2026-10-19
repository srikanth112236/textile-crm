import mongoose, { ClientSession } from 'mongoose';

/**
 * Check if current MongoDB connection supports transactions (ReplicaSet or Mongos)
 */
export function supportsTransactions(): boolean {
  try {
    const topologyType = (mongoose.connection.client as any)?.topology?.description?.type;
    const isReplicaSet = Boolean(
      mongoose.connection.replicaSet ||
      (topologyType && topologyType.toLowerCase().includes('replicaset')) ||
      (topologyType && topologyType.toLowerCase().includes('sharded'))
    );
    return isReplicaSet;
  } catch (err) {
    return false;
  }
}

/**
 * Execute operations safely within a transaction when running on a MongoDB ReplicaSet,
 * or fall back gracefully to a non-transactional execution on Standalone MongoDB instances.
 */
export async function runSafeTransaction<T>(
  callback: (session?: ClientSession) => Promise<T>
): Promise<T> {
  let session: ClientSession | undefined = undefined;

  if (supportsTransactions()) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (err) {
      session = undefined;
    }
  }

  try {
    const result = await callback(session);
    if (session && session.inTransaction()) {
      await session.commitTransaction();
    }
    return result;
  } catch (error) {
    if (session && session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        console.error('Error aborting transaction:', abortErr);
      }
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}
