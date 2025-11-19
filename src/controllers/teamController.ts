// src/controllers/teamController.ts
import { Response } from 'express';
import Team from '../models/Team';
import { AuthRequest } from '../middleware/auth';

export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, members } = req.body;
    const userId = req.user?.userId;

    const team = new Team({
      name,
      members: members || [],
      createdBy: userId,
    });

    await team.save();

    res.status(201).json({
      message: 'Team created successfully',
      team,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const teams = await Team.find({ createdBy: userId });

    res.json({
      teams,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const team = await Team.findOne({ _id: id, createdBy: userId });
    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }

    res.json({
      team,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, members } = req.body;
    const userId = req.user?.userId;

    const team = await Team.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { name, members },
      { new: true, runValidators: true }
    );

    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }

    res.json({
      message: 'Team updated successfully',
      team,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const team = await Team.findOneAndDelete({ _id: id, createdBy: userId });
    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }

    res.json({
      message: 'Team deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};