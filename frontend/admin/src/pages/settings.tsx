import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  getGetCurrentAccountQueryKey,
  useGetCurrentAccount,
  useUpdateProfile,
  type ProfileUpdate,
} from "@adjal/api-contract/react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminLanguage } from "@/lib/i18n";

export default function SettingsPage() {
  const { language, setLanguage, t } = useAdminLanguage();
  const { data: account, isLoading } = useGetCurrentAccount();
  const updateMutation = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const form = useForm<ProfileUpdate>({ defaultValues: { name: "", phone: "", city: "" } });

  useEffect(() => {
    if (account) form.reset({ name: account.name, phone: account.phone, city: account.city });
  }, [account, form]);

  const save = form.handleSubmit((values) => {
    updateMutation.mutate(
      { data: values },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetCurrentAccountQueryKey(), updated);
          toast({ title: t("Profile updated") });
        },
        onError: (error) => toast({ title: t("Unable to update profile"), description: error.message, variant: "destructive" }),
      },
    );
  });

  if (isLoading || !account) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("Administrator settings")}</h1>
        <p className="mt-2 text-muted-foreground">{t("Update your personal details and dashboard language.")}</p>
      </div>
      <Card className="border-border/50 shadow-sm">
        <CardHeader><CardTitle>{t("Personal information")}</CardTitle><CardDescription>{t("These details are used for your administrator account.")}</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="admin-name">{t("Name")}</Label><Input id="admin-name" {...form.register("name", { required: true, minLength: 2 })} /></div>
            <div className="space-y-2"><Label htmlFor="admin-phone">{t("Phone")}</Label><Input id="admin-phone" {...form.register("phone", { required: true })} /></div>
            <div className="space-y-2"><Label htmlFor="admin-city">{t("City")}</Label><Input id="admin-city" {...form.register("city", { required: true, minLength: 2 })} /></div>
            <div className="space-y-2"><Label htmlFor="admin-email">{t("Email")}</Label><Input id="admin-email" value={account.email} disabled /></div>
            <div className="sm:col-span-2"><Button type="submit" disabled={updateMutation.isPending}><Save className="mr-2 h-4 w-4" />{updateMutation.isPending ? t("Saving...") : t("Save changes")}</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card className="border-border/50 shadow-sm">
        <CardHeader><CardTitle>{t("Language")}</CardTitle><CardDescription>{t("This preference is saved in this browser.")}</CardDescription></CardHeader>
        <CardContent className="flex gap-3">
          <Button variant={language === "fr" ? "default" : "outline"} onClick={() => setLanguage("fr")}>{t("French")}</Button>
          <Button variant={language === "en" ? "default" : "outline"} onClick={() => setLanguage("en")}>{t("English")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}