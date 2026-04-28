import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getVendedores = async (req: Request, res: Response) => {
  try {
    const vendedores = await prisma.usuario.findMany({
      select: { 
        id: true, 
        nome: true, 
        email: true, 
        role: true, 
        criado_em: true,
        tarefas: {
          include: {
            tarefa: {
              select: { id: true, titulo: true, concluida: true, vencimento: true }
            }
          }
        }
      }
    });

    // Formatar para o frontend
    const formatted = vendedores.map(v => ({
      ...v,
      tarefas: v.tarefas.map(tc => tc.tarefa)
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createVendedor = async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, role } = req.body;
    const hashedPassword = await bcrypt.hash(senha, 10);

    const vendedor = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: hashedPassword,
        role: role || 'Vendedor'
      }
    });

    const { senha: _, ...result } = vendedor;
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Email já cadastrado ou erro interno" });
  }
};

export const deleteVendedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.usuario.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateVendedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, role } = req.body;
    
    const data: any = { nome, email };
    if (role) {
      data.role = role;
    }
    if (senha) {
      data.senha = await bcrypt.hash(senha, 10);
    }

    const vendedor = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data
    });

    const { senha: _, ...result } = vendedor;
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
