import { useEffect, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { getAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type ReportStatus = "pending" | "dismissed" | "warned" | "banned";
type ReportAction = "dismiss" | "warn" | "ban";

type Report = {
  id: string;
  reason: "fraud" | "harassment" | "unsafe_product" | "spam" | "other";
  details: string;
  status: ReportStatus;
  resolution: string | null;
  createdAt: string;
  reporterName: string;
  reporterEmail: string;
  farmerId: string;
  farmer: { id: string; name: string; email: string; status: "active" | "suspended" } | null;
};

const reasonLabels: Record<Report["reason"], string> = {
  fraud: "Fraude ou paiement suspect",
  harassment: "Harcèlement ou comportement déplacé",
  unsafe_product: "Produit dangereux ou non conforme",
  spam: "Spam",
  other: "Autre abus",
};

async function reportsRequest<T>(path: string, init?: RequestInit): Promise<T> {
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

export default function ReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState<ReportStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      setReports(await reportsRequest<Report[]>(`/api/admin/reports?status=${status}`));
    } catch (error) {
      toast({
        title: "Impossible de charger les signalements",
        description: error instanceof Error ? error.message : "Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [status]);

  const moderate = async (report: Report, action: ReportAction) => {
    const text = resolution[report.id]?.trim();
    if (!text || text.length < 3) {
      toast({
        title: "Décision obligatoire",
        description: "Ajoutez une note expliquant la décision prise.",
        variant: "destructive",
      });
      return;
    }
    setWorkingId(report.id);
    try {
      await reportsRequest(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, resolution: text }),
      });
      toast({
        title:
          action === "ban"
            ? "Agriculteur suspendu"
            : action === "warn"
              ? "Avertissement enregistré"
              : "Signalement classé",
      });
      setReports((current) => current.filter((item) => item.id !== report.id));
    } catch (error) {
      toast({
        title: "Décision non enregistrée",
        description: error instanceof Error ? error.message : "Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Signalements des agriculteurs</h1>
        <p className="mt-2 text-muted-foreground">
          Examinez les signalements envoyés par les clients et choisissez une décision documentée.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pending", "warned", "banned", "dismissed"] as ReportStatus[]).map((item) => (
          <Button key={item} variant={status === item ? "default" : "outline"} onClick={() => setStatus(item)}>
            {item === "pending" ? "À examiner" : item === "warned" ? "Avertis" : item === "banned" ? "Suspendus" : "Classés"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldAlert className="h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">Aucun signalement dans cette file</h2>
            <p className="text-sm text-muted-foreground">Les nouveaux signalements clients apparaîtront ici.</p>
          </CardContent>
        </Card>
      ) : (
        reports.map((report) => (
          <Card key={report.id} className="border-border/60">
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  {report.farmer?.name ?? "Agriculteur supprimé"}
                </CardTitle>
                <CardDescription>
                  Signalé par {report.reporterName} · {report.reporterEmail} ·{" "}
                  {new Date(report.createdAt).toLocaleString("fr-FR")}
                </CardDescription>
              </div>
              <Badge variant={report.status === "pending" ? "destructive" : "outline"}>{report.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Motif</p>
                  <p className="mt-1 font-medium">{reasonLabels[report.reason]}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Statut du compte</p>
                  <p className="mt-1 font-medium">
                    {report.farmer?.status === "suspended" ? "Suspendu" : "Actif"}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Explication du client</p>
                <p className="whitespace-pre-wrap text-sm">{report.details}</p>
              </div>
              {report.status === "pending" && (
                <div className="space-y-3">
                  <Textarea
                    value={resolution[report.id] ?? ""}
                    onChange={(event) =>
                      setResolution((current) => ({ ...current, [report.id]: event.target.value }))
                    }
                    placeholder="Note de décision : éléments examinés, action choisie..."
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={workingId === report.id}
                      onClick={() => void moderate(report, "dismiss")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Classer sans suite
                    </Button>
                    <Button
                      variant="outline"
                      disabled={workingId === report.id}
                      onClick={() => void moderate(report, "warn")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Avertir l’agriculteur
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={workingId === report.id}
                      onClick={() => void moderate(report, "ban")}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Suspendre l’agriculteur
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}