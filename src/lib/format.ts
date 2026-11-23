import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Converte "aaaa-mm-dd" (data do banco) em Date no fuso local, sem deslocar o dia. */
export const parseData = (data: Date | string) => (typeof data === "string" ? parseISO(data) : data);

/** Data no padrão dd/mm/aaaa. */
export const formatDate = (data: Date | string) => format(parseData(data), "dd/MM/yyyy", { locale: ptBR });

/** Date → "aaaa-mm-dd" para gravar no banco. */
export const paraDataISO = (data: Date) => format(data, "yyyy-MM-dd");

/** Soma dias a uma data "aaaa-mm-dd". */
export const addDaysISO = (data: string, dias: number) => paraDataISO(addDays(parseData(data), dias));

/** Período "dd/mm/aaaa a dd/mm/aaaa" (ou uma data só, se iguais; "desde ..." sem fim). */
export const formatPeriodo = (inicio: string, fim: string | null) => {
  if (!fim) return `desde ${formatDate(inicio)}`;
  if (inicio === fim) return formatDate(inicio);
  return `${formatDate(inicio)} a ${formatDate(fim)}`;
};

/** Horas em decimal com vírgula, ex.: 1,5h. */
export const formatHours = (hours: number) =>
  `${hours.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}h`;

/** Número com vírgula decimal, sem unidade (ex.: 20,8). Usado em grades compactas. */
export const formatNumero = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/** Lê horas digitadas ("1,5", "1.5", "2"). Vazio = null; inválido = NaN. */
export const lerHoras = (texto: string): number | null => {
  const limpo = texto.trim().replace(",", ".");
  if (limpo === "") return null;
  return /^\d+(\.\d+)?$/.test(limpo) ? Number(limpo) : Number.NaN;
};

/** Percentual, ex.: 85,8%. */
export const formatPct = (n: number | null) =>
  n === null ? "—" : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

/** Data e hora, ex.: 24/11/2026 09:10. */
export const formatDataHora = (instante: string) => format(new Date(instante), "dd/MM/yyyy HH:mm", { locale: ptBR });

/** Código da demanda, ex.: DEM-0007. */
export const formatCodigoDemanda = (codigo: number) => `DEM-${String(codigo).padStart(4, "0")}`;

/** Valor em reais, ex.: R$ 1.234,50. */
export const formatMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
