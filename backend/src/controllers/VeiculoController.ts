import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { IntegrationService } from '../services/IntegrationService';

const prisma = new PrismaClient();

export const getEstoque = async (req: Request, res: Response) => {
  try {
    const { categoria } = req.query;
    
    const whereClause: any = {};
    if (categoria) {
      whereClause.categoria = String(categoria);
    }

    const veiculos = await prisma.veiculo.findMany({
      where: whereClause,
      orderBy: { data_entrada: 'desc' }
    });
    res.status(200).json(veiculos);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createVeiculo = async (req: Request, res: Response) => {
  try {
    const { 
      categoria, marca, modelo, ano, preco, fipe, demanda, status, 
      tipo_estoque, placa, km, cor, combustivel, cambio, observacoes, 
      fotos, cilindrada, proprietario,
      integra_webmotors, integra_mobiauto, integra_napista,
      webmotors_id, mobiauto_id, napista_id
    } = req.body;
    
    const veiculo = await prisma.veiculo.create({
      data: {
        categoria: categoria || "Carro",
        marca,
        modelo,
        ano: parseInt(ano),
        preco: parseFloat(preco),
        fipe: fipe ? parseFloat(fipe) : null,
        demanda: demanda || "Media",
        status: status || "Disponivel",
        tipo_estoque: tipo_estoque || "Proprio",
        placa,
        km: km ? parseInt(km) : null,
        cor,
        combustivel,
        cambio,
        cilindrada,
        proprietario,
        observacoes,
        fotos, // String JSON vinda do frontend
        integra_webmotors: !!integra_webmotors,
        integra_mobiauto: !!integra_mobiauto,
        integra_napista: !!integra_napista,
        webmotors_id,
        mobiauto_id,
        napista_id,
        data_entrada: new Date()
      }
    });

    // Disparar sincronização em segundo plano
    IntegrationService.syncVeiculo(veiculo.id).catch(err => console.error("Erro na integração:", err));

    res.status(201).json(veiculo);
  } catch (error) {
    console.error("Erro ao criar veiculo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateVeiculo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const veiculo = await prisma.veiculo.update({
      where: { id: parseInt(id) },
      data: {
        ...data,
        ano: data.ano ? parseInt(data.ano) : undefined,
        preco: data.preco ? parseFloat(data.preco) : undefined,
        fipe: data.fipe ? parseFloat(data.fipe) : undefined,
        km: data.km ? parseInt(data.km) : undefined,
      }
    });

    // Atualizar portais
    IntegrationService.syncVeiculo(veiculo.id).catch(err => console.error("Erro na integração:", err));

    res.status(200).json(veiculo);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteVeiculo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.veiculo.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchVeiculos = async (req: Request, res: Response) => {
  const { query } = req.query;
  try {
    const veiculos = await prisma.veiculo.findMany({
      where: {
        OR: [
          { marca: { contains: String(query) } },
          { modelo: { contains: String(query) } },
          { placa: { contains: String(query) } }
        ]
      },
      take: 10
    });
    res.status(200).json(veiculos);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStockStats = async (req: Request, res: Response) => {
  try {
    const veiculos = await prisma.veiculo.findMany({
      where: { status: { not: 'Vendido' } } // Foco no estoque atual
    });
    
    const now = new Date().getTime();
    const totalValue = veiculos.reduce((sum, v) => sum + v.preco, 0);
    const avgDays = veiculos.length > 0 
      ? veiculos.reduce((sum, v) => sum + (now - new Date(v.data_entrada).getTime()) / (1000 * 60 * 60 * 24), 0) / veiculos.length
      : 0;
    
    const statusCounts = {
      disponivel: veiculos.filter(v => v.status === 'Disponivel').length,
      reservado: veiculos.filter(v => v.status === 'Reservado').length
    };

    const highDemand = veiculos.filter(v => v.demanda === 'Alta').length;
    
    const totalFipe = veiculos.reduce((sum, v) => sum + (v.fipe || v.preco), 0);
    const marginPotential = totalValue - totalFipe;

    res.status(200).json({
      capital: totalValue,
      giroMedio: Math.round(avgDays),
      disponibilidade: veiculos.length > 0 ? Math.round((statusCounts.disponivel / veiculos.length) * 100) : 0,
      margemTotal: marginPotential,
      totalCars: veiculos.length
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
