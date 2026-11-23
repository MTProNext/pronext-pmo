import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
