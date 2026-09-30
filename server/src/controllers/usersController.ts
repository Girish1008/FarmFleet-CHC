import { Request, Response, NextFunction } from 'express';
import { store } from '../services/db.js';
import { Role } from '../types/index.js';

export class UsersController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role } = req.query;
      let users = store.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        village: u.village,
        address: u.address,
        createdAt: u.createdAt,
      }));

      if (role) {
        users = users.filter(u => u.role === role);
      }

      res.json({ data: users });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = store.users.find(u => u.id === id);
      if (!user) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `User ${id} not found`,
          },
        });
        return;
      }

      const { name, phone, role, village, address } = req.body;
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (role) user.role = role as Role;
      if (village !== undefined) user.village = village;
      if (address !== undefined) user.address = address;
      user.updatedAt = new Date();

      res.json({
        data: {
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
