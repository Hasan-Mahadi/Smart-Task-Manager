
import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  action: string;
  details: string;
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    details: {
      type: String,
      required: [true, 'Details are required'],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  }
);

export default mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);