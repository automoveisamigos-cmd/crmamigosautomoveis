export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatDate = (date: string | Date): string =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));

export const scoreLabel = (score: number): { label: string; color: string } => {
  if (score >= 80) return { label: 'Quente', color: 'text-red-500' };
  if (score >= 50) return { label: 'Morno', color: 'text-amber-500' };
  return { label: 'Frio', color: 'text-blue-400' };
};

export const isForaDeHorario = (): boolean => {
  const h = new Date().getHours();
  return h >= 18 || h < 8;
};
