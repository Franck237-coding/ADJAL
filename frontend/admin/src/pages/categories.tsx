import { useRef, useState } from "react";
import {
  getGetAdminCategoriesQueryKey,
  type Category,
  type CreateCategoryInput,
  type UpdateCategoryInput,
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
import { ImageIcon, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminLanguage } from "@/lib/i18n";
import { getAuthToken } from "@/lib/auth";

/** Le backend renvoie `imageUrl` pour chaque catégorie (colonne categories.image_url). */
type CategoryWithImage = Category & { imageUrl?: string | null };

const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Même origine API que celle configurée dans main.tsx. */
function apiOrigin(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (configured ?? (import.meta.env.DEV ? "http://localhost:8099" : "")).replace(/\/+$/, "");
}

/**
 * Réduit l'image (1600 px max, JPEG qualité 0,85) avant l'envoi.
 * Une photo de téléphone passe ainsi de plusieurs Mo à quelques centaines de Ko.
 */
async function compressImage(file: File): Promise<File> {
  const MAX_SIDE = 1600;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    const baseName = file.name.replace(/\.[^.]+$/, "") || "categorie";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Envoie l'image au backend (POST /api/media/upload) et renvoie son URL publique. */
async function uploadCategoryImage(original: File): Promise<string> {
  if (!original.type.startsWith("image/")) {
    throw new Error("Choisissez un fichier image (JPEG, PNG ou WebP).");
  }
  const file = await compressImage(original);
  if (!ACCEPTED_IMAGES.split(",").includes(file.type)) {
    throw new Error("Formats acceptés : JPEG, PNG ou WebP.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("L'image doit faire 10 Mo maximum.");
  }
  const form = new FormData();
  form.append("file", file);
  const token = getAuthToken();
  const response = await fetch(`${apiOrigin()}/api/media/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const body = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!response.ok || !body?.url) {
    throw new Error(body?.error ?? `Échec de l'envoi de l'image (${response.status})`);
  }
  return body.url;
}

function CategoryThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed bg-muted text-muted-foreground">
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }
  return <img src={src} alt={alt} className="h-14 w-14 shrink-0 rounded-md border object-cover" />;
}

export default function CategoriesPage() {
  const { t } = useAdminLanguage();
  const { data, isLoading, error } = useGetAdminCategories();
  const categories = data as CategoryWithImage[] | undefined;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateAdminCategory();
  const deleteMutation = useDeleteAdminCategory();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const createFileInput = useRef<HTMLInputElement>(null);
  const rowFileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetAdminCategoriesQueryKey() });

  const pickCreateImage = (file: File | undefined) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file ?? null);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    pickCreateImage(undefined);
    if (createFileInput.current) createFileInput.current.value = "";
  };

  const create = async () => {
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    try {
      const imageUrl = imageFile ? await uploadCategoryImage(imageFile) : undefined;
      const payload = { name: name.trim(), slug: slug.trim().toLowerCase(), imageUrl } as CreateCategoryInput;
      await createMutation.mutateAsync({ data: payload });
      resetForm();
      refresh();
      toast({ title: t("Category created") });
    } catch (mutationError) {
      toast({
        title: t("Unable to create category"),
        description: mutationError instanceof Error ? mutationError.message : undefined,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const changeImage = async (category: CategoryWithImage, file: File | undefined) => {
    if (!file) return;
    setUploadingId(category.id);
    try {
      const imageUrl = await uploadCategoryImage(file);
      const payload = { imageUrl } as UpdateCategoryInput;
      await updateMutation.mutateAsync({ id: category.id, data: payload });
      refresh();
      toast({ title: t("Category image updated") });
    } catch (mutationError) {
      toast({
        title: t("Unable to update category"),
        description: mutationError instanceof Error ? mutationError.message : undefined,
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
      const input = rowFileInputs.current[category.id];
      if (input) input.value = "";
    }
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
          <CardDescription>{t("Use a stable lowercase slug for product listings.")} {t("The image is shown to buyers in the mobile app.")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <CategoryThumbnail src={imagePreview} alt={name || t("Category image")} />
          <Input placeholder={t("Category name")} value={name} onChange={(event) => setName(event.target.value)} />
          <Input placeholder="ex: produits-transformes" value={slug} onChange={(event) => setSlug(event.target.value)} />
          <input
            ref={createFileInput}
            type="file"
            accept={ACCEPTED_IMAGES}
            className="hidden"
            onChange={(event) => pickCreateImage(event.target.files?.[0])}
          />
          <Button type="button" variant="outline" onClick={() => createFileInput.current?.click()} disabled={creating}>
            <ImagePlus className="mr-2 h-4 w-4" />
            {imageFile ? t("Change image") : t("Add image")}
          </Button>
          <Button onClick={create} disabled={creating || !name.trim() || !slug.trim()}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {t("Add category")}
          </Button>
        </CardContent>
      </Card>
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y">
            {categories.map((category) => (
              <div key={category.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <CategoryThumbnail src={category.imageUrl} alt={category.name} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="outline">{category.active ? t("Active") : t("Inactive")}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{category.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    ref={(element) => { rowFileInputs.current[category.id] = element; }}
                    type="file"
                    accept={ACCEPTED_IMAGES}
                    className="hidden"
                    onChange={(event) => void changeImage(category, event.target.files?.[0])}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rowFileInputs.current[category.id]?.click()}
                    disabled={uploadingId === category.id}
                  >
                    {uploadingId === category.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                    {category.imageUrl ? t("Change image") : t("Add image")}
                  </Button>
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
