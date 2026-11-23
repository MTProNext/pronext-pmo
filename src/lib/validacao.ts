import { z } from "zod";

/**
 * Mensagens padrão do zod em pt-BR. Importado uma vez em main.tsx.
 * Mensagens específicas passadas nos esquemas (ex.: .min(1, "Informe o título."))
 * continuam tendo prioridade.
 */
const mapaErros: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined" || issue.received === "null") {
        return { message: "Campo obrigatório." };
      }
      if (issue.expected === "number") return { message: "Informe um número válido." };
      if (issue.expected === "date") return { message: "Informe uma data válida." };
      return { message: "Valor inválido." };
    case z.ZodIssueCode.too_small:
      if (issue.type === "string") {
        return {
          message:
            issue.minimum === 1
              ? "Campo obrigatório."
              : `Informe pelo menos ${issue.minimum} caracteres.`,
        };
      }
      if (issue.type === "number") {
        return {
          message: issue.inclusive
            ? `O valor deve ser maior ou igual a ${issue.minimum}.`
            : `O valor deve ser maior que ${issue.minimum}.`,
        };
      }
      if (issue.type === "array") return { message: `Selecione pelo menos ${issue.minimum} item(ns).` };
      return { message: "Valor abaixo do mínimo." };
    case z.ZodIssueCode.too_big:
      if (issue.type === "string") return { message: `Use no máximo ${issue.maximum} caracteres.` };
      if (issue.type === "number") {
        return {
          message: issue.inclusive
            ? `O valor deve ser menor ou igual a ${issue.maximum}.`
            : `O valor deve ser menor que ${issue.maximum}.`,
        };
      }
      return { message: "Valor acima do máximo." };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email") return { message: "E-mail inválido." };
      if (issue.validation === "url") return { message: "URL inválida." };
      return { message: "Formato inválido." };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: "Selecione uma opção válida." };
    case z.ZodIssueCode.invalid_date:
      return { message: "Data inválida." };
    default:
      return { message: ctx.defaultError };
  }
};

z.setErrorMap(mapaErros);

/** z.enum a partir de um mapa de rótulos (ex.: TIPO_CONTRATO_LABEL), sem repetir os valores. */
export const enumDe = <T extends string>(rotulos: Record<T, string>) =>
  z.enum(Object.keys(rotulos) as [T, ...T[]]);
