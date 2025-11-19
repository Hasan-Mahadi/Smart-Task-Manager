// src/controllers/dashboardController.ts
import { Response } from 'express';
import Project from '../models/Project';
import Task from '../models/Task';
import Team from '../models/Team';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    // Get total projects
    const totalProjects = await Project.countDocuments({ createdBy: userId });

    // Get total tasks across all projects
    const userProjects = await Project.find({ createdBy: userId }).select('_id');
    const projectIds = userProjects.map(p => p._id);
    const totalTasks = await Task.countDocuments({ projectId: { $in: projectIds } });

    // Get team summary with workload
    const teams = await Team.find({ createdBy: userId });
    const teamSummary = await Promise.all(
      teams.map(async (team) => {
        const teamProjects = await Project.find({ teamId: team._id }).select('_id');
        const teamProjectIds = teamProjects.map(p => p._id);
        const teamTasks = await Task.find({ projectId: { $in: teamProjectIds } });

        const memberWorkload = team.members.map(member => {
          const memberTasks = teamTasks.filter(task => task.assignedMember === member.name);
          return {
            name: member.name,
            role: member.role,
            currentTasks: memberTasks.length,
            capacity: member.capacity,
            isOverCapacity: memberTasks.length > member.capacity,
          };
        });

        return {
          teamId: team._id,
          teamName: team.name,
          members: memberWorkload,
        };
      })
    );

    // Get recent activity logs
    const recentLogs = await ActivityLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('action details timestamp');

    res.json({
      totalProjects,
      totalTasks,
      teamSummary,
      recentActivity: recentLogs,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};