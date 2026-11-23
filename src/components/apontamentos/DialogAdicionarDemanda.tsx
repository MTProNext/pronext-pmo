import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDemandas } from "@/hooks/useDemandas";
import { formatCodigoDemanda } from "@/lib/format";
import type { DemandaLinha } from "./montarLinhas";

interface Props {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  /** Demandas que já estão na grade (ficam fora da lista). */
  jaNaGrade: Set<string>;
  onAdicionar: (demanda: DemandaLinha) => void;
}

/** Inclui na grade uma demanda que não estava planejada para a pessoa. */
export function DialogAdicionarDemanda({ aberto, onAbertoChange, jaNaGrade, onAdicionar }: Props) {
  const { data: demandas } = useDemandas();
  const [escolhida, setEscolhida] = useState<string>();

  const opcoes = (demandas ?? []).filter((d) => d.status !== "cancelada" && !jaNaGrade.has(d.id));

  const adicionar = () => {
    const d = opcoes.find((o) => o.id === escolhida);
    if (!d) return;
    onAdicionar({
      id: d.id,
      codigo: d.codigo,
      titulo: d.titulo,
      tipo: d.tipo,
      cliente_id: d.cliente_id,
      origem: d.cliente ? [d.cliente.nome, d.projeto?.nome].filter(Boolean).join(" · ") : "Interno",
    });
    setEscolhida(undefined);
    onAbertoChange(false);
  };

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar demanda</DialogTitle>
          <DialogDescription>
            Horas em demanda sem alocação para você nesta semana aparecem para o líder como “não planejadas”.
          </DialogDescription>
        </DialogHeader>
        <Select value={escolhida} onValueChange={setEscolhida}>
          <SelectTrigger aria-label="Demanda">
            <SelectValue placeholder="Selecione a demanda" />
          </SelectTrigger>
          <SelectContent>
            {opcoes.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {formatCodigoDemanda(d.codigo)} · {d.titulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onAbertoChange(false)}>
            Cancelar
          </Button>
          <Button onClick={adicionar} disabled={!escolhida}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
