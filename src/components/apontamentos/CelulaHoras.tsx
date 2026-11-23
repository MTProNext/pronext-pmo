import { useEffect, useState } from "react";
import { History, Lock, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Selo } from "@/components/comum/Selo";
import type { ApontamentoView } from "@/hooks/useApontamentos";
import { formatNumero } from "@/lib/format";
import { SELO_STATUS_APONTAMENTO } from "@/lib/selos";
import { cn } from "@/lib/utils";
import { EDITAVEL } from "./montarLinhas";

interface Props {
  apontamento?: ApontamentoView;
  /** Descrição da linha (para destacar quando o dia tem descrição própria). */
  descricaoLinha: string;
  destacarSemHoras: boolean;
  /** Retorna false se o valor foi recusado (a célula volta ao valor salvo). */
  onSalvarHoras: (texto: string) => boolean;
  onSalvarDescricao: (ap: ApontamentoView, descricao: string) => void;
  onHistorico: (ap: ApontamentoView) => void;
}

/** Célula da grade: horas do dia + popover com a descrição do dia, status e histórico. */
export function CelulaHoras({
  apontamento: ap,
  descricaoLinha,
  destacarSemHoras,
  onSalvarHoras,
  onSalvarDescricao,
  onHistorico,
}: Props) {
  const valorSalvo = ap ? formatNumero(Number(ap.horas)) : "";
  const [texto, setTexto] = useState(valorSalvo);
  const [descricao, setDescricao] = useState(ap?.descricao ?? "");
  const editavel = !ap || EDITAVEL.includes(ap.status);
  const descricaoPropria = !!ap && ap.descricao !== descricaoLinha;

  useEffect(() => setTexto(valorSalvo), [valorSalvo]);
  useEffect(() => setDescricao(ap?.descricao ?? ""), [ap?.descricao]);

  const salvar = () => {
    if (texto === valorSalvo) return;
    if (!onSalvarHoras(texto)) setTexto(valorSalvo);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-md border p-0.5",
        ap?.status === "devolvido" && "border-destructive",
        ap?.status === "enviado" && "bg-secondary",
        ap?.status === "aprovado" && "bg-muted",
        destacarSemHoras && !ap && "border-destructive/50 bg-destructive/5",
      )}
    >
      {editavel ? (
        <Input
          value={texto}
          inputMode="decimal"
          aria-label="Horas"
          placeholder="—"
          onChange={(e) => setTexto(e.target.value)}
          onBlur={salvar}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="h-8 w-14 border-0 px-1 text-center shadow-none focus-visible:ring-1"
        />
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex h-8 w-14 items-center justify-center gap-1 text-sm text-muted-foreground">
              <Lock className="h-3 w-3" />
              {valorSalvo}
            </span>
          </TooltipTrigger>
          <TooltipContent>{ap?.status === "aprovado" ? "Aprovado" : "Enviado para aprovação"}</TooltipContent>
        </Tooltip>
      )}
      {ap && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", descricaoPropria || ap.status === "devolvido" ? "text-primary" : "text-muted-foreground")}
              aria-label="Descrição e status do dia"
            >
              <MessageSquareText className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-3" align="end">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Descrição deste dia</span>
              <Selo mapa={SELO_STATUS_APONTAMENTO} valor={ap.status} />
            </div>
            {ap.status === "devolvido" && ap.motivo_devolucao && (
              <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">Devolvido: {ap.motivo_devolucao}</p>
            )}
            <Textarea value={descricao} rows={3} disabled={!editavel} onChange={(e) => setDescricao(e.target.value)} />
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={() => onHistorico(ap)}>
                <History className="mr-1 h-4 w-4" />
                Histórico
              </Button>
              {editavel && (
                <Button
                  size="sm"
                  disabled={descricao.trim().length < 10 || descricao === ap.descricao}
                  onClick={() => onSalvarDescricao(ap, descricao.trim())}
                >
                  Salvar descrição
                </Button>
              )}
            </div>
            {editavel && descricao.trim().length < 10 && (
              <p className="text-xs text-destructive">Mínimo de 10 caracteres.</p>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
