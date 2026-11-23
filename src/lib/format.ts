import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Data no padrão dd/mm/aaaa. */
export const formatDate = (date: Date | string) =>
  format(typeof date === "string" ? new Date(date) : date, "dd/MM/yyyy", { locale: ptBR });

/** Horas em decimal com vírgula, ex.: 1,5h. */
export const formatHours = (hours: number) =>
  `${hours.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}h`;
