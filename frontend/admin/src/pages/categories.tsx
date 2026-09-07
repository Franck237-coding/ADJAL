import { useState } from "react";
import {
  getGetAdminCategoriesQueryKey,
  type Category,
  useCreateCategory,
  useDeleteAdminCategory,
  useGetAdminCategories,
  useUpdateAdminCategory,
} from "@adjal/api-contract/react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminLanguage } from "@/lib/i18n";

export default function CategoriesPage() {
  const { t } = useAdminLanguage();
  const { data: categories, isLoading, error } = useGetAdminCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateAdminCategory();
  const deleteMutation = useDeleteAdminCategory();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetAdminCategoriesQueryKey() });

  const create = () => {
    if (!name.trim() || !slug.trim()) return;
    createMutation.mutate(
      { data: { name: name.trim(), slug: slug.trim().toLowerCase() } },
      {
        onSuccess: () => {
          setName("");
          setSlug("");
          refresh();
          toast({ title: t("Category created") });
        },
        onError: (mutationError) =>
          toast({ title: t("Unable to create category"), description: mutationError.message, variant: "destructive" }),
      },
    );
  };

  const toggle = (category: Category) => {
    updateMutation.mutate(
      { id: category.id, data: { active: !category.active } },
      { onSuccess: refresh, onError: () => toast({ title: t("Unable to update category"), variant: "destructive" }) },
    );
  };

  const remove = (category: Category) => {
    deleteMutation.mutate(
      { id: category.id },
      {
        onSuccess: refresh,
        onError: (mutationError) =>
          toast({ title: t("Unable to delete category"), description: mutationError.message, variant: "destructive" }),
      },
    );
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !categories) return <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-destructive">{t("Unable to load categories")}</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("Category Management")}</h1>
        <p className="mt-2 text-muted-foreground">{t("Administrators control the categories available to farmers and buyers.")}</p>
      </div>
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>{t("Create category")}</CardTitle>
          <CardDescription>{t("Use a stable lowercase slug for product listings.")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input placeholder={t("Category name")} value={name} onChange={(event) => setName(event.target.value)} />
          <Input placeholder="ex: produits-transformes" value={slug} onChange={(event) => setSlug(event.target.value)} />
          <Button onClick={create} disabled={createMutation.isPending || !name.trim() || !slug.trim()}><Plus className="mr-2 h-4 w-4" />{t("Add category")}</Button>
        </CardContent>
      </Card>
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y">
            {categories.map((category) => (
              <div key={category.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="outline">{category.active ? t("Active") : t("Inactive")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{category.slug}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Switch checked={category.active} onCheckedChange={() => toggle(category)} disabled={updateMutation.isPending} />
                    {category.active ? t("Deactivate") : t("Activate")}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(category)} disabled={deleteMutation.isPending} aria-label={t("Delete")}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {!categories.length && <div className="p-8 text-center text-muted-foreground">{t("No categories yet")}</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}