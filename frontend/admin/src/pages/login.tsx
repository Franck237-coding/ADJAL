import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getGetCurrentAccountQueryKey, useLoginAccount, useGetCurrentAccount } from "@adjal/api-contract/react";
import { setAuthToken, getAuthToken } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAdminLanguage } from "@/lib/i18n";
import logo from "@assets/logo_1787277281113.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useAdminLanguage();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { data: account } = useGetCurrentAccount({
    query: {
      retry: false,
      enabled: !!getAuthToken(),
      queryKey: getGetCurrentAccountQueryKey(),
    }
  });

  useEffect(() => {
    if (account?.role === "admin") {
      setLocation("/dashboard");
    }
  }, [account, setLocation]);

  const loginMutation = useLoginAccount();

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (session) => {
          if (session.account.role !== "admin") {
            toast({
              title: t("Access Denied"),
              description: t("You do not have administrative privileges."),
              variant: "destructive",
            });
            return;
          }
          setAuthToken(session.accessToken);
          toast({
            title: t("Welcome back"),
            description: t("Successfully authenticated to A DJAL Admin."),
          });
          setLocation("/dashboard");
        },
        onError: () => {
          toast({
            title: t("Authentication Failed"),
            description: t("Please check your credentials and try again."),
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-primary">
          <img src={logo} alt="A DJAL" className="mb-4 h-16 w-40 rounded-xl bg-white object-contain shadow-sm" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">A DJAL Admin</h1>
          <p className="text-muted-foreground text-sm">{t("Secure Marketplace Administration")}</p>
        </div>
        
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle>{t("Sign In")}</CardTitle>
            <CardDescription>{t("Enter your credentials to access the back-office")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@adjal.cm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                {loginMutation.isPending ? t("Authenticating...") : t("Sign In")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Vous n’avez pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Créer un compte acheteur ou agriculteur
          </Link>
        </p>
      </div>
    </div>
  );
}
