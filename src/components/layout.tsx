import { ModeToggle } from "./mode-toggle";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <header className="p-4 border-b">
        <div className="max-w-7xl mx-auto flex justify-end">
          <ModeToggle />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
};

export default Layout;
