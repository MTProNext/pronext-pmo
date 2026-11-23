import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Converte "aaaa-mm-dd" (data do banco) em Date no fuso local, sem deslocar o dia. */
export const parseData = (data: Date | string) => (typeof data === "string" ? parseISO(data) : data);

/** Data no padrão dd/mm/aaaa. */
export const formatDate = (data: Date | string) => format(parseData(data), "dd/MM/yyyy", { locale: ptBR });

/** Date → "aaaa-mm-dd" para gravar no banco. */
export const paraDataISO = (data: Date) => format(data, "yyyy-MM-dd");

/** Período "dd/mm/aaaa a dd/mm/aaaa" (ou uma data só, se iguais; "desde ..." sem fim). */
export const formatPeriodo = (inicio: string, fim: string | null) => {
  if (!fim) return `desde ${formatDate(inicio)}`;
  if (inicio === fim) return formatDate(inicio);
  return `${formatDate(inicio)} a ${formatDate(fim)}`;
};

/** Horas em decimal com vírgula, ex.: 1,5h. */
export const formatHours = (hours: number) =>
  `${hours.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}h`;

/** Código da demanda, ex.: DEM-0007. */
export const formatCodigoDemanda = (codigo: number) => `DEM-${String(codigo).padStart(4, "0")}`;

/** Valor em reais, ex.: R$ 1.234,50. */
export const formatMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
