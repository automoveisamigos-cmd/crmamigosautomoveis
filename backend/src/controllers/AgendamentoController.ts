import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createAgendamento = async (req: Request, res: Response) => {
  try {
    const { lead_id, data, tipo } = req.body;
    
    const agendamento = await prisma.agendamento.create({
      data: {
        lead_id,
        data: new Date(data),
        tipo
      }
    });

    res.status(201).json(agendamento);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
