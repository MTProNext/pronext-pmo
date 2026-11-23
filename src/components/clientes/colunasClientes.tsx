import type { Coluna } from "@/components/comum/TabelaDados";
import { Selo } from "@/components/comum/Selo";
import type { Cliente } from "@/hooks/useClientes";
import { SELO_SITUACAO } from "@/lib/selos";

export const COLUNAS_CLIENTES: Coluna<Cliente>[] = [
  { chave: "nome", titulo: "Nome", celula: (c) => <span className="font-medium">{c.nome}</span> },
  { chave: "documento", titulo: "Documento", celula: (c) => c.documento ?? "—" },
  { chave: "contato", titulo: "Contato", celula: (c) => c.contato ?? "—" },
  {
    chave: "situacao",
    titulo: "Situação",
    celula: (c) => <Selo mapa={SELO_SITUACAO} valor={c.ativo ? "ativo" : "inativo"} />,
  },
];
