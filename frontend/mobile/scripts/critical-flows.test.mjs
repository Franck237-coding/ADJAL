import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const appSource = await readFile(resolve(scriptDirectory, '../app/index.tsx'), 'utf8');
const contextSource = await readFile(resolve(scriptDirectory, '../src/app-context.tsx'), 'utf8');
const apiClientSource = await readFile(resolve(scriptDirectory, '../src/api-client.ts'), 'utf8');
const appConfigSource = await readFile(resolve(scriptDirectory, '../app.json'), 'utf8');

function expectSource(source, pattern, description) {
  assert.match(source, pattern, `Parcours critique absent : ${description}`);
}

test('inscription acheteur : le rôle mène à l’authentification puis à l’onboarding personnalisé', () => {
  expectSource(appSource, /setSelectedRole\('buyer'\)/, 'sélection du rôle acheteur');
  expectSource(appSource, /setRole\(selectedRole\)/, 'mémorisation du rôle sélectionné');
  expectSource(appSource, /onSuccess=\{\(serverRole, registered\) => setScreen\(serverRole === 'farmer' \? 'dashboard' : registered \|\| !profile\.interests\.length \? 'interest-onboarding' : 'home'\)\}/, 'routage après inscription décidé par le serveur');
  expectSource(contextSource, /const session = await apiRegister\(params\)/, 'inscription envoyée à l’API sécurisée');
  expectSource(appSource, /return <BuyerHome onProduct=\{goToProduct\} onNav=\{setBuyerScreen\} \/>;/, 'dashboard acheteur');
});


test('inscription agriculteur : le rôle mène au dashboard et à l’ajout de produit', () => {
  expectSource(appSource, /setSelectedRole\('farmer'\)/, 'sélection du rôle agriculteur');
  expectSource(appSource, /isFarmer && \(!crops\.trim\(\) \|\| !surface\.trim\(\)/, 'validation des informations agriculteur');
  expectSource(appSource, /serverRole === 'farmer' \? 'dashboard'/, 'dashboard agriculteur après inscription');
  expectSource(appSource, /QuickAction icon="add" label="Ajouter un produit" onPress=\{\(\) => onNav\('product-form'\)\}/, 'accès au formulaire produit');
  expectSource(appSource, /saveProduct\(\{ id: product\?\.id \?\? `p-\$\{Date\.now\(\)\}`/, 'enregistrement du nouveau produit');
  expectSource(appSource, /saveProduct\(\{[\s\S]*?onSaved\(\);/, 'retour à la liste après ajout du produit');
});

test('acheteur : une commande en attente peut être annulée via une transition serveur', () => {
  expectSource(appSource, /order\.status === 'En attente'/, 'action disponible uniquement pour une commande en attente');
  expectSource(appSource, /updateOrderStatus\(order\.id, 'Annulée'\)/, 'passage de la commande à annulée');
  expectSource(contextSource, /updateOrderStatus: \(orderId: string, status: Order\['status'\]\) => Promise<void>/, 'contrat asynchrone de transition serveur');
  expectSource(contextSource, /const transition = localStatusToApiTransition\[status\]/, 'traduction du statut local en transition serveur');
  expectSource(contextSource, /const updated = await apiUpdateOrderStatus\(accessToken, orderId, transition\)/, 'transition envoyée à PATCH \/orders\/:id\/status');
  expectSource(contextSource, /const mappedStatus = apiOrderStatusToLocal\[updated\.status\] \?\? status/, 'statut local dérivé de la réponse serveur');
  expectSource(contextSource, /order\.id === orderId \? \{ \.\.\.order, status: mappedStatus \} : order/, 'mise à jour locale uniquement depuis la réponse serveur');
});

test('agriculteur : confirmer et livrer passent par une transition serveur', () => {
  expectSource(appSource, /const accept = \(\) => transition\('Confirmée'/, 'confirmation de la commande par transition serveur');
  expectSource(appSource, /const deliver = \(\) => transition\('Terminée'/, 'livraison de la commande par transition serveur');
  expectSource(appSource, /farmer && order\.status === 'En attente' && <Pressable[\s\S]*?onPress=\{accept\}/, 'confirmation agriculteur sur commande en attente');
  expectSource(appSource, /farmer && order\.status === 'Confirmée' && <Pressable[\s\S]*?onPress=\{deliver\}/, 'livraison agriculteur sur commande confirmée');
  expectSource(appSource, />Accepter la commande</, 'bouton d’acceptation visible');
  expectSource(appSource, />Marquer comme livrée</, 'bouton de livraison visible');
});

test('acheteur et agriculteur : le contact depuis une commande ouvre la messagerie', () => {
  expectSource(appSource, /onMessage=\{\(\) => setScreen\('messages'\)\}/, 'navigation vers la messagerie depuis le détail');
  expectSource(appSource, /onMessage && <Pressable[\s\S]*?onMessage\(\)/, 'action de contact depuis une carte de commande');
  expectSource(appSource, /<(?:LiveMessagesScreen|MessagesScreen) initialContact=\{orderContact\} onBack=\{\(\) => setScreen\('home'\)\} onNav=\{setBuyerScreen\} \/>/, 'écran de messagerie acheteur');
  expectSource(appSource, /<(?:LiveMessagesScreen|MessagesScreen) initialContact=\{orderContact\} onBack=\{\(\) => setScreen\('dashboard'\)\} onNav=\{setBuyerScreen\} \/>/, 'écran de messagerie agriculteur');
});

test('état partagé : commande serveur, panier et produits protègent les parcours', () => {
  expectSource(contextSource, /if \(!accessToken \|\| role !== 'buyer'\)/, 'commande réservée à un acheteur authentifié');
  expectSource(contextSource, /if \(!cart\.length\) return \[\]/, 'création impossible avec un panier vide');
  expectSource(contextSource, /const apiOrders = await apiCheckout\(accessToken, \{/, 'panier entier envoyé atomiquement à POST \/checkout');
  expectSource(contextSource, /lines: cart\.map\(\(line\) => \(\{ productId: line\.product\.id, quantity: line\.quantity \}\)\),\s*city,/s, 'toutes les lignes soumises avec produit, quantité et ville');
  expectSource(contextSource, /setCart\(\[\]\)/, 'panier vidé uniquement après le succès atomique du checkout');
  expectSource(contextSource, /const lineId = `\$\{product\.id\}:\$\{product\.offerId \?\? 'standard'\}:\$\{product\.price\}`/, 'identité de panier tenant compte de l’offre et du prix');
  expectSource(contextSource, /const existing = current\.find\(\(line\) => line\.id === lineId\)/, 'seules les lignes au même prix sont fusionnées');
});

test('redémarrage : la session serveur est restaurée avant affichage', () => {
  expectSource(contextSource, /const localKeys = Object\.values\(storageKeys\)\.filter\(\(key\) => key !== storageKeys\.accessToken\)/, 'lecture locale excluant le jeton sensible');
  expectSource(contextSource, /if \(stored\[storageKeys\.hasSeenOnboarding\] === 'true'\) setHasSeenOnboardingState\(true\)/, 'restauration de l’onboarding');
  expectSource(contextSource, /const storedToken = await sessionTokenStore\.getItem\(storageKeys\.accessToken\)/, 'lecture du jeton via le coffre sécurisé');
  expectSource(contextSource, /const account = await apiGetMe\(storedToken\)/, 'validation de session par le serveur');
  expectSource(contextSource, /setRoleState\(safeRole\(account\.role\)\)/, 'rôle restauré depuis la réponse serveur');
  expectSource(contextSource, /apiGetPublicProducts\(\)/, 'catalogue invité chargé depuis le serveur');
  expectSource(contextSource, /setServerCatalog\(\[\]\)/, 'commandes et catalogue locaux vidés à la déconnexion');
  expectSource(contextSource, /await loadServerData\(storedToken, account\)/, 'catalogue et commandes serveur rechargés à la restauration de session');
  expectSource(contextSource, /setHydrated\(true\)/, 'fin explicite de l’hydratation');
  expectSource(contextSource, /if \(!hydrated\) return;/, 'aucune sauvegarde avant la restauration');
  expectSource(contextSource, /\[accessToken, cart, categoryOptions, farmerListings, hasSeenOnboarding, hydrated, language, orders, paymentMethods, products, profile, recommendations, role, selectedPaymentMethodId, themeMode, resolvedDailyOffers\]/, 'sauvegarde relancée après chaque changement persistant');
  expectSource(contextSource, /AsyncStorage\.multiSet\(\[/, 'écriture de l’état local non sensible');
  expectSource(appSource, /if \(!hydrated\) return null;/, 'aucun écran intermédiaire pendant la restauration');
  expectSource(appSource, /if \(!hasSeenOnboarding && screen === 'onboarding'\)/, 'onboarding piloté par l’état restauré');
  expectSource(appSource, /if \(!role && screen !== 'auth' && screen !== 'auth-choice' && screen !== 'role'\)/, 'rôle restauré utilisé pour choisir le parcours');
});

test('acheteur : le paiement local, la langue et le thème sont modifiables et persistés', () => {
  expectSource(appSource, /selectPaymentMethod\(method\.id\)/, 'sélection du paiement local');
  expectSource(appSource, /Moyen de paiement.*choosePaymentMethod/s, 'accès au choix du paiement depuis le profil');
  expectSource(appSource, /setThemeMode\(themeMode === 'dark' \? 'light' : 'dark'\)/, 'changement de thème');
  expectSource(appSource, /setLanguage\('en'\)/, 'changement de langue');
  expectSource(contextSource, /storageKeys\.themeMode, themeMode/,'sauvegarde du thème');
  expectSource(contextSource, /storageKeys\.language, language/,'sauvegarde de la langue');
  expectSource(contextSource, /storageKeys\.selectedPaymentMethodId, selectedPaymentMethodId/,'sauvegarde du paiement sélectionné');
  expectSource(contextSource, /\[accessToken, cart, categoryOptions, farmerListings, hasSeenOnboarding, hydrated, language, orders, paymentMethods, products, profile, recommendations, role, selectedPaymentMethodId, themeMode, resolvedDailyOffers\]/, 'sauvegarde relancée après changement des préférences');
});

test('expérience acheteur : les offres du jour, les toasts et les paiements locaux structurés sont disponibles', () => {
  expectSource(contextSource, /export type DailyOffer/, 'modèle local d’offre quotidienne prêt pour le backend');
  expectSource(contextSource, /if \(!accessToken\) return \[\]/, 'aucune offre fictive pour un invité');
  expectSource(appSource, /<DailyOffersCarousel offers=\{offers\} onProduct=\{onProduct\} \/>/, 'carrousel des offres du jour dans le dashboard');
  expectSource(appSource, /scrollRef\.current\?\.scrollTo/, 'défilement automatique des offres');
  expectSource(appSource, /availability.*expiresAt/s, 'stock et validité affichés dans une offre');
  expectSource(contextSource, /originalPrice\?: number;\s+offerId\?: string;/s, 'prix promotionnel transporté dans le panier et la commande');
  expectSource(appSource, /onProduct\(\{ \.\.\.offer\.product, price: Math\.round\(offer\.product\.price \* \(1 - offer\.discountPercent \/ 100\)\), originalPrice: offer\.product\.price, offerId: offer\.id \}\)/, 'prix remisé transmis en ouvrant une offre');
  expectSource(appSource, /key=\{line\.id\}/, 'lignes standard et promotionnelles affichées séparément');
  expectSource(appSource, /ToastContext/, 'notifications temporaires non bloquantes');
  expectSource(appSource, /void signOut\(\)\.finally\(\(\) => setScreen\('auth-choice'\)\)/, 'fermeture de session et retour à l’authentification');
  expectSource(appSource, /screen === 'payment-methods'/, 'route dédiée aux moyens de paiement');
  expectSource(appSource, /function PaymentMethodsScreen/, 'écran de moyens de paiement');
  expectSource(appSource, /kind: 'orange-money'/, 'moyen Orange Money');
  expectSource(appSource, /kind: 'mtn-momo'/, 'moyen MTN MoMo');
  expectSource(appSource, /kind: 'visa'/, 'moyen Visa');
  expectSource(appSource, /kind: 'mastercard'/, 'moyen Mastercard');
  expectSource(appSource, /function Text\(props: React\.ComponentProps<typeof NativeText>\)/, 'traduction appliquée aux libellés affichés');
  expectSource(contextSource, /export type Language = 'fr' \| 'en'/, 'langues réellement proposées');
  expectSource(contextSource, /useState<PaymentMethod\[\]>\(\[\]\)/, 'aucun moyen de paiement fictif initial');
  expectSource(appSource, /const selectedPayment = paymentMethods\.find\(\(item\) => item\.id === selectedPaymentMethodId\)/, 'contrôle de la validité du moyen sélectionné à la commande');
  expectSource(appSource, /isCard \? `•••• \$\{normalizedReference\.slice\(-4\)\}` : reference\.trim\(\)/, 'numéro de carte masqué avant toute persistance');
});

test('compte : photos locales, session sécurisée et centres d’intérêts sont disponibles', () => {
  expectSource(appSource, /import \* as ImagePicker from 'expo-image-picker'/, 'sélection d’images depuis la galerie');
  expectSource(appSource, /requestMediaLibraryPermissionsAsync\(\)/, 'permission de galerie demandée avant sélection');
  expectSource(appSource, /function ProfileSettingsScreen/, 'profil enrichi pour les comptes connectés');
  expectSource(appSource, /updateProfile\(\{ avatarUri: apiAssetUrl\((?:result|uploaded)\.avatarUrl\) \}\)/, 'photo de profil conservée dans le profil');
  expectSource(appSource, /function FarmerProductEditor/, 'formulaire produit avec image locale');
  expectSource(appSource, /accessibilityLabel="Ajouter une photo de produit"/, 'sélection d’image de produit accessible');
  expectSource(appSource, /requestCameraPermissionsAsync\(\)/, 'permission de caméra demandée avant la prise de vue');
  expectSource(appSource, /image: imageUri \?\? ''/, 'image produit explicitement vide sans média');
  expectSource(contextSource, /avatarUri\?: string;\s+interests: string\[\];/s, 'modèle de profil enrichi pour photo et intérêts');
  expectSource(contextSource, /const result = await apiSaveInterests\(accessToken, interests\)/, 'centres d’intérêts synchronisés au serveur');
  expectSource(contextSource, /await SecureStore\.setItemAsync\(key, value\)/, 'jeton stocké dans le coffre sécurisé natif');
  expectSource(contextSource, /await SecureStore\.deleteItemAsync\(key\)/, 'jeton supprimé du coffre à la déconnexion');
  expectSource(apiClientSource, /apiLogout\(token: string\)/, 'révocation de session côté serveur');
  expectSource(appSource, /screen === 'security'/, 'route de sécurité dédiée');
  expectSource(appSource, /screen === 'interests'/, 'route de centre d’intérêts dédiée');
  expectSource(appSource, /function SecurityScreen/, 'page de sécurité fonctionnelle');
  expectSource(appSource, /function InterestsScreen/, 'page de centres d’intérêts fonctionnelle');
  expectSource(appSource, /'cart', 'orders', 'messages', 'profile', 'security', 'interests'/, 'pages privées protégées pour les invités');
  expectSource(appSource, /recommendations/, 'centres d’intérêts appliqués au classement des produits');
  expectSource(appSource, /Session sécurisée active/, 'état de session sécurisée affiché');
  expectSource(appConfigSource, /"expo-image-picker"/, 'plugin natif de sélection d’images enregistré');
  expectSource(appConfigSource, /"NSPhotoLibraryUsageDescription"/, 'permission photo déclarée pour iOS');
});

test('compte : la réinitialisation par e-mail utilise un code unique puis ferme la session', () => {
  expectSource(apiClientSource, /apiFetch<void>\('\/auth\/password-reset', \{\s*method: 'POST',/s, 'demande de récupération envoyée à l’API');
  expectSource(apiClientSource, /apiFetch<void>\('\/auth\/password-reset\/confirm', \{\s*method: 'POST',/s, 'confirmation de récupération envoyée à l’API');
  expectSource(appSource, /await apiRequestPasswordReset\(email\.trim\(\)\)/, 'demande e-mail attendue avant affichage du formulaire');
  expectSource(appSource, /token\.trim\(\)\.length < 40/, 'code opaque de récupération vérifié');
  expectSource(appSource, /await apiConfirmPasswordReset\(token\.trim\(\), newPassword\)/, 'nouveau mot de passe confirmé avec le code');
  expectSource(appSource, /onResetSuccess=\{async \(\) => \{ await signOut\(\); setScreen\('auth'\); \}\}/, 'session locale supprimée après réinitialisation');
});

test('marketplace : le client API typé et authentifié couvre produits et commandes', () => {
  expectSource(apiClientSource, /export async function apiGetProducts\(token: string\): Promise<ApiMarketProduct\[\]>/, 'GET /products typé et authentifié');
  expectSource(apiClientSource, /apiFetch<ApiMarketProduct\[\]>\('\/products', \{ token \}\)/, 'lecture du catalogue publié avec jeton');
  expectSource(apiClientSource, /export async function apiCreateProduct\(/, 'POST /products typé');
  expectSource(apiClientSource, /apiFetch<ApiAdminProduct>\('\/products', \{\s*method: 'POST',\s*token,/s, 'création de listing envoyée avec jeton');
  expectSource(apiClientSource, /export async function apiGetOrders\(token: string\): Promise<ApiOrder\[\]>/, 'GET /orders typé et authentifié');
  expectSource(apiClientSource, /export async function apiCreateOrder\(/, 'POST /orders typé');
  expectSource(apiClientSource, /apiFetch<ApiOrder>\('\/orders', \{\s*method: 'POST',\s*token,/s, 'création de commande envoyée avec jeton');
  // Nouveaux endpoints commerce autoritaires (OpenAPI généré).
  expectSource(apiClientSource, /export async function apiGetMyProducts\(token: string\): Promise<ApiAdminProduct\[\]>/, 'GET /products/mine typé et authentifié');
  expectSource(apiClientSource, /apiFetch<ApiAdminProduct\[\]>\('\/products\/mine', \{ token \}\)/, 'lecture des listings de l’agriculteur avec jeton');
  expectSource(apiClientSource, /export async function apiUpdateProduct\(/, 'PATCH /products/:id typé');
  expectSource(apiClientSource, /apiFetch<ApiAdminProduct>\(`\/products\/\$\{id\}`, \{\s*method: 'PATCH',\s*token,/s, 'mise à jour de listing envoyée avec jeton');
  expectSource(apiClientSource, /export async function apiDeleteProduct\(token: string, id: string\): Promise<void>/, 'DELETE /products/:id typé');
  expectSource(apiClientSource, /apiFetch<void>\(`\/products\/\$\{id\}`, \{ method: 'DELETE', token \}\)/, 'suppression de listing envoyée avec jeton');
  expectSource(apiClientSource, /export async function apiCheckout\(/, 'POST /checkout typé');
  expectSource(apiClientSource, /apiFetch<ApiOrder\[\]>\('\/checkout', \{\s*method: 'POST',\s*token,/s, 'checkout atomique envoyé avec jeton');
  expectSource(apiClientSource, /export async function apiUpdateOrderStatus\(/, 'PATCH /orders/:id/status typé');
  expectSource(apiClientSource, /apiFetch<ApiOrder>\(`\/orders\/\$\{id\}\/status`, \{\s*method: 'PATCH',\s*token,/s, 'transition de commande envoyée avec jeton');
  // Tokens must never be logged anywhere in the client.
  assert.doesNotMatch(apiClientSource, /console\.(log|info|debug|warn|error)\([^)]*token/i, 'aucun jeton journalisé dans le client API');
});

test('marketplace : le contexte s’appuie sur le serveur pour catalogue et commandes', () => {
  expectSource(contextSource, /const \[productsResult, ordersResult, mineResult(?:, categoriesResult)?(?:, recommendationsResult)?(?:, notificationsResult, preferencesResult)?\] = await Promise\.allSettled\(\[\s*apiGetProducts\(token\),\s*apiGetOrders\(token\),\s*isFarmer \? apiGetMyProducts\(token\)/s, 'catalogue, commandes et listings de l’agriculteur chargés depuis le serveur');
  expectSource(contextSource, /if \(isFarmer && mineResult\.status === 'fulfilled'\)/, 'listings de l’agriculteur pris depuis GET /products/mine');
  expectSource(contextSource, /setFarmerListings\(own\)/, 'liste agriculteur rechargée depuis la réponse serveur, sans état de session');
  expectSource(contextSource, /await loadServerData\(session\.accessToken, session\.account\)/, 'données serveur chargées après connexion');
  expectSource(contextSource, /await apiUpdateProduct\(accessToken, product\.id, \{/, 'édition de listing existant via PATCH /products/:id');
  expectSource(contextSource, /: await apiCreateProduct\(accessToken, \{/, 'nouveau listing via POST /products');
  expectSource(contextSource, /const isExistingServerListing = farmerListings\.some\(\(item\) => item\.id === product\.id\)/, 'PATCH réservé aux listings serveur existants');
  expectSource(contextSource, /saveProduct: \(product: Product\) => Promise<void>/, 'saveProduct devient asynchrone et serveur');
  expectSource(contextSource, /deleteProduct: \(productId: string\) => Promise<void>/, 'deleteProduct devient asynchrone et serveur');
  expectSource(contextSource, /await apiDeleteProduct\(accessToken, productId\)/, 'suppression de listing via DELETE /products/:id avant toute mutation locale');
  expectSource(contextSource, /createOrder: \(\) => Promise<Order\[\]>/, 'createOrder devient asynchrone et serveur');
  expectSource(contextSource, /if \(!accessToken \|\| role !== 'farmer'\)/, 'publication réservée à un agriculteur authentifié');
  // Guests never persist server orders/listings.
  expectSource(contextSource, /Connectez-vous en tant qu’acheteur pour commander\./, 'les invités ne créent pas de commandes serveur');
  expectSource(contextSource, /Connectez-vous en tant qu’agriculteur pour publier un produit\./, 'les invités ne créent pas de listings serveur');
});

test('marketplace : les appels serveur sont attendus dans l’interface', () => {
  expectSource(appSource, /const created = await createOrder\(\)/, 'panier attend la confirmation serveur de la commande');
  expectSource(appSource, /const first = created\[0\]/, 'redirection vers la première commande serveur créée');
  expectSource(appSource, /await saveProduct\(\{ id: product\?\.id/, 'formulaire produit attend la création serveur');
  expectSource(appSource, /toast\(error instanceof Error \? error\.message : 'La commande a échoué\. Réessayez\.'\)/, 'erreur de commande affichée à l’acheteur');
  expectSource(appSource, /toast\(error instanceof Error \? error\.message : 'La publication du produit a échoué\. Réessayez\.'\)/, 'erreur de publication affichée à l’agriculteur');
});

const mobileWidths = [375, 390, 412];
const browserBaseUrl = process.env.ADJAL_BASE_URL;
let registrationCounter = 0;

// The workspace API intentionally exposes the commerce subset used by this
// smoke test. Messaging is implemented by the Spring API in the standalone
// export, while the workspace API can answer with a resource error for those
// optional endpoints. External image CDNs can also reject a request in CI.
// These browser-level resource errors do not represent a JavaScript exception;
// navigation and action assertions below still fail if a required screen is
// unavailable.
const expectedConsoleErrors = [
  {
    pattern: /^Failed to load resource: the server responded with a status of (403|404) \((Forbidden|Not Found)\)$/,
  },
];

const serverProductName = /Tomates fraîches|Manioc certifié bio|Ananas Victoria/;

function isExpectedConsoleError(message) {
  return expectedConsoleErrors.some(({ pattern }) => pattern.test(message));
}

function createConsoleErrorTracker(width) {
  const unexpectedErrors = [];

  function record(source, message) {
    if (!isExpectedConsoleError(message)) {
      unexpectedErrors.push(`${source}: ${message}`);
    }
  }

  return {
    recordConsoleMessage(message) {
      if (message.type() === 'error') record('console.error', message.text());
    },
    recordPageError(error) {
      record('pageerror', error.message);
    },
    assertNoUnexpectedErrors() {
      assert.deepEqual(
        unexpectedErrors,
        [],
        `Erreur JavaScript non attendue dans le preview Expo Web à ${width}px:\n${unexpectedErrors.join('\n')}`,
      );
    },
  };
}

async function openFreshMobilePage(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: 720 }, isMobile: true });
  await context.addInitScript(() => localStorage.clear());
  const page = await context.newPage();
  const consoleErrors = createConsoleErrorTracker(width);
  page.on('console', (message) => consoleErrors.recordConsoleMessage(message));
  page.on('pageerror', (error) => consoleErrors.recordPageError(error));
  await page.goto(browserBaseUrl, { waitUntil: 'networkidle' });
  for (let step = 0; step < 2; step += 1) await page.getByText('Suivant', { exact: true }).click();
  await page.getByText('Commencer', { exact: true }).click();
  return { context, page, consoleErrors };
}

async function register(page, role) {
  await page.getByText('Créer un compte', { exact: true }).click();
  await page.getByTestId(`role-${role}`).click();
  await page.getByText('Commencer', { exact: true }).click();
  await page.getByPlaceholder('Cendra Ngande', { exact: true }).fill(role === 'farmer' ? 'Awa Farmer' : 'Awa Buyer');
  await page.getByPlaceholder('cendra@gmail.com', { exact: true }).fill(`${role}-${Date.now()}-${registrationCounter++}@adjal.cm`);
  await page.getByPlaceholder('Ex. 6 90 00 00 00', { exact: true }).fill('690000000');
  await page.getByPlaceholder('Yaoundé, Cameroun', { exact: true }).fill('Yaoundé, Cameroun');
  await page.getByPlaceholder('Quartier, rue ou point de repère', { exact: true }).fill('Bastos, Yaoundé');
  await page.getByPlaceholder('••••••••', { exact: true }).fill('QaPassword2026!');
  if (role === 'farmer') {
    await page.getByPlaceholder('Manioc, maïs, arachide', { exact: true }).fill('Manioc, maïs');
    await page.getByPlaceholder('1', { exact: true }).fill('2');
  }
  await page.getByText('Créer le compte', { exact: true }).click();
  if (role === 'buyer') {
    await page.getByText('Personnalisons votre marché', { exact: true }).waitFor({ state: 'visible' });
    await page.getByTestId('interest-fruits').click();
    await page.getByText('Continuer vers mon marché', { exact: true }).click();
  }
}

test('UI mobile : inscription acheteur et agriculteur sur les largeurs supportées', { skip: !browserBaseUrl }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of mobileWidths) {
      for (const role of ['buyer', 'farmer']) {
        const { context, page, consoleErrors } = await openFreshMobilePage(browser, width);
        await register(page, role);
        await page.getByText(role === 'farmer' ? 'Résumé du jour' : /Bonjour, Awa/).waitFor({ state: 'visible' });
        assert.ok(await page.getByText(role === 'farmer' ? 'Résumé du jour' : /Bonjour, Awa/).isVisible(), `${role} non routé à ${width}px`);
        consoleErrors.assertNoUnexpectedErrors();
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test('UI mobile : panier, paiement local, confirmation et conversation sont accessibles', { skip: !browserBaseUrl }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of mobileWidths) {
      const { context, page, consoleErrors } = await openFreshMobilePage(browser, width);
      await register(page, 'buyer');
      await page.getByText('Messages', { exact: true }).first().click();
      assert.ok(await page.getByText('Messages', { exact: true }).first().isVisible(), `conversation inaccessible à ${width}px`);
      consoleErrors.assertNoUnexpectedErrors();
      await context.close();

      const purchase = await openFreshMobilePage(browser, width);
      await register(purchase.page, 'buyer');
       await purchase.page.getByText(serverProductName).first().click();
      await purchase.page.getByText('Ajouter au panier', { exact: true }).click();
      assert.ok(await purchase.page.getByText('Détail du produit', { exact: true }).isVisible(), `ajout panier inaccessible à ${width}px`);
      purchase.consoleErrors.assertNoUnexpectedErrors();
      await purchase.context.close();
    }
  } finally {
    await browser.close();
  }
});

test('UI mobile : offres du jour et choix d’un paiement local restent utilisables', { skip: !browserBaseUrl }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of mobileWidths) {
      const { context, page, consoleErrors } = await openFreshMobilePage(browser, width);
      await register(page, 'buyer');
      await page.getByText('Catégories', { exact: true }).last().click();
       await page.getByText(serverProductName).first().click();
      await page.getByText('Ajouter au panier', { exact: true }).click();
      await page.getByLabel('Retour').click();
      await page.getByText('Accueil', { exact: true }).last().click();
      assert.ok(await page.getByText('OFFRE DU JOUR', { exact: true }).first().isVisible(), `offre du jour absente à ${width}px`);
      await page.getByText('OFFRE DU JOUR', { exact: true }).first().click();
      assert.ok(await page.getByLabel('Prix actuel').isVisible(), `prix remisé absent dans le détail à ${width}px`);
      assert.ok(await page.getByLabel('Prix habituel').isVisible(), `prix d’origine absent dans le détail à ${width}px`);
      await page.getByText('Ajouter au panier', { exact: true }).click();
      await page.getByLabel('Retour').click();
      await page.getByLabel('Mon panier').click();
      const cartPrices = await page.getByText(/FCFA/).allTextContents();
      assert.ok(cartPrices.filter((value) => value.includes('FCFA')).length >= 3, `prix promotionnel, prix standard et total absents à ${width}px`);
      await page.getByLabel('Retour').click();
      await page.getByText('Profil', { exact: true }).last().click();
      await page.getByText('Moyen de paiement', { exact: true }).click();
      assert.ok(await page.getByText('Choisir un moyen de paiement', { exact: true }).isVisible(), `page de paiement inaccessible à ${width}px`);
      await page.getByText('MTN MoMo', { exact: true }).first().click();
      await page.getByText('Ajouter ce moyen', { exact: true }).click();
      assert.ok(await page.getByText('MTN MoMo', { exact: true }).last().isVisible(), `moyen MTN MoMo non ajouté à ${width}px`);
      consoleErrors.assertNoUnexpectedErrors();
      await context.close();
    }
  } finally {
    await browser.close();
  }
});

test('UI mobile : une offre ajoutée avant le prix standard garde son prix propre', { skip: !browserBaseUrl }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const { context, page, consoleErrors } = await openFreshMobilePage(browser, 390);
    await register(page, 'buyer');
    await page.getByText('OFFRE DU JOUR', { exact: true }).first().click();
    await page.getByText('Ajouter au panier', { exact: true }).click();
    await page.getByLabel('Retour').click();
    await page.getByText('Catégories', { exact: true }).last().click();
     await page.getByText(serverProductName).first().click();
    await page.getByText('Ajouter au panier', { exact: true }).click();
    await page.getByLabel('Retour').click();
    await page.getByLabel('Mon panier').click();
    const cartPrices = await page.getByText(/FCFA/).allTextContents();
    assert.ok(cartPrices.filter((value) => value.includes('FCFA')).length >= 3, 'prix promotionnel, prix standard ou total absent après ajout');
    consoleErrors.assertNoUnexpectedErrors();
    await context.close();
  } finally {
    await browser.close();
  }
});

test('UI mobile : intérêts et sécurité sont accessibles depuis le profil', { skip: !browserBaseUrl }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const { context, page, consoleErrors } = await openFreshMobilePage(browser, 390);
    await register(page, 'buyer');
    await page.getByText('Profil', { exact: true }).last().click();
    await page.getByText('Centre d’intérêts', { exact: true }).click();
    assert.ok(await page.getByText('Personnalisez les produits mis en avant', { exact: true }).isVisible(), 'centre d’intérêts inaccessible');
    await page.getByText('Fruits locaux', { exact: true }).click();
    await page.getByText('Légumes frais', { exact: true }).click();
    await page.getByText('Tubercules', { exact: true }).click();
    await page.getByText('Enregistrer mes intérêts', { exact: true }).click();
    await page.getByLabel('Retour').click();
    await page.getByText('Sécurité', { exact: true }).click();
    assert.ok(await page.getByText('Session sécurisée active', { exact: true }).isVisible(), 'page de sécurité inaccessible');
     assert.ok(await page.getByText('Réinitialiser mon mot de passe', { exact: true }).isVisible(), 'action de récupération absente');
    consoleErrors.assertNoUnexpectedErrors();
    await context.close();
  } finally {
    await browser.close();
  }
});

test('release : une erreur console inattendue bloque la validation mobile', () => {
  const consoleErrors = createConsoleErrorTracker(390);
  consoleErrors.recordConsoleMessage({
    type: () => 'error',
    text: () => 'Erreur de test non attendue',
  });

  assert.throws(
    () => consoleErrors.assertNoUnexpectedErrors(),
    /Erreur JavaScript non attendue dans le preview Expo Web à 390px[\s\S]*Erreur de test non attendue/,
  );
});

test('release : un drift Expo bloque la génération des fichiers', async () => {
  const fixtureDirectory = await mkdtemp(join(tmpdir(), 'adjal-release-build-'));
  const scriptsDirectory = join(fixtureDirectory, 'scripts');
  const expoDirectory = join(fixtureDirectory, 'node_modules', 'expo');
  const expoConstantsDirectory = join(
    fixtureDirectory,
    'node_modules',
    'expo-constants',
  );
  const generatedOutput = join(fixtureDirectory, 'generated-output.txt');

  try {
    await Promise.all([
      mkdir(scriptsDirectory, { recursive: true }),
      mkdir(expoDirectory, { recursive: true }),
      mkdir(expoConstantsDirectory, { recursive: true }),
    ]);
    await Promise.all([
      writeFile(
        join(fixtureDirectory, 'package.json'),
        JSON.stringify(
          {
            name: 'adjal-release-build-fixture',
            private: true,
            scripts: {
              build:
                'pnpm run validate:expo-compatibility && node scripts/generate-output.mjs',
              'validate:expo-compatibility':
                'node scripts/check-expo-compatibility.mjs',
            },
            devDependencies: {
              expo: '~54.0.37',
              'expo-constants': '~18.0.14',
            },
          },
          null,
          2,
        ),
      ),
      writeFile(
        join(fixtureDirectory, 'scripts', 'generate-output.mjs'),
        `import { writeFile } from 'node:fs/promises';\nawait writeFile(${JSON.stringify(generatedOutput)}, 'generated');\n`,
      ),
    ]);

    await Promise.all([
      writeFile(
        join(scriptsDirectory, 'check-expo-compatibility.mjs'),
        await readFile(resolve(scriptDirectory, 'check-expo-compatibility.mjs')),
      ),
      writeFile(
        join(expoDirectory, 'package.json'),
        JSON.stringify({ name: 'expo', version: '54.0.36' }),
      ),
      writeFile(
        join(expoConstantsDirectory, 'package.json'),
        JSON.stringify({ name: 'expo-constants', version: '18.0.14' }),
      ),
    ]);

    const build = spawnSync('pnpm', ['run', 'build'], {
      cwd: fixtureDirectory,
      encoding: 'utf8',
    });
    const output = `${build.stdout ?? ''}${build.stderr ?? ''}`;

    assert.notEqual(build.status, 0, 'le build doit échouer sur le drift Expo');
    assert.match(
      output,
      /expo: expected 54\.0\.37, installed 54\.0\.36/,
      'le message doit identifier les versions attendue et installée',
    );
    assert.equal(
      build.error,
      undefined,
      'pnpm doit pouvoir lancer le build de fixture',
    );
    assert.equal(
      await readFile(generatedOutput, 'utf8').catch(() => null),
      null,
      'la génération de fichiers ne doit pas démarrer après le drift',
    );
  } finally {
    await rm(fixtureDirectory, { recursive: true, force: true });
  }
});

test('release : un package Expo manquant bloque la génération des fichiers', async () => {
  const fixtureDirectory = await mkdtemp(join(tmpdir(), 'adjal-release-build-'));
  const scriptsDirectory = join(fixtureDirectory, 'scripts');
  const expoDirectory = join(fixtureDirectory, 'node_modules', 'expo');
  const generatedOutput = join(fixtureDirectory, 'generated-output.txt');

  try {
    await Promise.all([
      mkdir(scriptsDirectory, { recursive: true }),
      mkdir(expoDirectory, { recursive: true }),
    ]);
    await Promise.all([
      writeFile(
        join(fixtureDirectory, 'package.json'),
        JSON.stringify(
          {
            name: 'adjal-release-build-fixture',
            private: true,
            scripts: {
              build:
                'pnpm run validate:expo-compatibility && node scripts/generate-output.mjs',
              'validate:expo-compatibility':
                'node scripts/check-expo-compatibility.mjs',
            },
            devDependencies: {
              expo: '~54.0.37',
              'expo-constants': '~18.0.14',
            },
          },
          null,
          2,
        ),
      ),
      writeFile(
        join(fixtureDirectory, 'scripts', 'generate-output.mjs'),
        `import { writeFile } from 'node:fs/promises';\nawait writeFile(${JSON.stringify(generatedOutput)}, 'generated');\n`,
      ),
    ]);

    await Promise.all([
      writeFile(
        join(scriptsDirectory, 'check-expo-compatibility.mjs'),
        await readFile(resolve(scriptDirectory, 'check-expo-compatibility.mjs')),
      ),
      writeFile(
        join(expoDirectory, 'package.json'),
        JSON.stringify({ name: 'expo', version: '54.0.37' }),
      ),
    ]);

    const build = spawnSync('pnpm', ['run', 'build'], {
      cwd: fixtureDirectory,
      encoding: 'utf8',
    });
    const output = `${build.stdout ?? ''}${build.stderr ?? ''}`;

    assert.notEqual(build.status, 0, 'le build doit échouer sur le package Expo manquant');
    assert.match(
      output,
      /expo-constants is not installed/,
      'le message doit identifier clairement le package manquant',
    );
    assert.equal(
      build.error,
      undefined,
      'pnpm doit pouvoir lancer le build de fixture',
    );
    assert.equal(
      await readFile(generatedOutput, 'utf8').catch(() => null),
      null,
      'la génération de fichiers ne doit pas démarrer après le package manquant',
    );
  } finally {
    await rm(fixtureDirectory, { recursive: true, force: true });
  }
});
