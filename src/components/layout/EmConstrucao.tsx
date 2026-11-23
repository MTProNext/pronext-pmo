import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmConstrucao({ etapa }: { etapa: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
        <Construction className="h-5 w-5" />
        Tela em construção ({etapa}).
      </CardContent>
    </Card>
  );
}
