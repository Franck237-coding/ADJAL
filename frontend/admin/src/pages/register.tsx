import { useState } from "react";
import { useLocation } from "wouter";
import { useRegisterAccount } from "@adjal/api-contract/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logo from "@assets/logo_1787277281113.png";

type Role = "buyer" | "farmer";

function getApiError(error: unknown): string {
  const value = error as {
    message?: string;
    data?: { error?: string; fields?: Record<string, string> };
  } | null;
  if (value?.data?.error === "Email already in use") {
    return "Cette adresse email est déjà utilisée. Utilisez une autre adresse.";
  }
  if (value?.data?.fields) {
    return Object.entries(value.data.fields)
      .map(([field, message]) => `${field}: ${message}`)
      .join(" • ");
  }
  if (value?.data?.error) return value.data.error;
  return value?.message ?? "Impossible de créer le compte. Vérifiez les informations saisies.";
}

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const registerMutation = useRegisterAccount();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+237");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<Role>("buyer");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    registerMutation.mutate(
      { data: { name, email, password, phone, city, role } },
      { onSuccess: () => setLocation("/") },
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8 text-primary">
          <img src={logo} alt="A DJAL" className="mb-4 h-16 w-40 rounded-xl bg-white object-contain shadow-sm" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Créer un compte A DJAL</h1>
          <p className="text-muted-foreground text-sm text-center mt-1">
            Inscription acheteur ou agriculteur. Le compte administrateur est créé séparément.
          </p>
        </div>
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
            <CardDescription>Tous les champs sont envoyés directement à l’API Spring.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Nom complet</span>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Cendra Ngande" required minLength={2} maxLength={120} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Adresse email</span>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="cendra@gmail.com" required />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Mot de passe</span>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="10 caractères minimum" required minLength={10} maxLength={128} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Téléphone</span>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+237690000000" pattern="\+237[0-9]{9}" required />
                <span className="text-xs text-muted-foreground">Format : +237 suivi de 9 chiffres, sans espaces.</span>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Ville</span>
                <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Yaoundé" required minLength={2} maxLength={80} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Type de compte</span>
                <select value={role} onChange={(event) => setRole(event.target.value as Role)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
                  <option value="buyer">Acheteur</option>
                  <option value="farmer">Agriculteur</option>
                </select>
              </label>
              {registerMutation.isError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {getApiError(registerMutation.error)}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setLocation("/")}>Retour à la connexion</Button>
                <Button type="submit" className="flex-1" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Création..." : "Créer le compte"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}