import { useGetAdminSummary } from "@adjal/api-contract/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBasket, ArrowRightLeft, ClockAlert, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAdminLanguage } from "@/lib/i18n";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { t } = useAdminLanguage();
  const { data: summary, isLoading, error } = useGetAdminSummary();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
        <h2 className="font-semibold text-lg mb-2">{t("Failed to load summary")}</h2>
        <p className="mb-4">{t("There was an error communicating with the server. Please try again later.")}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("Retry")}
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      title: t("Total Users"),
      value: summary.userCount,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: t("Active Products"),
      value: summary.productCount,
      icon: ShoppingBasket,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: t("Pending Moderation"),
      value: summary.pendingProductCount,
      icon: ClockAlert,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      title: t("Transactions"),
      value: summary.transactionCount,
      icon: ArrowRightLeft,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("Marketplace Overview")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("Monitor the health and activity of the A DJAL agricultural marketplace.")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="border-border/50 shadow-sm hover-elevate transition-all">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">
                    {stat.value.toLocaleString()}
                  </h3>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t("Quick Actions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => setLocation("/products")}
              >
                <ClockAlert className="h-5 w-5 text-orange-500" />
                <span>Review Pending</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
                onClick={() => setLocation("/users")}
              >
                <Users className="h-5 w-5 text-blue-500" />
                <span>Manage Users</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-primary/5 border-primary/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Server</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Connected
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
