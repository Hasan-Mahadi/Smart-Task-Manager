
import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  teamId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  tasks: mongoose.Types.ObjectId[];
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tasks: [{
      type: Schema.Types.ObjectId,
      ref: 'Task',
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProject>('Project', projectSchema);