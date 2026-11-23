import { addDays, addWeeks, format, isValid, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { paraDataISO, parseData } from "./format";

/** Segunda-feira da semana da data, em "aaaa-mm-dd". */
export const segundaDaSemana = (data: Date | string) =>
  paraDataISO(startOfWeek(parseData(data), { weekStartsOn: 1 }));

/** Segunda-feira da semana atual (fuso do navegador). */
export const inicioSemanaAtual = () => segundaDaSemana(new Date());

/** Desloca a semana em n semanas (negativo = anteriores). */
export const deslocarSemana = (inicio: string, n: number) => paraDataISO(addWeeks(parseData(inicio), n));

/** "23/11 a 27/11/2026" */
export const formatSemana = (inicio: string) => {
  const ini = parseData(inicio);
  const fim = addDays(ini, 4);
  return `${format(ini, "dd/MM", { locale: ptBR })} a ${format(fim, "dd/MM/yyyy", { locale: ptBR })}`;
};

/** O texto é uma data válida e cai numa segunda-feira? */
export const ehSegunda = (inicio: string | undefined): inicio is string =>
  !!inicio &&
  /^\d{4}-\d{2}-\d{2}$/.test(inicio) &&
  isValid(parseData(inicio)) &&
  segundaDaSemana(inicio) === inicio;
