import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Colaborador = Tables<"colaboradores">;

interface SessaoContexto {
  session: Session | null;
  /** Colaborador ativo ligado ao usuário logado (null se não houver). */
  colaborador: Colaborador | null;
  carregando: boolean;
  sair: () => Promise<void>;
}

const Contexto = createContext<SessaoContexto | undefined>(undefined);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao);
      setCarregandoSessao(false);
    });
    supabase.auth.getSession().then(({ data: { session: atual } }) => {
      setSession(atual);
      setCarregandoSessao(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const { data: colaborador, isLoading: carregandoColaborador } = useQuery({
    queryKey: ["colaborador-atual", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .eq("user_id", userId!)
        .eq("ativo", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const sair = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  return (
    <Contexto.Provider
      value={{
        session,
        colaborador: colaborador ?? null,
        carregando: carregandoSessao || (!!userId && carregandoColaborador),
        sair,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useSessao() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useSessao deve ser usado dentro de <SessaoProvider>.");
  return ctx;
}
