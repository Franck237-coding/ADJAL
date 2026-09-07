import { useState, useMemo, useRef } from "react";
import { 
  useGetAdminProducts, 
  useUpdateProductModeration, 
  getGetAdminProductsQueryKey,
  type AdminProduct,
  type ProductModerationUpdateStatus
} from "@adjal/api-contract/react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, CheckCircle2, XCircle, Clock, MapPin, User, CalendarDays, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminLanguage } from "@/lib/i18n";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ProductsPage() {
  const { t } = useAdminLanguage();
  const { data: products, isLoading, error } = useGetAdminProducts();
  const updateModerationMutation = useUpdateProductModeration();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [moderationFilter, setModerationFilter] = useState<string>("all");

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.ownerName && product.ownerName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      const matchesModeration =
        moderationFilter === "all" ||
        (moderationFilter === "active" && product.status === "published") ||
        (moderationFilter === "removed" && product.status === "removed");
      
      return matchesSearch && matchesStatus && matchesModeration;
    });
  }, [products, searchTerm, statusFilter, moderationFilter]);

  const mutateFnRef = useRef(updateModerationMutation.mutate);
  mutateFnRef.current = updateModerationMutation.mutate;

  const handleUpdateStatus = (product: AdminProduct, newStatus: ProductModerationUpdateStatus) => {
    mutateFnRef.current(
      { id: product.id, data: { status: newStatus } },
      {
        onSuccess: (updatedProduct) => {
          queryClient.setQueryData<AdminProduct[]>(getGetAdminProductsQueryKey(), (old) => 
            old ? old.map(p => p.id === updatedProduct.id ? updatedProduct : p) : old
          );
          
          toast({
            title: newStatus === 'published' ? "Annonce restaurée" : "Annonce retirée",
            description: `${product.name} a été ${newStatus === 'published' ? 'restaurée' : 'retirée'}.`,
          });
        },
        onError: () => {
          toast({
            title: "Action impossible",
            description: "Impossible de mettre à jour le statut de l’annonce. Réessayez.",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !products) {
    return (
      <div className="p-6 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
        <h2 className="font-semibold text-lg mb-2">Impossible de charger les produits</h2>
        <p>Une erreur est survenue lors de la communication avec le serveur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("Content Moderation")}</h1>
        <p className="text-muted-foreground mt-2">
          Consultez les annonces publiées et retirez celles qui présentent des irrégularités.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t("Product Listings")}</CardTitle>
          <CardDescription>{filteredProducts.length} annonces trouvées</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, catégorie ou producteur..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="published">Publiée</SelectItem>
                  <SelectItem value="removed">Retirée</SelectItem>
                </SelectContent>
              </Select>
              <Select value={moderationFilter} onValueChange={setModerationFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtre de modération" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les annonces</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="removed">Retirées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border/50 overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Annonce</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead>Inventaire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucune annonce ne correspond à vos filtres.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {product.category}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <User className="h-3 w-3 mr-1.5" />
                            {product.ownerName || "Producteur inconnu"}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1.5" />
                            {product.city}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <CalendarDays className="h-3 w-3 mr-1.5" />
                            Récolte : {new Date(product.harvestDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.stock} unités</div>
                        {product.shelfLifeDays && (
                          <div className="text-xs text-muted-foreground">
                            Durée de conservation : {product.shelfLifeDays} jours
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={
                            product.status === 'published' ? "bg-green-50 text-green-700 border-green-200" :
                            product.status === 'removed' ? "bg-red-50 text-red-700 border-red-200" :
                            "bg-orange-50 text-orange-700 border-orange-200"
                          }
                        >
                          {product.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {product.status === 'published' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {product.status === 'removed' && <XCircle className="h-3 w-3 mr-1" />}
                          <span className="capitalize">{product.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="hidden md:flex justify-end gap-2">
                          {product.status !== 'published' && (
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                              onClick={() => handleUpdateStatus(product, 'published')}
                              disabled={updateModerationMutation.isPending}
                            >
                              Restaurer
                            </Button>
                          )}
                          {product.status !== 'removed' && (
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                              onClick={() => handleUpdateStatus(product, 'removed')}
                              disabled={updateModerationMutation.isPending}
                            >
                              Retirer
                            </Button>
                          )}
                        </div>
                        <div className="md:hidden flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {product.status !== 'published' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(product, 'published')}>
                                  Restaurer
                                </DropdownMenuItem>
                              )}
                              {product.status !== 'removed' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(product, 'removed')}>
                                  Retirer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
