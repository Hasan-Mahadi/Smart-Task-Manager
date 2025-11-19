// src/models/Team.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ITeamMember {
  name: string;
  role: string;
  capacity: number;
  currentTasks: number;
}

export interface ITeam extends Document {
  name: string;
  createdBy: mongoose.Types.ObjectId;
  members: ITeamMember[];
}

const teamMemberSchema = new Schema<ITeamMember>({
  name: {
    type: String,
    required: [true, 'Team member name is required'],
    trim: true,
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true,
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 0,
    max: 5,
    default: 3,
  },
  currentTasks: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [teamMemberSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITeam>('Team', teamSchema);