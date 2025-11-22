export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeamMember {
  name: string;
  role: string;
  capacity: number; // 0-5
  currentTasks: number;
}

export interface ITeam {
  _id: string;
  name: string;
  createdBy: string;
  members: ITeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Done';

export interface ITask {
  _id: string;
  title: string;
  description: string;
  projectId: string;
  assignedMember: string; // team member name
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject {
  _id: string;
  name: string;
  description: string;
  teamId: string;
  createdBy: string;
  tasks: string[]; // task IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityLog {
  _id: string;
  action: string;
  details: string;
  timestamp: Date;
  userId: string;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}