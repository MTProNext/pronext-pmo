import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CampoSwitch, CampoTexto } from "@/components/comum/CamposFormulario";
import { FormularioDialog } from "@/components/comum/FormularioDialog";
import { SecaoCard } from "@/components/comum/SecaoCard";
import { TabelaDados } from "@/components/comum/TabelaDados";
import { useCategorias, useSalvarCategoria, type CategoriaHora } from "@/hooks/useCategorias";

const esquema = z.object({
  nome: z.string().trim().min(3, "Informe o nome da categoria."),
  fora_do_planejamento: z.boolean(),
});
type Dados = z.infer<typeof esquema>;

/** Categorias de horas: ativar/desativar e marcar como fora do planejamento. */
export function CardCategorias({ podeEditar }: { podeEditar: boolean }) {
  const { data, isLoading } = useCategorias();
  const salvar = useSalvarCategoria();
  const [nova, setNova] = useState(false);
  const form = useForm<Dados>({ resolver: zodResolver(esquema) });

  useEffect(() => {
    if (nova) form.reset({ nome: "", fora_do_planejamento: false });
  }, [nova, form]);

  const alternar = (c: CategoriaHora, campo: "ativo" | "fora_do_planejamento", valor: boolean) =>
    salvar.mutate({ id: c.id, dados: { nome: c.nome, ativo: c.ativo, fora_do_planejamento: c.fora_do_planejamento, [campo]: valor } });

  return (
    <SecaoCard
      titulo="Categorias de horas"
      descricao="Horas de categorias “fora do planejamento” (ex.: gestão e reuniões dos líderes) nunca contam como não planejadas."
      acoes={
        podeEditar && (
          <Button variant="outline" onClick={() => setNova(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova categoria
          </Button>
        )
      }
    >
      <TabelaDados
        dados={data}
        carregando={isLoading}
        chaveLinha={(c) => c.id}
        colunas={[
          { chave: "nome", titulo: "Categoria", celula: (c) => <span className="font-medium">{c.nome}</span> },
          {
            chave: "fora",
            titulo: "Fora do planejamento",
            celula: (c) => (
              <Switch checked={c.fora_do_planejamento} disabled={!podeEditar}
                onCheckedChange={(v) => alternar(c, "fora_do_planejamento", v)} aria-label="Fora do planejamento" />
            ),
          },
          {
            chave: "ativo",
            titulo: "Ativa",
            celula: (c) => (
              <Switch checked={c.ativo} disabled={!podeEditar} onCheckedChange={(v) => alternar(c, "ativo", v)} aria-label="Ativa" />
            ),
          },
        ]}
      />
      <FormularioDialog
        aberto={nova}
        onAbertoChange={setNova}
        titulo="Nova categoria"
        form={form}
        onSalvar={async (d) => {
          await salvar.mutateAsync({ dados: { ...d, ativo: true } });
          setNova(false);
        }}
      >
        <CampoTexto control={form.control} name="nome" label="Nome" />
        <CampoSwitch control={form.control} name="fora_do_planejamento" label="Fora do planejamento" />
      </FormularioDialog>
    </SecaoCard>
  );
}
