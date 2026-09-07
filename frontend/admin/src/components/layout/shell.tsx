import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { getGetCurrentAccountQueryKey, useGetCurrentAccount, useLogoutAccount } from "@adjal/api-contract/react";
import { clearAuthToken } from "@/lib/auth";
import { LayoutDashboard, Users, ShoppingBasket, LogOut, Loader2, Tags, Settings, Flag, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAdminLanguage } from "@/lib/i18n";
import logo from "@assets/logo_1787277281113.png";

interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useAdminLanguage();
  
  const { data: account, isLoading, error } = useGetCurrentAccount({
    query: {
      retry: false,
      queryKey: getGetCurrentAccountQueryKey(),
    }
  });

  const logoutMutation = useLogoutAccount();

  const isUnauthorized = Boolean(error || (account && account.role !== "admin"));

  useEffect(() => {
    if (!isUnauthorized || location === "/") return;
    clearAuthToken();
    setLocation("/");
  }, [isUnauthorized, location, setLocation]);

  if (isUnauthorized) return null;

  if (isLoading || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearAuthToken();
        toast({ title: t("Logged out successfully") });
        setLocation("/");
      }
    });
  };

  const navItems = [
    { href: "/dashboard", label: t("Overview"), icon: LayoutDashboard },
    { href: "/users", label: t("Users"), icon: Users },
    { href: "/products", label: t("Products"), icon: ShoppingBasket },
    { href: "/categories", label: t("Categories"), icon: Tags },
    { href: "/reports", label: "Signalements", icon: Flag },
    { href: "/orders", label: "Commandes", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen flex w-full bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-sidebar text-sidebar-foreground flex-shrink-0 border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <img src={logo} alt="A DJAL" className="mr-3 h-8 w-24 rounded-md bg-white object-contain" />
          <span className="font-semibold text-lg tracking-tight">{t("A DJAL Admin")}</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={`flex items-center px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-3 ${isActive ? "text-sidebar-primary-foreground" : ""}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <Avatar className="h-9 w-9 bg-sidebar-primary border border-sidebar-border">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                {account.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium truncate">{account.name}</span>
              <span className="text-xs text-sidebar-foreground/60 truncate">{account.email}</span>
            </div>
          </div>
          <Link href="/settings">
            <div className={`mb-2 flex cursor-pointer items-center rounded-md px-3 py-2 text-sm transition-colors ${
              location === "/settings"
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}>
              <Settings className="mr-2 h-4 w-4" />
              {t("Settings")}
            </div>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("Sign Out")}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
