import { Link } from "react-router-dom";

const NotFound = () => (
  <main className="flex min-h-screen items-center justify-center bg-background p-4">
    <div className="text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Página não encontrada.</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        Voltar ao início
      </Link>
    </div>
  </main>
);

export default NotFound;
