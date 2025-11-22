
import { Response } from 'express';
import Task from '../models/Task';
import Project from '../models/Project';
import Team from '../models/Team';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/auth';





export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, projectId, assignedMember, priority } = req.body;
    const userId = req.user?.userId;

    // Verify project exists and user has access
    const project = await Project.findOne({ _id: projectId, createdBy: userId });
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Get team to check member capacity
    const team = await Team.findById(project.teamId);
    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }

    // Find the assigned member
    const member = team.members.find(m => m.name === assignedMember);
    if (!member) {
      res.status(400).json({ message: 'Invalid team member' });
      return;
    }

    // Check if member is over capacity
    const isOverCapacity = member.currentTasks >= member.capacity;

    const task = new Task({
      title,
      description,
      projectId,
      assignedMember,
      priority: priority || 'Medium',
      status: 'Pending',
    });

    await task.save();

    // Add task to project
    project.tasks.push(task._id);
    await project.save();

    // Update member's task count
    member.currentTasks += 1;
    await team.save();

    res.status(201).json({
      message: 'Task created successfully',
      task,
      isOverCapacity,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { projectId, member } = req.query;

    let query: any = {};

    // If project filter is provided, verify user has access to that project
    if (projectId) {
      const project = await Project.findOne({ _id: projectId, createdBy: userId });
      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }
      query.projectId = projectId;
    }

    // If member filter is provided
    if (member) {
      query.assignedMember = member;
    }

    // Get tasks through projects that user owns
    const userProjects = await Project.find({ createdBy: userId }).select('_id');
    const projectIds = userProjects.map(p => p._id);

    query.projectId = { $in: projectIds };

    const tasks = await Task.find(query).populate('projectId', 'name');

    res.json({
      tasks,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.userId;

    // Verify user has access to the task's project
    const task = await Task.findById(id).populate<{ projectId: any }>('projectId');
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const project = await Project.findOne({ _id: task.projectId, createdBy: userId });
    if (!project) {
      res.status(404).json({ message: 'Access denied' });
      return;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Verify user has access to the task's project
    const project = await Project.findOne({ _id: task.projectId, createdBy: userId });
    if (!project) {
      res.status(404).json({ message: 'Access denied' });
      return;
    }

    // Remove task from project
    project.tasks = project.tasks.filter(taskId => taskId.toString() !== id);
    await project.save();

    // Update team member's task count
    const team = await Team.findById(project.teamId);
    if (team) {
      const member = team.members.find(m => m.name === task.assignedMember);
      if (member && member.currentTasks > 0) {
        member.currentTasks -= 1;
        await team.save();
      }
    }

    await Task.findByIdAndDelete(id);

    res.json({
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};






export const reassignTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const reassignmentLogs: string[] = [];

    // Get all user's projects
    const projects = await Project.find({ createdBy: userId }).populate('teamId');
    
    for (const project of projects) {
      const team = project.teamId as any;
      
      // Get all tasks for this project
      const tasks = await Task.find({ projectId: project._id });

      // Reset all member task counts
      team.members.forEach((member: any) => {
        member.currentTasks = 0;
      });

      // Count current assignments
      tasks.forEach(task => {
        const member = team.members.find((m: any) => m.name === task.assignedMember);
        if (member) {
          member.currentTasks += 1;
        }
      });

      // Identify overloaded members and available capacity
      const overloadedMembers = team.members.filter((m: any) => m.currentTasks > m.capacity);
      const availableMembers = team.members.filter((m: any) => m.currentTasks < m.capacity);

      for (const overloadedMember of overloadedMembers) {
        const excessTasks = overloadedMember.currentTasks - overloadedMember.capacity;
        
        // Get tasks assigned to this member (excluding high priority)
        const memberTasks = tasks
          .filter(task => 
            task.assignedMember === overloadedMember.name && 
            task.priority !== 'High'
          )
          .sort((a: any, b: any) => {
            const priorityOrder: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3 };
            return (priorityOrder[String(a.priority)] || 0) - (priorityOrder[String(b.priority)] || 0);
          });

        let reassignedCount = 0;

        for (const task of memberTasks) {
          if (reassignedCount >= excessTasks) break;

          // Find best available member
          const bestMember = availableMembers
            .filter((m: any) => m.currentTasks < m.capacity)
            .sort((a: any, b: any) => a.currentTasks - b.currentTasks)[0];

          if (bestMember) {
            // Reassign task
            const oldMember = task.assignedMember;
            task.assignedMember = bestMember.name;
            await task.save();

            // Update task counts
            overloadedMember.currentTasks -= 1;
            bestMember.currentTasks += 1;

            // Log the reassignment
            const logMessage = `Task "${task.title}" reassigned from ${oldMember} to ${bestMember.name}`;
            reassignmentLogs.push(logMessage);

            // Save to activity log
            await ActivityLog.create({
              action: 'TASK_REASSIGNED',
              details: logMessage,
              userId,
              timestamp: new Date(),
            });

            reassignedCount += 1;
          }
        }
      }

      await team.save();
    }

    res.json({
      message: 'Tasks reassigned successfully',
      reassignments: reassignmentLogs,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};




export const autoAssignTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.body;
    const userId = req.user?.userId;

    const project = await Project.findOne({ _id: projectId, createdBy: userId }).populate('teamId');
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const team = project.teamId as any;
    
    // Find member with least load
    const bestMember = team.members
      .filter((m: any) => m.currentTasks < m.capacity)
      .sort((a: any, b: any) => a.currentTasks - b.currentTasks)[0];

    if (!bestMember) {
      res.status(400).json({ message: 'No available team members with capacity' });
      return;
    }

    res.json({
      assignedMember: bestMember.name,
      currentTasks: bestMember.currentTasks,
      capacity: bestMember.capacity,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};