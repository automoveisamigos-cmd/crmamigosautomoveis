import cron from 'node-cron';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { IntegrationService } from './IntegrationService';
import { BackupService } from './BackupService';

const prisma = new PrismaClient();
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1coOsmpi55VVUpIJLQcDyNlZOMBeFCkJOCsz56-6g5AU/export?format=csv&gid=424572074';

export class AutoSyncService {
  
  static init() {
    console.log('[AUTO-SYNC] Iniciando serviço de vigilância da planilha...');
    
    // Executar a cada 5 minutos
    cron.schedule('*/5 * * * *', () => {
      this.sync();
    });

    // Executar uma vez ao iniciar o servidor
    this.sync();
  }

  static async resolveImageUrl(url: string): Promise<string> {
    if (url.includes('postimg.cc') && !url.includes('i.postimg.cc')) {
      try {
        const res = await axios.get(url, { timeout: 5000 });
        const html = res.data;
        const match = html.match(/<meta property="og:image" content="(.*?)"/);
        if (match && match[1]) {
          return match[1];
        }
      } catch (e) {
        console.error(`[AUTO-SYNC] Erro ao resolver imagem ${url}`);
      }
    }
    return url;
  }

  static async sync() {
    try {
      // Realizar backup de segurança antes de qualquer alteração
      await BackupService.generateBackup();

      console.log('[AUTO-SYNC] Sincronizando com Google Sheets...');
      const response = await axios.get(SHEET_URL);
      const csvContent = response.data;
      
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      });

      const platesInSheet = new Set();

      for (const row of records as any[]) {
        const placa = row.Placa;
        if (!placa) continue;
        
        platesInSheet.add(placa);

        const nomeBusca = `${row.Marca} ${row.MODELO}`.toLowerCase();
        const motoKeywords = ['fan', 'cg', 'biz', 'pop', 'titan', 'bros', 'xre', 'crosser', 'factor', 'ybr', 'fazer', 'lander', 'nmax', 'pcx', 'twister', 'moto'];
        const isMotoByName = motoKeywords.some(k => nomeBusca.includes(k));
        const isMotoByCC = row.Cilindrada && row.Cilindrada.toLowerCase().includes('cc');
        
        const categoria = isMotoByName || isMotoByCC ? 'Moto' : 'Carro';

        const ano = parseInt(row['Ano']) || parseInt(row['Ano ']) || new Date().getFullYear();
        const preco = parseFloat(row.Preço?.replace('R$', '').replace('.', '').replace(',', '.')) || 0;

        // Extrair e resolver fotos
        const rawFotos: string[] = [];
        Object.values(row).forEach((val: any) => {
          if (typeof val === 'string' && (val.includes('postimg.cc') || val.match(/\.(jpg|jpeg|png|webp)/i))) {
            const cleanUrl = val.replace(/\r?\n|\r/g, "").trim();
            if (cleanUrl.startsWith('http')) {
              rawFotos.push(cleanUrl);
            }
          }
        });

        const fotos: string[] = [];
        for (const url of rawFotos) {
          fotos.push(await this.resolveImageUrl(url));
        }

        // Buscar veículo existente pela placa
        const existing = await prisma.veiculo.findFirst({ where: { placa: placa } });

        let savedVeiculo;
        if (existing) {
          // Atualizar existente
          savedVeiculo = await prisma.veiculo.update({
            where: { id: existing.id },
            data: {
              marca: row.Marca,
              modelo: row.MODELO,
              ano: ano,
              preco: preco,
              cor: row.Cor,
              combustivel: row.Combustivel,
              km: parseInt(row.KM?.replace('.', '')) || 0,
              cilindrada: row.Cilindrada,
              proprietario: row.DONO || row.Propriedade,
              categoria: categoria,
              status: row.Status === 'Reservado' ? 'Reservado' : undefined,
              fotos: fotos.length > 0 ? JSON.stringify(fotos) : undefined
            }
          });
        } else {
          // Criar novo
          savedVeiculo = await prisma.veiculo.create({
            data: {
              placa: placa,
              marca: row.Marca,
              modelo: row.MODELO,
              ano: ano,
              preco: preco,
              cor: row.Cor,
              combustivel: row.Combustivel,
              km: parseInt(row.KM?.replace('.', '')) || 0,
              cilindrada: row.Cilindrada,
              proprietario: row.DONO || row.Propriedade,
              categoria: categoria,
              status: row.Status === 'Reservado' ? 'Reservado' : 'Disponivel',
              fotos: JSON.stringify(fotos)
            }
          });
        }

        // Disparar integração apenas se houver mudança relevante
        if (savedVeiculo.integra_mobiauto || savedVeiculo.integra_napista || savedVeiculo.integra_webmotors) {
          if (!existing || existing.preco !== savedVeiculo.preco || existing.status !== savedVeiculo.status) {
            await IntegrationService.syncVeiculo(savedVeiculo.id);
          }
        }
      }

      // Marcar como VENDIDO veículos que sumiram da planilha
      const allActiveVeiculos = await prisma.veiculo.findMany({
        where: { status: { not: 'Vendido' } }
      });

      for (const v of allActiveVeiculos) {
        if (v.placa && !platesInSheet.has(v.placa)) {
          console.log(`[AUTO-SYNC] Veículo ${v.placa} removido da planilha. Marcando como VENDIDO.`);
          await prisma.veiculo.update({
            where: { id: v.id },
            data: { status: 'Vendido' }
          });
          
          // Sincronizar o status de vendido com os portais
          if (v.integra_mobiauto || v.integra_napista || v.integra_webmotors) {
            await IntegrationService.syncVeiculo(v.id);
          }
        }
      }

      console.log('[AUTO-SYNC] Sincronização concluída com sucesso.');
    } catch (error: any) {
      console.error('[AUTO-SYNC] Erro ao sincronizar:', error.message);
    }
  }
}
