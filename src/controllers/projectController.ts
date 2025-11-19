// src/controllers/projectController.ts
import { Response } from 'express';
import Project from '../models/Project';
import Team from '../models/Team';
import Task from '../models/Task';
import { AuthRequest } from '../middleware/auth';

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, teamId } = req.body;
    const userId = req.user?.userId;

    // Verify team exists and user owns it
    const team = await Team.findOne({ _id: teamId, createdBy: userId });
    if (!team) {
      res.status(404).json({ message: 'Team not found or access denied' });
      return;
    }

    const project = new Project({
      name,
      description,
      teamId,
      createdBy: userId,
      tasks: [],
    });

    await project.save();

    res.status(201).json({
      message: 'Project created successfully',
      project,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const projects = await Project.find({ createdBy: userId })
      .populate('teamId', 'name members')
      .sort({ createdAt: -1 });

    res.json({
      projects,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const project = await Project.findOne({ _id: id, createdBy: userId })
      .populate('teamId', 'name members')
      .populate('tasks');

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    res.json({
      project,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user?.userId;

    const project = await Project.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { name, description },
      { new: true, runValidators: true }
    ).populate('teamId', 'name members');

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    res.json({
      message: 'Project updated successfully',
      project,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const project = await Project.findOne({ _id: id, createdBy: userId });
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ projectId: id });

    // Delete the project
    await Project.findByIdAndDelete(id);

    res.json({
      message: 'Project and associated tasks deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const project = await Project.findOne({ _id: id, createdBy: userId });
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Get task statistics
    const tasks = await Task.find({ projectId: id });
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(task => task.status === 'Pending').length;
    const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
    const doneTasks = tasks.filter(task => task.status === 'Done').length;

    // Get team member workload for this project
    const team = await Team.findById(project.teamId);
    const memberWorkload = team?.members.map(member => {
      const memberTasks = tasks.filter(task => task.assignedMember === member.name);
      return {
        name: member.name,
        role: member.role,
        assignedTasks: memberTasks.length,
        capacity: member.capacity,
        isOverCapacity: memberTasks.length > member.capacity,
      };
    });

    res.json({
      stats: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        doneTasks,
        completionRate: totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0,
      },
      memberWorkload,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};