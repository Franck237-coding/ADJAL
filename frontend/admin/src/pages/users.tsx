import { useState, useMemo, useRef } from "react";
import { 
  useGetAdminUsers, 
  useUpdateAdminUserStatus, 
  useDeleteAdminUser,
  getGetAdminUsersQueryKey,
  type Account,
  type AccountStatus
} from "@adjal/api-contract/react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ShieldBan, ShieldCheck, Mail, MapPin, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAdminLanguage } from "@/lib/i18n";

export default function UsersPage() {
  const { t } = useAdminLanguage();
  const { data: users, isLoading, error } = useGetAdminUsers();
  const updateStatusMutation = useUpdateAdminUserStatus();
  const deleteUserMutation = useDeleteAdminUser();
  // Compte en attente de confirmation de suppression définitive.
  const [userToDelete, setUserToDelete] = useState<Account | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const mutateFnRef = useRef(updateStatusMutation.mutate);
  mutateFnRef.current = updateStatusMutation.mutate;

  const handleToggleStatus = (user: Account) => {
    const newStatus: AccountStatus = user.status === "active" ? "suspended" : "active";
    
    mutateFnRef.current(
      { id: user.id, data: { status: newStatus } },
      {
        onSuccess: (updatedUser) => {
          // Optimistic patch of the cache
          queryClient.setQueryData<Account[]>(getGetAdminUsersQueryKey(), (old) => 
            old ? old.map(u => u.id === updatedUser.id ? updatedUser : u) : old
          );
          
          toast({
            title: `Account ${newStatus === 'active' ? 'Activated' : 'Suspended'}`,
            description: `${user.name}'s account has been ${newStatus}.`,
          });
        },
        onError: () => {
          toast({
            title: "Action Failed",
            description: "Could not update user status. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const confirmDelete = () => {
    const target = userToDelete;
    if (!target) return;
    deleteUserMutation.mutate(
      { id: target.id },
      {
        onSuccess: () => {
          queryClient.setQueryData<Account[]>(getGetAdminUsersQueryKey(), (old) =>
            old ? old.filter((u) => u.id !== target.id) : old
          );
          void queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
          toast({
            title: "Compte supprimé",
            description: `Le compte de ${target.name} a été supprimé définitivement.`,
          });
          setUserToDelete(null);
        },
        onError: (mutationError) => {
          toast({
            title: "Suppression impossible",
            description: mutationError instanceof Error ? mutationError.message : "Réessayez plus tard.",
            variant: "destructive",
          });
          setUserToDelete(null);
        },
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

  if (error || !users) {
    return (
      <div className="p-6 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
        <h2 className="font-semibold text-lg mb-2">{t("Failed to load users")}</h2>
        <p>{t("There was an error communicating with the server. Please try again later.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("User Management")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("View and manage buyer and farmer accounts across the marketplace.")}
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Directory</CardTitle>
          <CardDescription>Found {filteredUsers.length} accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="farmer">Farmers</SelectItem>
                  <SelectItem value="buyer">Buyers</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Account</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No users found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`capitalize ${
                            user.role === 'farmer' ? 'bg-green-100 text-green-800 border-green-200' :
                            user.role === 'buyer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-purple-100 text-purple-800 border-purple-200'
                          }`}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {user.city}, {user.country}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.status === 'active' ? "default" : "destructive"}
                          className={user.status === 'active' ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role !== 'admin' && (
                          <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant={user.status === 'active' ? "outline" : "default"}
                            size="sm"
                            className={user.status === 'active' ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "bg-green-600 hover:bg-green-700 text-white"}
                            onClick={() => handleToggleStatus(user)}
                            disabled={updateStatusMutation.isPending}
                          >
                            {user.status === 'active' ? (
                              <><ShieldBan className="h-4 w-4 mr-1.5" /> Suspend</>
                            ) : (
                              <><ShieldCheck className="h-4 w-4 mr-1.5" /> Activate</>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Supprimer définitivement"
                            title="Supprimer définitivement"
                            onClick={() => setUserToDelete(user)}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(userToDelete)} onOpenChange={(open) => { if (!open && !deleteUserMutation.isPending) setUserToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le compte de <strong>{userToDelete?.name}</strong> ({userToDelete?.email}) sera supprimé avec ses produits,
              commandes, conversations et notifications. Cette action est irréversible.
              Pour bloquer temporairement l'accès, utilisez plutôt « Suspend ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
              onClick={(event) => { event.preventDefault(); confirmDelete(); }}
            >
              {deleteUserMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
