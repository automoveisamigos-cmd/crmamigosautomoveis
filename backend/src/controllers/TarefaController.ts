import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const getTarefas = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const where: any = {};
    
    // Se não for admin, vê apenas tarefas onde é um dos colaboradores
    if (user.role !== 'Admin') {
      where.colaboradores = {
        some: {
          usuario_id: user.id
        }
      };
    }

    const tarefas = await prisma.tarefa.findMany({
      where,
      include: { 
        lead: true,
        colaboradores: {
          include: {
            usuario: { select: { id: true, nome: true } }
          }
        }
      },
      orderBy: { vencimento: 'asc' }
    });

    // Formatar para facilitar o frontend (achatar colaboradores)
    const formatted = tarefas.map(t => ({
      ...t,
      colaboradores: t.colaboradores.map(c => c.usuario)
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createTarefa = async (req: AuthRequest, res: Response) => {
  try {
    const { titulo, descricao, vencimento, lead_id, colaboradores_ids, status } = req.body;
    
    // IDs dos colaboradores (pode ser um array ou um único ID que converteremos em array)
    let ids: number[] = [];
    if (Array.isArray(colaboradores_ids)) {
      ids = colaboradores_ids.map((id: any) => parseInt(id));
    } else if (colaboradores_ids) {
      ids = [parseInt(colaboradores_ids)];
    } else {
      // Default para o criador se nenhum for passado
      ids = [req.user.id];
    }

    const tarefa = await prisma.tarefa.create({
      data: {
        titulo,
        descricao,
        vencimento: new Date(vencimento),
        lead_id: lead_id ? parseInt(lead_id) : null,
        status: status || 'Pendente',
        colaboradores: {
          create: ids.map(id => ({ usuario_id: id }))
        }
      },
      include: {
        colaboradores: {
          include: { usuario: { select: { id: true, nome: true } } }
        }
      }
    });

    res.status(201).json(tarefa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleTarefa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const current = await prisma.tarefa.findUnique({ where: { id: parseInt(id) } });
    
    const isConcluido = !current?.concluida;

    const tarefa = await prisma.tarefa.update({
      where: { id: parseInt(id) },
      data: { 
        concluida: isConcluido,
        status: isConcluido ? 'Concluido' : 'Pendente'
      }
    });

    res.status(200).json(tarefa);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteTarefa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.tarefa.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTarefa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, vencimento, lead_id, concluida, status, colaboradores_ids } = req.body;

    // Atualizar dados básicos
    const data: any = {
      titulo,
      descricao,
      vencimento: vencimento ? new Date(vencimento) : undefined,
      lead_id: lead_id ? parseInt(lead_id) : undefined,
      concluida,
      status
    };

    // Se concluiu via status, marcar concluida
    if (status === 'Concluido') data.concluida = true;
    if (status === 'Pendente') data.concluida = false;

    // Atualizar colaboradores se fornecidos
    if (colaboradores_ids) {
      let ids: number[] = Array.isArray(colaboradores_ids) ? colaboradores_ids.map(Number) : [Number(colaboradores_ids)];
      
      // Limpar antigos e adicionar novos
      await prisma.tarefaColaborador.deleteMany({ where: { tarefa_id: parseInt(id) } });
      data.colaboradores = {
        create: ids.map(uid => ({ usuario_id: uid }))
      };
    }

    const tarefa = await prisma.tarefa.update({
      where: { id: parseInt(id) },
      data
    });

    res.status(200).json(tarefa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
