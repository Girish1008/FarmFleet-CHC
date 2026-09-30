import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { store } from '../services/db.js';
import { AuthJwtPayload } from '../types/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'farmfleet_super_secure_jwt_token_secret_chc_india_2026';

const loginSchema = z.object({
  emailOrPhone: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.parse(req.body);
      const identifier = parsed.emailOrPhone || parsed.email || parsed.phone;

      if (!identifier) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Email or phone number is required.',
          },
        });
        return;
      }

      const cleanIdentifier = identifier.trim().toLowerCase();

      // Look up user by email or phone
      const user = store.users.find(
        u => u.email.toLowerCase() === cleanIdentifier || (u.phone && u.phone === cleanIdentifier)
      );

      if (!user) {
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email/phone or password.',
          },
        });
        return;
      }

      const isPasswordValid = bcrypt.compareSync(parsed.password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email/phone or password.',
          },
        });
        return;
      }

      const payload: AuthJwtPayload = {
        userId: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          village: user.village,
          address: user.address,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const user = store.users.find(u => u.id === userId);
      if (!user) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'User not found.',
          },
        });
        return;
      }

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          village: user.village,
          address: user.address,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
