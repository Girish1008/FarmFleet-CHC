import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { store } from '../services/db.js';
import { Machine, MachineStatus } from '../types/index.js';
import crypto from 'crypto';

const machineSchema = z.object({
  name: z.string().min(1, 'Machine name is required'),
  type: z.string().min(1, 'Machine type is required'),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'BROKEN']).default('ACTIVE'),
  chclId: z.string().optional().nullable(),
});

export class MachinesController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, status } = req.query;
      let machines = [...store.machines];

      if (type) {
        machines = machines.filter(m => m.type.toUpperCase() === (type as string).toUpperCase());
      }
      if (status) {
        machines = machines.filter(m => m.status === status);
      }

      res.json({ data: machines });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = machineSchema.parse(req.body);

      const newMachine: Machine = {
        id: `mac-${crypto.randomUUID().slice(0, 8)}`,
        name: parsed.name,
        type: parsed.type.toUpperCase(),
        status: parsed.status as MachineStatus,
        chclId: parsed.chclId || 'chc-punjab-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.machines.push(newMachine);
      res.status(201).json({ data: newMachine });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const machine = store.machines.find(m => m.id === id);
      if (!machine) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Machine ${id} not found`,
          },
        });
        return;
      }

      const { name, type, status, chclId } = req.body;
      if (name) machine.name = name;
      if (type) machine.type = type.toUpperCase();
      if (status) machine.status = status as MachineStatus;
      if (chclId !== undefined) machine.chclId = chclId;
      machine.updatedAt = new Date();

      res.json({ data: machine });
    } catch (err) {
      next(err);
    }
  }
}
