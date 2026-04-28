import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'amigos-auto-super-secret-key-123';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const token = jwt.sign({ id: usuario.id, email: usuario.email, role: usuario.role }, SECRET_KEY, {
      expiresIn: '7d',
    });

    return res.status(200).json({
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const setupAdmin = async (req: Request, res: Response) => {
  try {
    const { email, senha, nome } = req.body;
    
    // Check if any user already exists (only allow this if DB is empty to prevent unauthorized admin creation)
    const count = await prisma.usuario.count();
    if (count > 0) {
      return res.status(403).json({ error: "O administrador inicial já foi criado. Para criar mais usuários, faça login primeiro." });
    }

    if (!email || !senha || !nome) {
      return res.status(400).json({ error: "E-mail, senha e nome são obrigatórios." });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const novoUsuario = await prisma.usuario.create({
      data: {
        email,
        senha: senhaHash,
        nome,
        role: "Admin"
      }
    });

    return res.status(201).json({ message: "Administrador criado com sucesso!", usuario: { email: novoUsuario.email, nome: novoUsuario.nome } });
  } catch (error) {
    console.error("Erro no setupAdmin:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};
