import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';

const authService = new AuthService();

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const tokens = await authService.register(value);
    
    res.status(201).json({
      message: 'User registered successfully',
      tokens
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const tokens = await authService.login(value);
    
    res.json({
      message: 'Login successful',
      tokens
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = refreshTokenSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const tokens = await authService.refreshToken(value.refreshToken);
    
    res.json({
      message: 'Token refreshed successfully',
      tokens
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    await authService.logout(req.user.id);
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const profile = await authService.getProfile(req.user.id);
    
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};