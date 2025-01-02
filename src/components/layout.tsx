import { Copyright } from "lucide-react";
import { ModeToggle } from "./mode-toggle";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-2 border-b">
        <div className="max-w-7xl mx-auto flex justify-end">
          <ModeToggle />
        </div>
      </header>
      <main className="flex-1 flex flex-col justify-center">
        <div>{children}</div>
      </main>
      <footer className="p-2 border-t">
        <div className="max-w-7xl mx-auto flex justify-end">
          <span className="flex items-center gap-1 text-sm">
            <Copyright /> {currentYear} Robyn Phoenix
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
