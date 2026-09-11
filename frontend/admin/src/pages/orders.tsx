import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, PackageCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";
type Order = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  status: OrderStatus;
  city: string;
  createdAt: string;
  sellerName: string;
  buyerName: string;
};

const statusBadge: Record<OrderStatus, { label: string; icon: React.ReactElement; color: string; bg: string }> = {
  pending: { label: "En attente", icon: <Clock3 className="mr-1 h-3 w-3" />, color: "#1976D2", bg: "rgba(25, 118, 210, 0.12)" },
  confirmed: { label: "Confirmée", icon: <CheckCircle2 className="mr-1 h-3 w-3" />, color: "#1976D2", bg: "rgba(25, 118, 210, 0.12)" },
  delivered: { label: "Livrée", icon: <PackageCheck className="mr-1 h-3 w-3" />, color: "#2F7D32", bg: "rgba(47, 125, 50, 0.12)" },
  cancelled: { label: "Annulée", icon: <XCircle className="mr-1 h-3 w-3" />, color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" },
};

async function ordersRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Impossible de communiquer avec le serveur.");
  return payload;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const load = async () => { setLoading(true); try { setOrders(await ordersRequest<Order[]>(`/api/admin/orders?status=${status}`)); } catch (error) { toast({ title: "Impossible de charger les commandes", description: error instanceof Error ? error.message : "Réessayez plus tard.", variant: "destructive" }); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [status]);
  const updateStatus = async (order: Order, nextStatus: OrderStatus) => {
    setWorkingId(order.id);
    try {
      const updated = await ordersRequest<Order>(`/api/admin/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast({ title: "Commande mise à jour", description: `${order.productName} · ${statusLabels[nextStatus]}` });
    } catch (error) { toast({ title: "Mise à jour impossible", description: error instanceof Error ? error.message : "Réessayez plus tard.", variant: "destructive" }); } finally { setWorkingId(null); }
  };
  return <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"><div><h1 className="text-3xl font-bold tracking-tight">Commandes</h1><p className="mt-2 text-muted-foreground">Consultez les commandes réelles et corrigez leur statut lorsque le support l’exige.</p></div><div className="flex flex-wrap gap-2">{(["all", "pending", "confirmed", "delivered", "cancelled"] as const).map((item) => <Button key={item} variant={status === item ? "default" : "outline"} onClick={() => setStatus(item)}>{item === "all" ? "Toutes" : statusBadge[item].label}</Button>)}</div><Card><CardHeader><CardTitle>Commandes clientes</CardTitle><CardDescription>{orders.length} commande(s) dans cette file</CardDescription></CardHeader><CardContent>{loading ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Commande</TableHead><TableHead>Acheteur</TableHead><TableHead>Agriculteur</TableHead><TableHead>Montant</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{orders.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucune commande dans cette file.</TableCell></TableRow> : orders.map((order) => <TableRow key={order.id}><TableCell><div className="font-medium">{order.productName}</div><div className="text-xs text-muted-foreground">{order.quantity} · {order.city} · {new Date(order.createdAt).toLocaleString("fr-FR")}</div></TableCell><TableCell>{order.buyerName}</TableCell><TableCell>{order.sellerName}</TableCell><TableCell>{Number(order.unitPrice * order.quantity).toLocaleString("fr-FR")} FCFA</TableCell><TableCell><Badge style={{ backgroundColor: statusBadge[order.status].bg, color: statusBadge[order.status].color, borderColor: statusBadge[order.status].color }}>{statusBadge[order.status].icon}{statusBadge[order.status].label}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2">{order.status === "pending" && <Button size="sm" variant="outline" disabled={workingId === order.id} onClick={() => void updateStatus(order, "confirmed")}>Confirmer</Button>}{order.status === "confirmed" && <Button size="sm" variant="outline" disabled={workingId === order.id} onClick={() => void updateStatus(order, "delivered")}>Livrer</Button>}{order.status !== "cancelled" && order.status !== "delivered" && <Button size="sm" variant="destructive" disabled={workingId === order.id} onClick={() => void updateStatus(order, "cancelled")}>Annuler</Button>}</div></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card></div>;
}