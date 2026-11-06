import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ExpoLocation from 'expo-location';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView as KeyboardControllerAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { categories, formatOrderCode, Language, PaymentKind, Product, Role, useApp } from '@/src/app-context';
import { useColors } from '@/hooks/useColors';
import { translateText } from '@/src/i18n';
import {
  apiConfirmPasswordReset,
   apiCreateConversation,
   apiGetActiveAccounts,
   apiGetConversations,
   apiGetMessages,
   apiGetNotifications,
   apiMarkConversationRead,
   apiMarkNotificationRead,
   apiReportFarmer,
   apiRequestPasswordReset,
   apiSendMessage,
   apiAssetUrl,
   apiUpdateProfile,
   apiUploadProfileAvatar,
   ApiAccount,
   ApiConversation,
   ApiMessage,
   ApiNotification,
 } from '@/src/api-client';

const logo = require('@/assets/images/adjal-logo-transparent.png');
const whiteLogo = require('@/assets/images/adjal-logo-white-transparent.png');
const authWelcomeReference = require('@/assets/images/auth-welcome-reference.jpeg');

type Screen =
  | 'onboarding'
  | 'notifications'
  | 'role'
  | 'auth-choice'
  | 'auth'
  | 'interest-onboarding'
  | 'forgot-password'
  | 'reset-password'
  | 'home'
  | 'categories'
  | 'product'
  | 'cart'
  | 'messages'
  | 'orders'
  | 'order-detail'
  | 'profile'
  | 'payment-methods'
  | 'security'
  | 'interests'
  | 'dashboard'
  | 'farmer-products'
  | 'product-form'
  | 'farmer-orders'
  | 'sales'
  | 'farmer-profile';

type NavItem = { key: Screen; label: string; icon: keyof typeof Ionicons.glyphMap };

const buyerTabs: NavItem[] = [
  { key: 'home', label: 'Accueil', icon: 'home-outline' },
  { key: 'categories', label: 'Catégories', icon: 'grid-outline' },
  { key: 'orders', label: 'Commandes', icon: 'bag-handle-outline' },
  { key: 'messages', label: 'Messages', icon: 'chatbubble-outline' },
  { key: 'profile', label: 'Profil', icon: 'person-outline' },
];

const farmerTabs: NavItem[] = [
  { key: 'dashboard', label: 'Accueil', icon: 'home-outline' },
  { key: 'farmer-products', label: 'Produits', icon: 'cube-outline' },
  { key: 'farmer-orders', label: 'Commandes', icon: 'bag-handle-outline' },
  { key: 'messages', label: 'Messages', icon: 'chatbubble-outline' },
  { key: 'farmer-profile', label: 'Profil', icon: 'person-outline' },
];

const money = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`;
const languageOptions: { code: Language; label: string }[] = [
  { code: 'fr', label: 'Français' }, { code: 'en', label: 'English' },
];
const languageLabel = (code: Language) => languageOptions.find((item) => item.code === code)?.label ?? 'Français';
const countryOptions = [
  { code: '+237', name: 'Cameroun', flag: '🇨🇲', digits: 9 },
];
const navTranslations: Record<string, Partial<Record<Language, string>>> = {
  Accueil: { en: 'Home' },
  Catégories: { en: 'Categories' },
  Commandes: { en: 'Orders' },
  Messages: { en: 'Messages' },
  Profil: { en: 'Profile' },
};
const translateNav = (label: string, language: Language) => navTranslations[label]?.[language] ?? label;
let openCategoriesCart: (() => void) | undefined;

function translateNode(language: Language, child: React.ReactNode): React.ReactNode {
  if (typeof child === 'string') return translateText(language, child);
  if (Array.isArray(child)) return child.map((item) => translateNode(language, item));
  return child;
}

function Text(props: React.ComponentProps<typeof NativeText>) {
  const { language } = useApp();
  return <NativeText {...props}>{translateNode(language, props.children)}</NativeText>;
}

const TextInput = React.forwardRef<React.ComponentRef<typeof NativeTextInput>, React.ComponentProps<typeof NativeTextInput>>(function LocalizedTextInput(props, ref) {
  const { language } = useApp();
  return <NativeTextInput ref={ref} {...props} placeholder={props.placeholder ? translateText(language, props.placeholder) : props.placeholder} />;
});

const ToastContext = React.createContext<(message: string) => void>(() => undefined);

function useToast() {
  return React.useContext(ToastContext);
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useApp();
  const [message, setMessage] = useState<string | null>(null);
  const showToast = (nextMessage: string) => setMessage(translateText(language, nextMessage));
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2600);
    return () => clearTimeout(timer);
  }, [message]);
  return <ToastContext.Provider value={showToast}><View style={stylesFor(colors).toastRoot}>{children}{message && <View pointerEvents="none" style={[stylesFor(colors).toast, { top: insets.top + 14 }]}><Ionicons name="information-circle-outline" size={18} color={colors.primaryForeground} /><Text style={stylesFor(colors).toastText}>{message}</Text></View>}</View></ToastContext.Provider>;
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '').replace(/^0+/, '');
}

function initials(name: string | null | undefined) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Contenu d'un avatar : la photo de profil si l'utilisateur en a une, sinon ses initiales.
 * Se place dans n'importe quel conteneur d'avatar existant (rond).
 */
function AvatarFill({ name, uri, textStyle }: { name?: string | null; uri?: string | null; textStyle: object }) {
  if (uri) return <Image source={{ uri }} style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]} resizeMode="cover" accessibilityLabel={name ? `Photo de ${name}` : 'Photo de profil'} />;
  return <Text style={textStyle}>{initials(name)}</Text>;
}

async function selectImageFromLibrary(aspect: [number, number]) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('permission-denied');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.8,
  });
  return result.canceled ? null : result.assets[0]?.uri ?? null;
}

function useLocationTools() {
  const [isLocating, setIsLocating] = useState(false);
  const toast = useToast();
  const locate = async (onSuccess: (result: { location: string; address: string }) => void) => {
    setIsLocating(true);
    try {
      if (Platform.OS === 'web') {
        toast('Autorisez la position dans votre navigateur, puis ajustez votre adresse.');
        return;
      }
      const permission = await ExpoLocation.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        toast('Position non autorisée : saisissez votre ville et votre adresse manuellement.');
        return;
      }
      const position = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
      const [place] = await ExpoLocation.reverseGeocodeAsync(position.coords);
      const location = [place?.city, place?.region, place?.country].filter(Boolean).join(', ') || `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      const address = [place?.name, place?.street, place?.district, place?.city].filter(Boolean).join(', ') || location;
      onSuccess({ location, address });
    } catch {
      toast('Position indisponible : vérifiez l’autorisation ou saisissez votre adresse.');
    } finally {
      setIsLocating(false);
    }
  };
  const openInGoogleMaps = async (query: string) => {
    const target = encodeURIComponent(query.trim() || 'Cameroun');
    try {
      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${target}`);
    } catch {
      toast('Google Maps est indisponible. Saisissez votre adresse manuellement.');
    }
  };
  return { isLocating, locate, openInGoogleMaps };
}

export default function AppIndex() {
  return <ToastProvider><AppFlow /></ToastProvider>;
}

function AppFlow() {
  const { hydrated, hasSeenOnboarding, role, setRole, setHasSeenOnboarding, orders, products, language, profile, signOut, recordInteraction, refreshOrders, refreshFarmerListings } = useApp();
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [directConversation, setDirectConversation] = useState<{ contact?: string; contactId?: string; conversationId?: string } | null>(null);
  // Écran où revenir après avoir ouvert une notification (liste des notifications).
  const [returnScreen, setReturnScreen] = useState<Screen | null>(null);
  // Écran d'où l'on a ouvert la liste des notifications.
  const [notificationsOrigin, setNotificationsOrigin] = useState<Screen | null>(null);
  const toast = useToast();

  if (!hydrated) return null;

  if (!hasSeenOnboarding && screen === 'onboarding') {
    return <Onboarding onDone={() => setScreen('auth-choice')} />;
  }
  if (!role && screen !== 'auth' && screen !== 'auth-choice' && screen !== 'role') {
    return <AuthChoiceScreen onBack={() => setScreen('onboarding')} onCreate={() => setScreen('role')} onLogin={() => setScreen('auth')} onGuest={() => { setHasSeenOnboarding(true); setRole('guest'); setScreen('home'); }} />;
  }
  if (screen === 'auth-choice') return <AuthChoiceScreen onBack={() => setScreen(role ? 'home' : 'onboarding')} onCreate={() => setScreen('role')} onLogin={() => { setRole(null); setScreen('auth'); }} onGuest={() => { setHasSeenOnboarding(true); setRole('guest'); setScreen('home'); }} />;
  if (screen === 'role') return <RoleChoice onBack={() => setScreen('auth-choice')} onChoose={(nextRole) => nextRole === 'guest' ? setScreen('home') : setScreen('auth')} />;
  if (screen === 'forgot-password') return <ForgotPasswordScreen onBack={() => setScreen(role === 'farmer' ? 'farmer-profile' : role === 'buyer' ? 'profile' : 'auth')} onResetSuccess={async () => { await signOut(); setScreen('auth'); }} />;
  if (screen === 'auth') return <EnhancedAuthScreen initialMode={role ? 'register' : 'login'} onBack={() => setScreen(role ? 'role' : 'auth-choice')} onForgot={() => setScreen('forgot-password')} onRegisterRequest={() => { setRole(null); setScreen('role'); }} onSuccess={(serverRole, registered) => setScreen(serverRole === 'farmer' ? 'dashboard' : registered || !profile.interests.length ? 'interest-onboarding' : 'home')} />;
  if (screen === 'interest-onboarding' && role === 'buyer') return <InterestOnboarding onDone={() => setScreen('home')} />;

  /** Ouvre la source d'une notification : commande, conversation ou produit. */
  const openNotification = async (item: ApiNotification) => {
    const resourceType = item.resourceType ?? (item.type === 'message' ? 'conversation' : item.type.includes('order') ? 'order' : item.type.includes('product') ? 'product' : '');
    const resourceId = item.resourceId ?? undefined;
    if (!resourceId) return false;
    if (resourceType === 'order') {
      await refreshOrders();
      setSelectedOrderId(resourceId);
      setReturnScreen('notifications');
      setScreen('order-detail');
      return true;
    }
    if (resourceType === 'conversation') {
      setDirectConversation({ conversationId: resourceId });
      setScreen('messages');
      return true;
    }
    if (resourceType === 'product') {
      if (role === 'farmer') {
        await refreshFarmerListings();
        setScreen('farmer-products');
        return true;
      }
      const product = products.find((candidate) => candidate.id === resourceId);
      if (product) {
        setSelectedProduct(product);
        setScreen('product');
        return true;
      }
    }
    return false;
  };
  if (screen === 'notifications') return <NotificationsScreen onOpen={openNotification} onBack={() => { setScreen(notificationsOrigin ?? (role === 'farmer' ? 'dashboard' : 'home')); setNotificationsOrigin(null); }} />;

  const goToProduct = (product: Product) => {
    setSelectedProduct(product);
    void recordInteraction(product.id, 'view').catch(() => undefined);
    setScreen('product');
  };
  const goToOrder = (id: string) => {
    setSelectedOrderId(id);
    setScreen('order-detail');
  };
  const openOrderMessage = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
    const contact = role === 'farmer' ? (order.buyerName ?? order.customer) : (order.sellerName ?? order.items[0]?.product.farmer ?? 'Agriculteur');
     const contactId = role === 'farmer' ? order.buyerId : order.sellerId;
     if (!contactId) {
       Alert.alert('Messagerie', 'Impossible d\'ouvrir la conversation automatiquement. Sélectionnez un contact manuellement.', [{ text: 'OK', onPress: () => setScreen('messages') }]);
       return;
     }
     setDirectConversation({ contact, contactId });
     setScreen('messages');
   };
  const setBuyerScreen = (next: Screen) => {
    if (next === 'messages') setDirectConversation(null);
    if (next === 'notifications' && screen !== 'notifications') setNotificationsOrigin(screen);
    setScreen(next);
  };
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const orderContact = selectedOrder ? (role === 'farmer' ? (selectedOrder.buyerName ?? selectedOrder.customer) : (selectedOrder.sellerName ?? selectedOrder.items[0]?.product.farmer ?? 'Agriculteur')) : undefined;
  const orderContactId = selectedOrder ? (role === 'farmer' ? selectedOrder.buyerId : selectedOrder.sellerId) : undefined;
  const confirmSignOut = () => {
    Alert.alert('Se déconnecter ?', 'Voulez-vous vraiment fermer votre session sur cet appareil ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => { void signOut().finally(() => { setScreen('auth-choice'); toast('Vous êtes déconnecté.'); }); } },
    ]);
  };

  if (role === 'farmer') {
    if (screen === 'product-form') {
      return <FarmerProductForm product={productToEdit} onBack={() => setScreen('farmer-products')} onSaved={() => setScreen('farmer-products')} />;
    }
    if (screen === 'farmer-products') {
      return <FarmerProducts onAdd={() => { setProductToEdit(null); setScreen('product-form'); }} onEdit={(product) => { setProductToEdit(product); setScreen('product-form'); }} onNav={setBuyerScreen} />;
    }
    if (screen === 'order-detail' && selectedOrderId) return <OrderDetailView orderId={selectedOrderId} farmer onBack={() => { setScreen(returnScreen ?? 'farmer-orders'); setReturnScreen(null); }} onMessage={() => { setDirectConversation({ contact: orderContact, contactId: orderContactId }); setScreen('messages'); }} />;
    if (screen === 'farmer-orders') return <FarmerOrders onNav={setBuyerScreen} onOrder={(id) => { setSelectedOrderId(id); setScreen('order-detail'); }} onMessageOrder={openOrderMessage} />;
    if (screen === 'messages') return <LiveMessagesScreen initialContact={directConversation?.contact} initialContactId={directConversation?.contactId} initialConversationId={directConversation?.conversationId} onBack={() => setScreen('dashboard')} onNav={setBuyerScreen} />;
    if (screen === 'sales') return <SalesScreen onNav={setBuyerScreen} />;
    if (screen === 'payment-methods') return <PaymentMethodsScreen farmer onBack={() => setScreen('farmer-profile')} onNav={setBuyerScreen} />;
    if (screen === 'security') return <SecurityScreen farmer onBack={() => setScreen('farmer-profile')} onPasswordReset={() => setScreen('forgot-password')} onSignOut={confirmSignOut} />;
    if (screen === 'farmer-profile') return <AccountProfile farmer onNav={setBuyerScreen} onSignOut={confirmSignOut} />;
    return <FarmerDashboard onNav={setBuyerScreen} />;
  }

  if (role === 'guest' && ['cart', 'orders', 'messages', 'profile', 'security', 'interests'].includes(screen)) {
    const protectedTitle = screen === 'cart' ? 'Mon panier' : screen === 'orders' ? 'Mes commandes' : screen === 'messages' ? 'Messages' : screen === 'security' ? 'Sécurité' : screen === 'interests' ? 'Centre d’intérêts' : 'Mon profil';
    return <ProtectedScreen title={protectedTitle} onBack={() => setScreen('home')} onLogin={() => { setRole(null); setScreen('auth'); }} onCreate={() => { setRole(null); setScreen('role'); }} />;
  }

  if (screen === 'product' && selectedProduct) {
    return <ProductDetail product={selectedProduct} onBack={() => setScreen('home')} onProduct={goToProduct} />;
  }
    if (screen === 'order-detail' && selectedOrderId) {
      return <OrderDetailView orderId={selectedOrderId} onBack={() => { setScreen(returnScreen ?? 'orders'); setReturnScreen(null); }} onMessage={() => { setDirectConversation({ contact: orderContact, contactId: orderContactId }); setScreen('messages'); }} />;
    }
  if (screen === 'cart') return <CartScreen onBack={() => setScreen('home')} onDone={(id) => { setSelectedOrderId(id); setScreen('order-detail'); }} />;
  if (screen === 'messages') return <LiveMessagesScreen initialContact={directConversation?.contact} initialContactId={directConversation?.contactId} initialConversationId={directConversation?.conversationId} onBack={() => setScreen('home')} onNav={setBuyerScreen} />;
  if (screen === 'categories') return <CategoriesScreen onProduct={goToProduct} onNav={setBuyerScreen} />;
  if (screen === 'orders') return <OrdersScreen onOrder={goToOrder} onNav={setBuyerScreen} onMessageOrder={openOrderMessage} />;
  if (screen === 'payment-methods') return <PaymentMethodsScreen onBack={() => setScreen('profile')} onNav={setBuyerScreen} />;
  if (screen === 'security') return <SecurityScreen onBack={() => setScreen('profile')} onPasswordReset={() => setScreen('forgot-password')} onSignOut={confirmSignOut} />;
  if (screen === 'interests') return <InterestsScreen onBack={() => setScreen('profile')} />;
  if (screen === 'profile') return <AccountProfile onNav={setBuyerScreen} onSignOut={confirmSignOut} />;
  return <BuyerHome onProduct={goToProduct} onNav={setBuyerScreen} />;
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const colors = useColors();
  const { setHasSeenOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  const [slide, setSlide] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const slides = [
    { eyebrow: 'Pour les agriculteurs', title: 'Vendez directement, gagnez plus', body: 'Publiez vos récoltes en quelques secondes et connectez-vous à des milliers d’acheteurs au Cameroun.', image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1100&q=85', tint: colors.primary },
    { eyebrow: 'Pour les acheteurs', title: 'Achetez directement, gagnez en qualité', body: 'Visitez les publications des agriculteurs, commandez simplement et découvrez des produits proches de chez vous.', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1100&q=85', tint: colors.orange },
    { eyebrow: 'Zéro perte post-récolte', title: 'Réduisez les pertes, maximisez l’impact', body: 'Une place de marché pensée pour rapprocher les récoltes des familles et des professionnels.', image: 'https://images.unsplash.com/photo-1492496913980-501348b61469?w=1100&q=85', tint: colors.gold },
  ];
  const current = slides[slide];
  const finish = () => { setHasSeenOnboarding(true); onDone(); };
  useEffect(() => {
    const timeout = setTimeout(() => setShowSplash(false), 1700);
    return () => clearTimeout(timeout);
  }, []);
  if (showSplash) return <SplashIntro />;
  return (
    <View style={[stylesFor(colors).onboardingScreen, { paddingTop: insets.top }]}>
      <View style={stylesFor(colors).onboardingTop}><View /><Text style={stylesFor(colors).skip} onPress={finish}>Passer</Text></View>
      <View style={stylesFor(colors).onboardingPhotoFrame}>
        <Image source={{ uri: current.image }} style={stylesFor(colors).onboardingImage} />
        <View style={stylesFor(colors).onboardingImageMark}><Image source={whiteLogo} style={stylesFor(colors).onboardingImageLogo} resizeMode="contain" /></View>
      </View>
      <View style={stylesFor(colors).onboardingSheet}><View style={[stylesFor(colors).onboardingBadge, { backgroundColor: `${current.tint}22` }]}><Text style={[stylesFor(colors).onboardingBadgeText, { color: current.tint }]}>{current.eyebrow}</Text></View><Text style={stylesFor(colors).onboardingTitle}>{current.title}</Text><Text style={stylesFor(colors).onboardingBody}>{current.body}</Text><View style={stylesFor(colors).onboardingFooter}><View style={stylesFor(colors).dots}>{slides.map((_, index) => <View key={index} style={[stylesFor(colors).dot, { backgroundColor: index === slide ? current.tint : colors.border }]} />)}</View><View style={stylesFor(colors).onboardingActions}>{slide > 0 && <Pressable style={stylesFor(colors).onboardingBack} onPress={() => setSlide((value) => value - 1)}><Ionicons name="arrow-back" size={18} color={colors.foreground} /></Pressable>}<Pressable style={[stylesFor(colors).primaryButton, stylesFor(colors).onboardingNext, { backgroundColor: current.tint }]} onPress={() => slide === slides.length - 1 ? finish() : setSlide((value) => value + 1)}><Text style={stylesFor(colors).primaryButtonText}>{slide === slides.length - 1 ? 'Commencer' : 'Suivant'}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable></View></View></View>
    </View>
  );
}

function SplashIntro() {
  const colors = useColors();
  return <View style={stylesFor(colors).splashIntro}><View style={stylesFor(colors).splashRings}>{[0, 1, 2, 3, 4, 5].map((ring) => <View key={ring} style={[stylesFor(colors).splashRing, { width: 180 + ring * 68, height: 180 + ring * 68, borderRadius: 400 }]} />)}</View><Image source={whiteLogo} style={stylesFor(colors).splashLogo} resizeMode="contain" /><Text style={stylesFor(colors).splashTagline}>Chaque récolte compte</Text><Text style={stylesFor(colors).splashSubtitle}>Marché agricole camerounais</Text></View>;
}

function RoleChoice({ onChoose, onBack }: { onChoose: (role: Role) => void; onBack: () => void }) {
  const colors = useColors();
  const { setHasSeenOnboarding, setRole } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const choose = () => {
    if (!selectedRole || selectedRole === 'guest') return;
    setHasSeenOnboarding(true);
    setRole(selectedRole);
    onChoose(selectedRole);
  };
  return (
    <View style={[stylesFor(colors).screen, stylesFor(colors).roleScreen]}>
      <Pressable onPress={onBack} style={stylesFor(colors).backButton}><Ionicons name="arrow-back" size={21} color={colors.foreground} /></Pressable>
      <Image source={logo} style={stylesFor(colors).roleLogo} resizeMode="contain" />
      <Text style={stylesFor(colors).h1}>Bienvenue sur A Djal ! 🎉</Text>
      <Text style={stylesFor(colors).roleSubtitle}>Comment souhaitez-vous utiliser l’application ?</Text>
      <RoleCard testID="role-buyer" title="Acheteur" description="Je cherche des produits agricoles frais" details={['Accédez à des millions de produits', 'Prix directs des producteurs', 'Recevez des recommandations proches de chez vous']} icon="bag-outline" selected={selectedRole === 'buyer'} onPress={() => setSelectedRole('buyer')} />
      <RoleCard testID="role-farmer" title="Agriculteur" description="Je veux vendre mes récoltes" details={['Publier vos produits facilement', 'Touchez plus d’acheteurs', 'Réduisez vos pertes post-récolte']} icon="leaf-outline" selected={selectedRole === 'farmer'} onPress={() => setSelectedRole('farmer')} />
      <Pressable disabled={!selectedRole} style={[stylesFor(colors).roleStartButton, !selectedRole && stylesFor(colors).roleStartButtonDisabled]} onPress={choose}><Text style={stylesFor(colors).primaryButtonText}>Commencer</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable>
    </View>
  );
}

function RoleCard({ title, description, details, icon, selected, onPress, testID }: { title: string; description: string; details: string[]; icon: keyof typeof Ionicons.glyphMap; selected?: boolean; onPress: () => void; testID?: string }) {
  const colors = useColors();
  return <Pressable testID={testID} style={[stylesFor(colors).roleCard, selected && { borderColor: colors.primary, backgroundColor: colors.softGreen }]} onPress={onPress}><View style={[stylesFor(colors).roleIcon, { backgroundColor: selected ? colors.primary : colors.secondary }]}><Ionicons name={icon} size={21} color={selected ? colors.primaryForeground : colors.primary} /></View><View style={stylesFor(colors).roleContent}><View style={stylesFor(colors).rowBetween}><Text style={stylesFor(colors).cardTitle}>{title}</Text><View style={[stylesFor(colors).radio, selected && { borderColor: colors.primary, backgroundColor: colors.primary }]}>{selected && <View style={stylesFor(colors).radioDot} />}</View></View><Text style={stylesFor(colors).bodySmall}>{description}</Text>{details.map((detail) => <View key={detail} style={stylesFor(colors).detailRow}><Ionicons name="ellipse" size={10} color={selected ? colors.primary : colors.muted} /><Text style={stylesFor(colors).detailText}>{detail}</Text></View>)}</View></Pressable>;
}

function AuthChoiceScreen({ onBack, onCreate, onLogin, onGuest }: { onBack: () => void; onCreate: () => void; onLogin: () => void; onGuest: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return <View style={stylesFor(colors).authChoiceScreen}><View style={[stylesFor(colors).authChoiceHero, { paddingTop: insets.top }]}><Image source={authWelcomeReference} style={stylesFor(colors).authChoiceReference} resizeMode="stretch" /></View><View style={stylesFor(colors).authChoiceSheet}><Text style={stylesFor(colors).authChoiceLead}>Rejoignez la communauté agricole du Cameroun</Text><Pressable style={stylesFor(colors).authChoicePrimary} onPress={onCreate}><Text style={stylesFor(colors).authChoicePrimaryText}>Créer un compte</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable><Pressable style={stylesFor(colors).authChoiceOutline} onPress={onLogin}><Text style={stylesFor(colors).authChoiceOutlineText}>Se connecter</Text></Pressable><View style={stylesFor(colors).authChoiceDivider}><View style={stylesFor(colors).divider} /><Text style={stylesFor(colors).mutedText}>Continuer avec</Text><View style={stylesFor(colors).divider} /></View><View style={stylesFor(colors).socialRow}><SocialButton icon="logo-google" label="Google" /><SocialButton icon="logo-facebook" label="Facebook" /><SocialButton icon="call-outline" label="Téléphone" /></View><Pressable onPress={onGuest} style={stylesFor(colors).guestLink}><Text style={stylesFor(colors).mutedText}>Parcourir sans compte</Text><Ionicons name="arrow-forward" size={15} color={colors.mutedForeground} /></Pressable></View></View>;
}

function AuthScreen({ onBack, onSuccess, onForgot, onRegisterRequest, initialMode = 'login' }: { onBack: () => void; onSuccess: () => void; onForgot: () => void; onRegisterRequest: () => void; initialMode?: 'login' | 'register' }) {
  const colors = useColors();
  const { role, setRole, updateProfile, profile } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);
  const [crops, setCrops] = useState(profile.crops);
  const [surface, setSurface] = useState(profile.surface);
  const [error, setError] = useState('');
  const submit = () => {
    if (mode === 'register' && name.trim().length < 2) return setError('Saisissez votre nom complet.');
    if (!email.includes('@')) return setError('Saisissez une adresse email valide.');
    if (mode === 'register' && (!phone.trim() || !location.trim())) return setError('Renseignez votre téléphone et votre localisation.');
    if (mode === 'register' && role === 'farmer' && (!crops.trim() || !surface.trim())) return setError('Renseignez vos cultures et votre superficie.');
    if (mode === 'login' && password.length < 4) return setError('Le mot de passe doit contenir au moins 4 caractères.');
    if (mode === 'register') updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim(), location: location.trim(), crops: crops.trim(), surface: surface.trim() });
    if (!role) setRole('buyer');
    setError('');
    onSuccess();
  };
  const isFarmer = role === 'farmer';
  return <KeyboardAvoidingView style={stylesFor(colors).screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={stylesFor(colors).authScroll} keyboardShouldPersistTaps="handled"><Pressable onPress={onBack} style={stylesFor(colors).backButton}><Ionicons name="arrow-back" size={21} color={colors.foreground} /></Pressable><Text style={stylesFor(colors).authPageTitle}>{mode === 'login' ? 'Bon retour' : 'Créer un compte'}</Text><Text style={stylesFor(colors).authPageSubtitle}>{mode === 'login' ? 'Connectez-vous à votre compte A DJAL' : isFarmer ? 'Rejoignez le marché agricole du Cameroun' : 'Créez votre compte acheteur en quelques étapes'}</Text>{mode === 'register' && <Field label="Nom complet" placeholder="Cendra Ngande" value={name} onChangeText={setName} icon="person-outline" />}{<Field label="Adresse email" placeholder="cendra@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" icon="mail-outline" />}{mode === 'register' && <><Field label="Numéro de téléphone" placeholder="CM +237 | Cendra Ngande" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="call-outline" /><Field label="Localisation" placeholder="Yaoundé, Cameroun" value={location} onChangeText={setLocation} icon="location-outline" />{isFarmer && <><Field label="Cultures principales" placeholder="Manioc, maïs, arachide" value={crops} onChangeText={setCrops} icon="leaf-outline" /><Field label="Superficie" placeholder="1 ha" value={surface} onChangeText={setSurface} icon="resize-outline" /></>}</>}{mode === 'login' && <Field label="Mot de passe" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry icon="lock-closed-outline" />}{error ? <Text style={stylesFor(colors).errorText}>{error}</Text> : null}<Pressable style={stylesFor(colors).primaryButton} onPress={submit}><Text style={stylesFor(colors).primaryButtonText}>{mode === 'login' ? 'Se connecter' : 'Créer le compte'}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable>{mode === 'login' && <Pressable onPress={onForgot}><Text style={stylesFor(colors).linkText}>Mot de passe oublié ?</Text></Pressable>}{mode === 'login' && <><View style={stylesFor(colors).orRow}><View style={stylesFor(colors).divider} /><Text style={stylesFor(colors).mutedText}>Ou</Text><View style={stylesFor(colors).divider} /></View><View style={stylesFor(colors).socialRow}><SocialButton icon="logo-google" label="Google" /><SocialButton icon="logo-facebook" label="Facebook" /><SocialButton icon="call-outline" label="Téléphone" /></View></>}<Pressable onPress={() => mode === 'login' ? onRegisterRequest() : setMode('login')}><Text style={stylesFor(colors).switchAuth}>{mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}<Text style={stylesFor(colors).linkText}>{mode === 'login' ? 'S’inscrire' : 'Se connecter'}</Text></Text></Pressable></ScrollView></KeyboardAvoidingView>;
}

function CountryPhoneField({ countryCode, phone, onCountryChange, onPhoneChange }: { countryCode: string; phone: string; onCountryChange: (country: typeof countryOptions[number]) => void; onPhoneChange: (value: string) => void }) {
  const colors = useColors();
  const selected = countryOptions.find((country) => country.code === countryCode) ?? countryOptions[0];
  const chooseCountry = () => Alert.alert('Pays et indicatif', 'Choisissez votre pays.', [...countryOptions.map((country) => ({ text: `${country.flag} ${country.name} (${country.code})`, onPress: () => onCountryChange(country) })), { text: 'Annuler', style: 'cancel' }]);
  return <View style={stylesFor(colors).field}><Text style={stylesFor(colors).fieldLabel}>Numéro de téléphone</Text><View style={stylesFor(colors).phoneRow}><Pressable style={stylesFor(colors).countryPicker} onPress={chooseCountry}><Text style={stylesFor(colors).countryFlag}>{selected.flag}</Text><Text style={stylesFor(colors).countryCode}>{selected.code}</Text><Ionicons name="chevron-down" size={14} color={colors.mutedForeground} /></Pressable><View style={stylesFor(colors).phoneInputWrap}><Ionicons name="call-outline" size={18} color={colors.mutedForeground} /><TextInput value={phone} onChangeText={(value) => onPhoneChange(value.replace(/[^\d\s]/g, ''))} placeholder={`Ex. ${selected.digits === 9 ? '6 90 00 00 00' : '00 00 00 00 00'}`} placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" style={stylesFor(colors).input} /></View></View><Text style={stylesFor(colors).fieldHint}>{selected.name} · {selected.digits} chiffres attendus</Text></View>;
}

function UnitSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  // Unités de vente des produits agricoles (pas d'unités de surface).
  const units = ['kg', 'unité', 'sac', 'caisse', 'filet', 'régime', 'tas', 'litre'];
  const [custom, setCustom] = useState(value && !units.includes(value) ? value : '');
  const isOther = !units.includes(value);
  return <View>
    <Pressable style={stylesFor(colors).chip} onPress={() => setOpen((current) => !current)}><Text style={stylesFor(colors).chipText}>{isOther ? 'Autre' : value}</Text><Ionicons name="chevron-down" size={16} color={colors.primary} /></Pressable>
    {open && <View style={stylesFor(colors).chipWrap}>{units.map((unit) => <Pressable key={unit} style={[stylesFor(colors).chip, unit === value && stylesFor(colors).chipActive]} onPress={() => { onChange(unit); setCustom(''); setOpen(false); }}><Text style={[stylesFor(colors).chipText, unit === value && stylesFor(colors).chipTextActive]}>{unit}</Text></Pressable>)}<Pressable style={[stylesFor(colors).chip, isOther && stylesFor(colors).chipActive]} onPress={() => { onChange(custom || value); setOpen(false); }}><Text style={[stylesFor(colors).chipText, isOther && stylesFor(colors).chipTextActive]}>Autre</Text></Pressable>{isOther && <TextInput value={custom} onChangeText={(next) => { setCustom(next); onChange(next); }} placeholder="Unité personnalisée" placeholderTextColor={colors.mutedForeground} style={stylesFor(colors).interestOtherInput} />}</View>}
  </View>;
}

function LocationEditor({ location, address, onLocationChange, onAddressChange }: { location: string; address: string; onLocationChange: (value: string) => void; onAddressChange: (value: string) => void }) {
  const colors = useColors();
  const { isLocating, locate, openInGoogleMaps } = useLocationTools();
  return <><Field label="Ville et pays" placeholder="Yaoundé, Cameroun" value={location} onChangeText={onLocationChange} icon="location-outline" /><Field label="Adresse" placeholder="Quartier, rue ou point de repère" value={address} onChangeText={onAddressChange} icon="home-outline" /><View style={stylesFor(colors).locationActions}><Pressable style={stylesFor(colors).locationButton} onPress={() => locate(({ location: detectedLocation, address: detectedAddress }) => { onLocationChange(detectedLocation); onAddressChange(detectedAddress); })}><Ionicons name="locate-outline" size={18} color={colors.primary} /><Text style={stylesFor(colors).locationButtonText}>{isLocating ? 'Recherche de la position…' : 'Utiliser ma position'}</Text></Pressable><Pressable style={stylesFor(colors).mapButton} onPress={() => openInGoogleMaps(`${address} ${location}`)}><Ionicons name="map-outline" size={18} color={colors.primaryForeground} /><Text style={stylesFor(colors).mapButtonText}>Ajuster dans Maps</Text></Pressable></View></>;
}

function EnhancedAuthScreen({ onBack, onSuccess, onForgot, onRegisterRequest, initialMode = 'login' }: { onBack: () => void; onSuccess: (serverRole: 'buyer' | 'farmer', registered: boolean) => void; onForgot: () => void; onRegisterRequest: () => void; initialMode?: 'login' | 'register' }) {
  const colors = useColors();
  const { role, signIn, registerAccount, profile, updateProfile } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(profile.countryCode);
  const [countryName, setCountryName] = useState(profile.countryName);
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [crops, setCrops] = useState('');
  const [surface, setSurface] = useState('');
  const [surfaceUnit, setSurfaceUnit] = useState('ha');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isFarmer = role === 'farmer';
  const selectedCountry = countryOptions.find((country) => country.code === countryCode) ?? countryOptions[0];

  const submit = async () => {
    if (loading) return;
    const digits = normalizePhone(phone);
    if (mode === 'register') {
      if (name.trim().length < 2) return setError('Saisissez votre nom complet.');
      if (!email.includes('@')) return setError('Saisissez une adresse email valide.');
      if (digits.length !== selectedCountry.digits) return setError(`Saisissez les ${selectedCountry.digits} chiffres de votre numéro ${selectedCountry.name}.`);
      if (password.length < 10) return setError('Le mot de passe doit contenir au moins 10 caractères.');
      if (!location.trim()) return setError('Renseignez votre ville.');
      if (isFarmer && (!crops.trim() || !surface.trim() || Number(surface.replace(',', '.')) <= 0)) return setError('Renseignez vos cultures et une superficie valide.');
    } else {
      if (!email.includes('@')) return setError('Saisissez une adresse email valide.');
      if (password.length < 1) return setError('Saisissez votre mot de passe.');
    }
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const city = location.trim().split(',')[0].trim() || location.trim();
        const resolvedRole = await registerAccount({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: `${countryCode}${digits}`,
          city,
          role: isFarmer ? 'farmer' : 'buyer',
        });
        if (isFarmer) {
          updateProfile({ crops: crops.trim(), surface: `${surface.trim()} ${surfaceUnit}` });
        }
        onSuccess(resolvedRole, true);
      } else {
        const resolvedRole = await signIn(email.trim(), password);
        onSuccess(resolvedRole, false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return <KeyboardAvoidingView style={stylesFor(colors).screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={stylesFor(colors).authScroll} keyboardShouldPersistTaps="handled"><Pressable onPress={onBack} style={stylesFor(colors).backButton}><Ionicons name="arrow-back" size={21} color={colors.foreground} /></Pressable><Text style={stylesFor(colors).authPageTitle}>{mode === 'login' ? 'Bon retour' : 'Créer un compte'}</Text><Text style={stylesFor(colors).authPageSubtitle}>{mode === 'login' ? 'Connectez-vous à votre compte A DJAL' : isFarmer ? 'Rejoignez le marché agricole du Cameroun' : 'Créez votre compte acheteur en quelques étapes'}</Text>{mode === 'register' && <Field label="Nom complet" placeholder="Cendra Ngande" value={name} onChangeText={setName} icon="person-outline" />}{<Field label="Adresse email" placeholder="cendra@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" icon="mail-outline" />}{mode === 'register' && <><CountryPhoneField countryCode={countryCode} phone={phone} onCountryChange={(country) => { setCountryCode(country.code); setCountryName(country.name); }} onPhoneChange={setPhone} /><LocationEditor location={location} address={address} onLocationChange={setLocation} onAddressChange={setAddress} />{isFarmer && <><Field label="Cultures principales" placeholder="Manioc, maïs, arachide" value={crops} onChangeText={setCrops} icon="leaf-outline" /><View style={stylesFor(colors).surfaceRow}><View style={stylesFor(colors).surfaceInput}><Field label="Superficie" placeholder="1" value={surface} onChangeText={setSurface} keyboardType="decimal-pad" icon="resize-outline" /></View><SurfaceUnitPicker value={surfaceUnit} onChange={setSurfaceUnit} /></View></>}</>}<Field label="Mot de passe" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry icon="lock-closed-outline" />{error ? <Text style={stylesFor(colors).errorText}>{error}</Text> : null}<Pressable style={[stylesFor(colors).primaryButton, loading && { opacity: 0.65 }]} onPress={submit} disabled={loading}><Text style={stylesFor(colors).primaryButtonText}>{loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}</Text>{!loading && <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />}</Pressable>{mode === 'login' && <Pressable onPress={onForgot}><Text style={stylesFor(colors).linkText}>Mot de passe oublié ?</Text></Pressable>}<Pressable onPress={() => mode === 'login' ? onRegisterRequest() : setMode('login')}><Text style={stylesFor(colors).switchAuth}>{mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}<Text style={stylesFor(colors).linkText}>{mode === 'login' ? 'S\u2019inscrire' : 'Se connecter'}</Text></Text></Pressable></ScrollView></KeyboardAvoidingView>;
}

const surfaceUnits = [
  { value: 'ha', label: 'ha' },
  { value: 'm²', label: 'm²' },
  { value: 'acre', label: 'acre' },
  { value: 'are', label: 'are' },
];

function SurfaceUnitPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const selected = surfaceUnits.find((unit) => unit.value === value) ?? surfaceUnits[0];
  return <View style={stylesFor(colors).surfacePickerWrap}>
    <Text style={stylesFor(colors).fieldLabel}>Unité</Text>
    <Pressable accessibilityLabel="Unité de superficie" style={stylesFor(colors).surfacePicker} onPress={() => setOpen((current) => !current)}>
      <Text style={stylesFor(colors).surfacePickerText}>{selected.label}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
    </Pressable>
    {open && <View style={stylesFor(colors).surfaceOptions}>{surfaceUnits.map((unit) => <Pressable key={unit.value} style={[stylesFor(colors).surfaceOption, unit.value === value && stylesFor(colors).surfaceOptionActive]} onPress={() => { onChange(unit.value); setOpen(false); }}><Text style={[stylesFor(colors).surfaceOptionText, unit.value === value && stylesFor(colors).surfaceOptionTextActive]}>{unit.label}</Text>{unit.value === value && <Ionicons name="checkmark" size={16} color={colors.primary} />}</Pressable>)}</View>}
  </View>;
}

function ForgotPasswordScreen({ onBack, onResetSuccess }: { onBack: () => void; onResetSuccess: () => Promise<void> }) {
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (loading) return;
    if (step === 'email') {
      if (!email.includes('@')) return setError('Saisissez une adresse email valide.');
      setLoading(true);
      try {
        await apiRequestPasswordReset(email.trim());
        setError('');
        setStep('reset');
      } catch {
        setError('La demande n’a pas pu être envoyée. Réessayez dans un instant.');
      } finally {
        setLoading(false);
      }
      return;
    }
    const code = token.replace(/\s/g, '');
    if (!/^\d{6}$/.test(code) && code.length < 40) return setError('Saisissez le code à 6 chiffres reçu par email.');
    if (newPassword.length < 10) return setError('Le nouveau mot de passe doit contenir au moins 10 caractères.');
    if (newPassword !== confirmation) return setError('Les deux mots de passe ne correspondent pas.');
    setLoading(true);
    try {
      await apiConfirmPasswordReset(code, newPassword, email.trim());
      await onResetSuccess();
      Alert.alert('Mot de passe réinitialisé', 'Votre nouveau mot de passe est enregistré. Connectez-vous à nouveau.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Le code de récupération est invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };
  const resend = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await apiRequestPasswordReset(email.trim());
      setError('');
      Alert.alert('E-mail envoyé', 'Si cette adresse est associée à un compte, un nouveau code de récupération vient d’être envoyé.');
    } catch {
      setError('La demande n’a pas pu être envoyée. Réessayez dans un instant.');
    } finally {
      setLoading(false);
    }
  };
  const title = step === 'email' ? 'Mot de passe oublié' : 'Nouveau mot de passe';
  const subtitle = step === 'email'
    ? 'Saisissez votre adresse email. Pour votre sécurité, le résultat ne révèle jamais si un compte existe.'
    : `Si cette adresse est associée à un compte, un code à 6 chiffres a été envoyé à ${email}. Pensez à vérifier les spams. Il expire dans 15 minutes.`;
  return <KeyboardAvoidingView style={stylesFor(colors).screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={stylesFor(colors).authScroll} keyboardShouldPersistTaps="handled"><Pressable onPress={step === 'email' ? onBack : () => { setError(''); setStep('email'); }} style={stylesFor(colors).backButton}><Ionicons name="arrow-back" size={21} color={colors.foreground} /></Pressable><View style={stylesFor(colors).resetProgress}><View style={[stylesFor(colors).resetProgressFill, { width: step === 'email' ? '50%' : '100%' }]} /></View><Text style={stylesFor(colors).authPageTitle}>{title}</Text><Text style={stylesFor(colors).authPageSubtitle}>{subtitle}</Text>{step === 'email' && <Field label="Adresse email" placeholder="vous@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" icon="mail-outline" />}{step === 'reset' && <><Field label="Code de récupération" placeholder="Code à 6 chiffres" value={token} onChangeText={(value) => setToken(value.replace(/[^0-9]/g, '').slice(0, 6))} keyboardType="numeric" icon="shield-checkmark-outline" /><Pressable onPress={resend}><Text style={stylesFor(colors).linkText}>Renvoyer un code</Text></Pressable><Field label="Nouveau mot de passe" placeholder="Au moins 10 caractères" value={newPassword} onChangeText={setNewPassword} secureTextEntry icon="lock-closed-outline" /><Field label="Confirmer le mot de passe" placeholder="••••••••" value={confirmation} onChangeText={setConfirmation} secureTextEntry icon="lock-closed-outline" /></>}{error ? <Text style={stylesFor(colors).errorText}>{error}</Text> : null}<Pressable style={[stylesFor(colors).primaryButton, loading && { opacity: 0.65 }]} onPress={submit} disabled={loading}><Text style={stylesFor(colors).primaryButtonText}>{loading ? 'Veuillez patienter…' : step === 'email' ? 'Recevoir le code' : 'Réinitialiser le mot de passe'}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable></ScrollView></KeyboardAvoidingView>;
}

function Field({ label, placeholder, value, onChangeText, icon, secureTextEntry, keyboardType, testID }: { label: string; placeholder: string; value: string; onChangeText: (value: string) => void; icon: keyof typeof Ionicons.glyphMap; secureTextEntry?: boolean; keyboardType?: 'email-address' | 'phone-pad' | 'decimal-pad' | 'numeric' | 'default'; testID?: string }) {
  const colors = useColors();
  // Œil pour afficher / masquer le mot de passe.
  const [passwordVisible, setPasswordVisible] = useState(false);
  return <View style={stylesFor(colors).field}><Text style={stylesFor(colors).fieldLabel}>{label}</Text><View style={stylesFor(colors).inputWrap}><Ionicons name={icon} size={18} color={colors.mutedForeground} /><TextInput testID={testID} style={stylesFor(colors).input} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry && !passwordVisible} autoCapitalize={secureTextEntry ? 'none' : undefined} autoCorrect={secureTextEntry ? false : undefined} keyboardType={keyboardType ?? 'default'} />{secureTextEntry && <Pressable onPress={() => setPasswordVisible((visible) => !visible)} hitSlop={10} accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}><Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} /></Pressable>}</View></View>;
}

function SocialButton({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const colors = useColors();
  const toast = useToast();
  return <Pressable style={stylesFor(colors).socialButton} onPress={() => toast(`La connexion ${label} sera disponible avec le service d’authentification.`)}><Ionicons name={icon} size={18} color={colors.foreground} /><Text style={stylesFor(colors).bodySmall}>{label}</Text></Pressable>;
}

function AppHeader({ title, subtitle, location, onBack, right, dark = false, farmer = false }: { title: string; subtitle?: string; location?: string; onBack?: () => void; right?: React.ReactNode; dark?: boolean; farmer?: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cartCount, profile } = useApp();
  const cart = title === 'Catégories' ? <Pressable accessibilityLabel="Mon panier" style={stylesFor(colors).cartHeader} onPress={() => openCategoriesCart?.()}><Ionicons name="cart-outline" size={22} color={colors.primary} />{cartCount > 0 && <View style={stylesFor(colors).countBadge}><Text style={stylesFor(colors).countText}>{cartCount}</Text></View>}</Pressable> : null;
  const resolvedTitle = title === 'Bonjour, Cendra 👋' ? `Bonjour, ${profile.name.split(' ')[0]} 👋` : title;
  const resolvedLocation = location === 'Yaoundé, Cameroun' ? profile.location : location;
  return <View style={[stylesFor(colors).header, farmer && stylesFor(colors).headerFarmer, { paddingTop: insets.top + 10 }]}><View style={stylesFor(colors).rowBetween}><View style={stylesFor(colors).headerBrand}>{onBack ? <Pressable accessibilityLabel="Retour" onPress={onBack} style={stylesFor(colors).iconButton}><Ionicons name="arrow-back" size={22} color={farmer ? colors.primaryForeground : colors.foreground} /></Pressable> : <Image source={farmer ? whiteLogo : logo} style={stylesFor(colors).headerLogo} resizeMode="contain" />}</View><View style={stylesFor(colors).headerRight}>{cart}{right}<View style={stylesFor(colors).marketBadge}><Text style={stylesFor(colors).marketBadgeText}>Marché agricole</Text></View></View></View>{resolvedLocation && <View style={stylesFor(colors).headerLocation}><Ionicons name="location-outline" size={14} color={farmer ? colors.primaryForeground : colors.primary} /><Text style={[stylesFor(colors).headerLocationText, farmer && { color: colors.primaryForeground }]}>{resolvedLocation}</Text></View>}<Text style={[stylesFor(colors).headerTitle, farmer && { color: colors.primaryForeground }]}>{resolvedTitle}</Text>{subtitle && <Text style={[stylesFor(colors).headerSubtitle, farmer && { color: 'rgba(255,255,255,0.78)' }]}>{subtitle}</Text>}</View>;
}

const categoryImages: Record<string, string> = {
  all: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=85',
  fruits: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=300&q=85',
  legumes: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=85',
  tubercules: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&q=85',
  cereales: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&q=85',
};
const categoryImageFor = (category: { slug: string; imageUrl?: string | null } | string) => {
  if (typeof category === 'string') return categoryImages[category] ?? categoryImages.all;
  return category.imageUrl ?? categoryImages[category.slug] ?? categoryImages.all;
};
const rememberCategoryImages = (categories: Array<{ slug: string; imageUrl?: string | null }>) => {
  categories.forEach((category) => {
    if (category.imageUrl) categoryImages[category.slug] = category.imageUrl;
  });
};

function NotificationCenter({ onBack }: { onBack: () => void }) {
  const colors = useColors();
  const { accessToken, profile, notificationsEnabled } = useApp();
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    if (!accessToken || !notificationsEnabled) { setItems([]); setLoading(false); return; }
    try { setItems(await apiGetNotifications(accessToken)); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [accessToken, notificationsEnabled]);
  const unread = items.filter((item) => !item.readAt).length;
  const markRead = async (id: string) => {
    if (!accessToken) return;
    await apiMarkNotificationRead(accessToken, id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
  };
  return <View style={stylesFor(colors).screen}><AppHeader title="Notifications" onBack={onBack} subtitle={notificationsEnabled ? `${unread} non lue(s)` : 'Désactivées'} /><ScrollView contentContainerStyle={stylesFor(colors).pageContent}>{!notificationsEnabled ? <EmptyState icon="notifications-off-outline" title="Notifications désactivées" body="Activez les notifications depuis votre profil pour recevoir les mises à jour." /> : loading ? <Text style={stylesFor(colors).body}>Chargement…</Text> : items.length === 0 ? <EmptyState icon="notifications-outline" title="Aucune notification" body="Les commandes, messages et événements importants apparaîtront ici." /> : items.map((item) => <Pressable key={item.id} style={stylesFor(colors).notificationCard} onPress={() => void markRead(item.id)}><View style={stylesFor(colors).notificationIcon}><Ionicons name={item.type === 'message' ? 'chatbubble-outline' : item.type === 'order' ? 'bag-handle-outline' : 'notifications-outline'} size={18} color={colors.primary} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>{item.title}</Text><Text style={stylesFor(colors).bodySmall}>{item.body}</Text><Text style={stylesFor(colors).hintText}>{new Date(item.createdAt).toLocaleString('fr-FR')}</Text></View>{!item.readAt && <View style={stylesFor(colors).countBadge}><Text style={stylesFor(colors).countText}>1</Text></View>}</Pressable>)}</ScrollView></View>;
}

function BuyerHome({ onProduct, onNav }: { onProduct: (product: Product) => void; onNav: (screen: Screen) => void }) {
  const colors = useColors();
  const toast = useToast();
  const { products, recommendations, role, cartCount, dailyOffers, profile, categories: categoryOptions, recordInteraction, notifications, notificationsEnabled, refreshNotifications } = useApp();
  rememberCategoryImages(categoryOptions);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const matches = (product: Product) => (category === 'all' || product.category === category) && `${product.name} ${product.category} ${product.farmer} ${product.location}`.toLowerCase().includes(query.trim().toLowerCase());
  const recommendationSource = recommendations.length ? recommendations : products;
  const filtered = useMemo(() => recommendationSource.filter(matches), [category, recommendationSource, products]);
  const popular = useMemo(() => (recommendations.length ? recommendations : products.filter((product) => product.isPopular)).slice(0, 4), [products, recommendations]);
  const featured = query || category !== 'all' ? products.filter(matches).slice(0, 4) : popular;
  const offers = dailyOffers.map((offer) => ({ ...offer, product: products.find((product) => product.id === offer.productId) })).filter((offer): offer is typeof offer & { product: Product } => !!offer.product && offer.product.stock > 0);
  useEffect(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 3 || role !== 'buyer') return;
    const match = products.find((product) => `${product.name} ${product.category} ${product.farmer} ${product.location}`.toLowerCase().includes(normalized));
    if (match) void recordInteraction(match.id, 'search').catch(() => undefined);
  }, [products, query, recordInteraction, role]);
  useEffect(() => {
    if (!notificationsEnabled) return;
    void refreshNotifications();
    const timer = setInterval(() => void refreshNotifications(), 15000);
    return () => clearInterval(timer);
  }, [notificationsEnabled, refreshNotifications]);
  const cartButton = <Pressable accessibilityLabel="Mon panier" style={stylesFor(colors).cartHeader} onPress={() => onNav('cart')}><Ionicons name="cart-outline" size={21} color={colors.primary} />{cartCount > 0 && <View style={stylesFor(colors).countBadge}><Text style={stylesFor(colors).countText}>{cartCount}</Text></View>}</Pressable>;
  return <View style={stylesFor(colors).screen}><AppHeader title={`Bonjour, ${profile.name.split(' ')[0]} 👋`} location={profile.location} subtitle="Votre marché agricole local" right={<View style={stylesFor(colors).headerActions}>{cartButton}<Pressable style={stylesFor(colors).headerCircle} onPress={() => onNav('notifications')}><Ionicons name="notifications-outline" size={19} color={colors.primary} /><View style={stylesFor(colors).unreadBadge}><Text style={stylesFor(colors).unreadText}>{notifications.filter((item) => !item.readAt).length}</Text></View></Pressable><Pressable style={stylesFor(colors).headerCircle} onPress={() => onNav('profile')}><Ionicons name="person-outline" size={19} color={colors.primary} /></Pressable></View>} /><ScrollView contentContainerStyle={stylesFor(colors).pageContent} showsVerticalScrollIndicator={false}><View style={stylesFor(colors).searchBar}><Ionicons name="search" size={20} color={colors.mutedForeground} /><TextInput value={query} onChangeText={setQuery} placeholder="Rechercher un produit ou un agriculteur" placeholderTextColor={colors.mutedForeground} style={stylesFor(colors).searchInput} /><Ionicons name="options-outline" size={20} color={colors.primary} /></View><DailyOffersCarousel offers={offers} onProduct={onProduct} /><SectionHeader title="Catégories" action="Voir tout" onPress={() => onNav('categories')} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stylesFor(colors).categoryScroll}>{categoryOptions.slice(1).map((item) => <Pressable key={item.id} style={stylesFor(colors).categoryItem} onPress={() => onNav('categories')}><Image source={{ uri: categoryImageFor(item) }} style={stylesFor(colors).categoryImage} /><Text style={stylesFor(colors).categoryLabel}>{item.label}</Text></Pressable>)}</ScrollView><SectionHeader title="Produits vedettes" action="Voir tout" onPress={() => onNav('categories')} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stylesFor(colors).horizontalList}>{featured.map((product) => <ProductCard key={product.id} product={product} compact onPress={() => onProduct(product)} />)}</ScrollView><SectionHeader title="Recommandés" action={`${filtered.length} produits`} /><View style={stylesFor(colors).recommendList}>{filtered.slice(0, 5).map((product) => <RecommendationCard key={product.id} product={product} onPress={() => onProduct(product)} />)}</View>{filtered.length === 0 && <EmptyState icon="search-outline" title="Aucun produit trouvé" body="Essayez une autre recherche ou une autre catégorie." />}<SectionHeader title="Prix du marché" action={`${products.length} produits`} onPress={() => onNav('categories')} /><View style={stylesFor(colors).marketCard}><View style={stylesFor(colors).marketHeader}><View><Text style={stylesFor(colors).marketKicker}>PRIX DU CATALOGUE</Text><Text style={stylesFor(colors).marketTitle}>Produits actuellement disponibles</Text></View><Ionicons name="storefront-outline" size={25} color={colors.primary} /></View><View style={stylesFor(colors).marketRows}>{products.filter((product) => product.stock > 0).slice(0, 3).map((product) => <MarketPrice key={product.id} name={product.name} price={money(product.price)} trend={product.location} />)}</View></View></ScrollView><BottomNav items={buyerTabs} active="home" onPress={(key) => onNav(key)} /></View>;
}

function DailyOffersCarousel({ offers, onProduct }: { offers: Array<{ id: string; label: string; availability: string; expiresAt: string; product: Product }>; onProduct: (product: Product) => void }) {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (offers.length < 2) return;
    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % offers.length;
        scrollRef.current?.scrollTo({ x: next * 328, animated: true });
        return next;
      });
    }, 4200);
    return () => clearInterval(timer);
  }, [offers.length]);
  if (!offers.length) return null;
  return <View style={stylesFor(colors).offersBlock}><ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(event) => setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / 328))} contentContainerStyle={stylesFor(colors).offersScroll}>{offers.map((offer) => <Pressable key={offer.id} style={stylesFor(colors).offerCard} onPress={() => onProduct({ ...offer.product, offerId: offer.id })}><Image source={{ uri: offer.product.image }} style={stylesFor(colors).offerImage} /><LinearGradient colors={['rgba(12,56,20,0.05)', 'rgba(12,56,20,0.88)']} style={stylesFor(colors).offerOverlay}><View style={stylesFor(colors).offerTopRow}><View style={stylesFor(colors).offerBadge}><Text style={stylesFor(colors).offerBadgeText}>OFFRE DU JOUR</Text></View></View><View><Text style={stylesFor(colors).offerLabel}>{offer.label}</Text><Text style={stylesFor(colors).offerProductName}>{offer.product.name}</Text><Text style={stylesFor(colors).offerMeta}>{offer.availability} · jusqu’à {offer.expiresAt}</Text><View style={stylesFor(colors).offerPriceRow}><Text style={stylesFor(colors).offerPrice}>{money(offer.product.price)}</Text><Ionicons name="arrow-forward-circle" size={25} color={colors.primaryForeground} /></View></View></LinearGradient></Pressable>)}</ScrollView><View style={stylesFor(colors).offerDots}>{offers.map((offer, index) => <View key={offer.id} style={[stylesFor(colors).offerDot, index === activeIndex && stylesFor(colors).offerDotActive]} />)}</View></View>;
}

function MarketPrice({ name, price, trend }: { name: string; price: string; trend: string }) {
  const colors = useColors();
  return <View style={stylesFor(colors).marketRow}><View style={stylesFor(colors).marketProductIcon}><Ionicons name="leaf-outline" size={16} color={colors.primary} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>{name}</Text><Text style={stylesFor(colors).productMeta}>Prix moyen au marché</Text></View><View style={stylesFor(colors).alignEnd}><Text style={stylesFor(colors).miniPrice}>{price}</Text><Text style={[stylesFor(colors).marketTrend, { color: trend.startsWith('+') ? colors.primary : colors.orange }]}>{trend}</Text></View></View>;
}

function LiveMessagesScreen({ onBack, onNav, initialContact, initialContactId, initialConversationId }: { onBack: () => void; onNav: (screen: Screen) => void; initialContact?: string; initialContactId?: string; initialConversationId?: string }) {
  const colors = useColors();
  const { role, accessToken, userId, profile } = useApp();
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  // Ouverture directe d'une conversation depuis une notification.
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);
  const [dismissedInitialId, setDismissedInitialId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [activeAccounts, setActiveAccounts] = useState<ApiAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ farmerId: string; reason: 'fraud' | 'harassment' | 'unsafe_product' | 'spam' | 'other' } | null>(null);
  const [reportText, setReportText] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const localConversationIds = useRef<Set<string>>(new Set());

  const ensureConversation = async (contactId: string, contactName?: string, onError?: (msg: string) => void) => {
    if (!accessToken || !contactId) {
      onError?.('ID de contact manquant');
      return;
    }
    const existing = conversations.find((conversation) => conversation.otherUserId === contactId);
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    try {
      const created = await apiCreateConversation(accessToken, contactId);
      localConversationIds.current.add(created.id);
      setConversations((current) => [created, ...current]);
      setSelectedId(created.id);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Erreur de connexion');
    }
  };

  useEffect(() => {
    if (!accessToken || !initialContactId || selectedId) return;
    if (dismissedInitialId === initialContactId) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      void ensureConversation(initialContactId, initialContact, (msg) => {
        if (cancelled) return;
        setError(msg);
      });
    }, 100);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [accessToken, initialContactId, selectedId, dismissedInitialId]);

  const refresh = async () => {
    if (!accessToken) return;
    try {
      const conversationResult = await apiGetConversations(accessToken);
      setConversations((current) => {
        const apiById = new Map(conversationResult.map((conversation) => [conversation.id, conversation]));
        const merged = [...conversationResult];
        for (const local of current) {
          if (!apiById.has(local.id) && localConversationIds.current.has(local.id)) {
            merged.push(local);
          }
        }
        return merged;
      });
      if (!selectedId && initialContactId && conversations.length > 0 && !localConversationIds.current.size) {
        const matching = conversationResult.find((conversation) => conversation.otherUserId === initialContactId);
        if (matching) {
          setSelectedId(matching.id);
        } else {
          void ensureConversation(initialContactId, initialContact);
        }
      }
    } catch {
      // The screen remains usable while the API is temporarily unavailable.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !selectedId) return;
    let cancelled = false;
    const load = async () => {
      try {
        await apiMarkConversationRead(accessToken, selectedId);
        const result = await apiGetMessages(accessToken, selectedId);
        if (!cancelled) setMessages(result);
        setConversations((current) => current.map((conversation) => conversation.id === selectedId ? { ...conversation, unreadCount: 0 } : conversation));
      } catch {
        if (!cancelled) setMessages([]);
      }
    };
    void load();
    const timer = setInterval(() => void load(), 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [accessToken, selectedId]);

  const loadActiveAccounts = async () => {
    if (!accessToken || !userId) return;
    setAccountsLoading(true);
    try {
      const accounts = await apiGetActiveAccounts(accessToken);
      const filtered = accounts.filter((account) => account.id !== userId);
      setActiveAccounts(filtered);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de charger la liste des utilisateurs.');
    } finally {
      setAccountsLoading(false);
    }
  };

  const selected = conversations.find((conversation) => conversation.id === selectedId);
  const openAccount = async (accountId: string) => {
    if (!accessToken) return;
    const existing = conversations.find((conversation) => conversation.otherUserId === accountId);
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    Alert.alert('Messagerie', 'Cet utilisateur n’a pas encore de conversation avec vous.');
  };
  const send = async () => {
    if (!accessToken || !selectedId || !draft.trim()) return;
    const text = draft.trim();
    try {
      const sent = await apiSendMessage(accessToken, selectedId, text);
      setMessages((current) => [...current, sent]);
      setDraft('');
    } catch {
      Alert.alert('Messagerie', 'Le message n’a pas pu être envoyé.');
    }
  };

  if (selectedId && (selected || initialContact)) {
    const contactName = selected?.otherUserName ?? initialContact ?? 'Contact';
    return <>
      <ChatThread
        contact={contactName}
        avatarUrl={apiAssetUrl(selected?.otherUserAvatarUrl ?? selected?.avatarUrl)}
        messages={[...messages]
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map((message) => ({ id: message.id, body: message.body, mine: Boolean(userId) && message.senderId === userId, createdAt: message.createdAt }))}
        draft={draft}
        onDraftChange={setDraft}
        onSend={() => void send()}
        onBack={() => { setSelectedId(null); localConversationIds.current.clear(); if (initialContactId) setDismissedInitialId(initialContactId); }}
        onReport={role === 'buyer' ? reportFarmer : undefined}
      />
      <Modal visible={Boolean(reportTarget)} transparent animationType="fade" onRequestClose={() => setReportTarget(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'center', padding: 22 }}>
          <View style={{ borderRadius: 20, backgroundColor: colors.card, padding: 20, gap: 12 }}>
            <Text style={stylesFor(colors).h3}>Décrire les faits</Text>
            <Text style={stylesFor(colors).productMeta}>Donnez au moins quelques détails pour aider l’administrateur à examiner ce signalement.</Text>
            <TextInput value={reportText} onChangeText={setReportText} multiline autoFocus placeholder="Expliquez ce qui s’est passé..." placeholderTextColor={colors.mutedForeground} style={[stylesFor(colors).composerInput, { minHeight: 110, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.background }]} textAlignVertical="top" />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <Pressable onPress={() => { setReportTarget(null); setReportText(''); }} style={{ paddingHorizontal: 14, paddingVertical: 11 }}><Text style={stylesFor(colors).sectionAction}>Annuler</Text></Pressable>
              <Pressable disabled={reportSubmitting || reportText.trim().length < 10} onPress={async () => {
                if (!accessToken || !reportTarget || reportText.trim().length < 10) return;
                setReportSubmitting(true);
                try {
                  await apiReportFarmer(accessToken, { farmerId: reportTarget.farmerId, reason: reportTarget.reason, details: reportText.trim() });
                  setReportTarget(null);
                  setReportText('');
                  Alert.alert('Signalement envoyé', 'Votre signalement sera examiné par l’administrateur.');
                } catch (error) {
                  Alert.alert('Signalement', error instanceof Error ? error.message : 'Impossible d’envoyer le signalement.');
                } finally {
                  setReportSubmitting(false);
                }
              }} style={{ paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, backgroundColor: reportSubmitting || reportText.trim().length < 10 ? colors.muted : colors.primary }}><Text style={stylesFor(colors).primaryButtonText}>{reportSubmitting ? 'Envoi…' : 'Envoyer'}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>;
  }

  if (initialContactId && !selectedId && dismissedInitialId !== initialContactId) {
    return (
      <View style={stylesFor(colors).screen}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <NativeText style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 15 }}>Ouverture de la conversation...</NativeText>
          {error ? (
            <Pressable onPress={() => { setError(null); void ensureConversation(initialContactId!, initialContact); }} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 10, marginTop: 12 }}>
              <NativeText style={{ color: colors.primaryForeground, fontWeight: '600' }}>Réessayer</NativeText>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  function reportFarmer() {
    const target = conversations.find((conversation) => conversation.id === selectedId) ?? selected;
    if (!target || role !== 'buyer' || !accessToken) return;
    const farmerId = target.otherUserId;
    if (!farmerId) return;
    Alert.alert('Signaler cet agriculteur', 'Choisissez une raison.', [
      { text: 'Fraude ou paiement suspect', onPress: () => setReportTarget({ farmerId, reason: 'fraud' }) },
      { text: 'Harcèlement ou comportement déplacé', onPress: () => setReportTarget({ farmerId, reason: 'harassment' }) },
      { text: 'Produit dangereux ou non conforme', onPress: () => setReportTarget({ farmerId, reason: 'unsafe_product' }) },
      { text: 'Spam ou autre abus', onPress: () => setReportTarget({ farmerId, reason: 'other' }) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }
  return <View style={stylesFor(colors).screen}>
    <View style={stylesFor(colors).messageTopBar}>
      <Image source={logo} style={stylesFor(colors).messageLogo} resizeMode="contain" />
      <View style={stylesFor(colors).marketBadge}><Text style={stylesFor(colors).marketBadgeText}>Messagerie sécurisée</Text></View>
    </View>
    <View style={stylesFor(colors).messageReferenceSearch}>
      <Ionicons name="search" size={23} color={colors.mutedForeground} />
      <TextInput value={query} onChangeText={setQuery} placeholder="Rechercher un acheteur ou un agriculteur" placeholderTextColor={colors.mutedForeground} style={stylesFor(colors).searchInput} autoCorrect={false} />
    </View>
    <ScrollView contentContainerStyle={stylesFor(colors).messageReferenceList}>
      {loading && !conversations.length ? <Text style={stylesFor(colors).productMeta}>Chargement des conversations…</Text> : null}
      {conversations.map((conversation) => <Pressable key={conversation.id} style={stylesFor(colors).messageReferenceRow} onPress={() => setSelectedId(conversation.id)}>
        <View style={stylesFor(colors).messageAvatar}><AvatarFill name={conversation.otherUserName} uri={apiAssetUrl(conversation.otherUserAvatarUrl ?? conversation.avatarUrl)} textStyle={stylesFor(colors).largeAvatarText} /><View style={stylesFor(colors).messageOnlineDot} /></View>
        <View style={stylesFor(colors).flex}><View style={stylesFor(colors).rowBetween}><Text style={stylesFor(colors).messageReferenceName}>{conversation.otherUserName || 'Contact'}</Text><Text style={stylesFor(colors).messageReferenceTime}>Récent</Text></View><Text style={stylesFor(colors).messageReferenceRole}>Contact A DJAL</Text><Text style={stylesFor(colors).messageReferencePreview}>Ouvrir la conversation</Text></View>
      </Pressable>)}
      {!conversations.length && !loading && <EmptyState icon="chatbubbles-outline" title="Aucune conversation" body={`Bonjour ${profile.name}, vos conversations avec les autre utilisateurs apparaîtront ici.`} />}
    </ScrollView>
    <Pressable style={{ position: 'absolute', bottom: 80, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }} onPress={() => { setShowNewChat(true); void loadActiveAccounts(); }}>
      <Ionicons name="add" size={28} color={colors.primaryForeground} />
    </Pressable>
    <BottomNav items={role === 'farmer' ? farmerTabs : buyerTabs} active="messages" onPress={onNav} />
    <Modal visible={showNewChat} transparent animationType="fade" onRequestClose={() => setShowNewChat(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ maxHeight: '70%', backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={stylesFor(colors).h3}>Nouvelle conversation</Text>
            <Pressable onPress={() => setShowNewChat(false)} style={{ padding: 8 }}><Ionicons name="close" size={24} color={colors.mutedForeground} /></Pressable>
          </View>
          {accountsLoading ? (
            <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ color: colors.mutedForeground, marginTop: 12 }}>Chargement des utilisateurs…</Text></View>
          ) : (
            <FlatList
              data={activeAccounts}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="always"
              renderItem={({ item }) => (
                <Pressable
                  style={[stylesFor(colors).messageReferenceRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  onPress={async () => {
                    setShowNewChat(false);
                    setSelectedId(null);
                    await ensureConversation(item.id, item.name, (msg) => Alert.alert('Erreur', msg));
                  }}
                >
                  <View style={stylesFor(colors).messageAvatar}>
                    <AvatarFill name={item.name} uri={apiAssetUrl(item.avatarUrl)} textStyle={stylesFor(colors).largeAvatarText} />
                    <View style={stylesFor(colors).messageOnlineDot} />
                  </View>
                  <View style={stylesFor(colors).flex}>
                    <Text style={stylesFor(colors).messageReferenceName}>{item.name || 'Contact'}</Text>
                    <Text style={stylesFor(colors).messageReferenceRole}>{item.role === 'farmer' ? 'Agriculteur' : 'Acheteur'}</Text>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: 20 }}>Aucun utilisateur disponible</Text>}
            />
          )}
        </View>
      </View>
    </Modal>
  </View>;
}

function MessagesScreen({ onBack, onNav, initialContact }: { onBack: () => void; onNav: (screen: Screen) => void; initialContact?: string }) {
  const colors = useColors();
  const { role, profile } = useApp();
  const [selected, setSelected] = useState<string | null>(initialContact ?? null);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Record<string, string[]>>({
    'Anaba Geo': ['Bonjour, votre commande de tomates est prête.', 'Parfait ! Quand puis-je la récupérer ?', 'Dès aujourd’hui à partir de 14h', 'D’accord'],
    'Aïssatou B': ['Bonjour, avez-vous encore des ananas frais ?'],
    'Cendra B.': ['Bonjour, votre commande est bien reçue.', 'Merci, je reste disponible si besoin.'],
    'Jean Mfou': ['Bonjour ! Votre commande de tomates est prête.', 'Parfait ! Quand puis-je la récupérer ?', 'Dès aujourd’hui à partir de 14h', 'D’accord'],
    'A djal support': ['Merci pour votre retour, nous traitons votre demande.'],
    'Jean Nfondang': ['Bonjour, le stock de maïs est de nouveau disponible.'],
    'Ali Baba': ['Votre commande est prête pour l’expédition.'],
    'Marie Nomo': ['Votre commande est prête pour l’expédition.'],
  });
  const contacts = role === 'farmer' ? [profile.name, 'Jean Mfou', 'Jean Nfondang', 'Ali Baba', 'Marie Nomo', 'A djal support'] : ['Jean Mfou', 'A djal support', 'Jean Nfondang', 'Ali Baba', 'Marie Nomo', 'Anaba Geo', 'Aïssatou B'];
  const visibleContacts = contacts.filter((contact) => `${contact} ${messages[contact]?.at(-1) ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  const send = () => {
    if (!selected || !draft.trim()) return;
    setMessages((current) => ({ ...current, [selected]: [...(current[selected] ?? []), draft.trim()] }));
    setDraft('');
  };
  if (selected) return <ChatThread contact={selected} messages={messages[selected] ?? []} draft={draft} onDraftChange={setDraft} onSend={send} onBack={() => setSelected(null)} />;
  if (selected) return <KeyboardAvoidingView style={stylesFor(colors).screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={stylesFor(colors).chatHeader}><Pressable onPress={() => setSelected(null)} style={stylesFor(colors).chatBack}><Ionicons name="arrow-back" size={21} color={colors.foreground} /></Pressable><View style={stylesFor(colors).chatAvatar}><Text style={stylesFor(colors).largeAvatarText}>{initials(selected)}</Text><View style={stylesFor(colors).onlineDot} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).h3}>{selected}</Text><Text style={stylesFor(colors).onlineText}>● en ligne</Text></View><Pressable style={stylesFor(colors).chatCall} onPress={() => Alert.alert('Appel', `Appel simulé avec ${selected}.`)}><Ionicons name="call-outline" size={20} color={colors.foreground} /></Pressable></View><ScrollView contentContainerStyle={stylesFor(colors).chatContent}>{(messages[selected] ?? []).map((message, index) => <View key={`${message}-${index}`} style={[stylesFor(colors).messageBubble, index % 2 === 1 && stylesFor(colors).messageBubbleMine]}><Text style={stylesFor(colors).messageText}>{message}</Text><Text style={stylesFor(colors).messageTime}>{index === 0 ? '7:10' : 'Maintenant'}</Text></View>)}</ScrollView><View style={stylesFor(colors).composer}><Pressable style={stylesFor(colors).composerIcon} onPress={() => Alert.alert('Pièce jointe', 'La sélection de fichiers sera disponible prochainement.')}><Ionicons name="attach-outline" size={22} color={colors.foreground} /></Pressable><View style={stylesFor(colors).composerField}><TextInput value={draft} onChangeText={setDraft} placeholder="Écrire un message..." placeholderTextColor={colors.mutedForeground} style={stylesFor(colors).composerInput} /><Pressable onPress={() => Alert.alert('Emoji', 'Choisissez un emoji dans votre clavier.')}><Ionicons name="happy-outline" size={20} color={colors.mutedForeground} /></Pressable></View><Pressable onPress={send} style={stylesFor(colors).sendButton}><Ionicons name="send" size={18} color={colors.primaryForeground} /></Pressable></View></KeyboardAvoidingView>;
  return <View style={stylesFor(colors).screen}><View style={stylesFor(colors).messageTopBar}><Image source={logo} style={stylesFor(colors).messageLogo} resizeMode="contain" /><View style={stylesFor(colors).marketBadge}><Text style={stylesFor(colors).marketBadgeText}>Marché agricole</Text></View></View><View style={stylesFor(colors).messageReferenceSearch}><Ionicons name="search" size={23} color={colors.mutedForeground} /><TextInput value={query} onChangeText={setQuery} placeholder="Rechercher un produit ou une catégorie" placeholderTextColor={colors.mutedForeground} style={stylesFor(colors).searchInput} autoCorrect={false} clearButtonMode="while-editing" /></View><ScrollView contentContainerStyle={stylesFor(colors).messageReferenceList}>{visibleContacts.length ? visibleContacts.map((contact, index) => <Pressable key={contact} style={stylesFor(colors).messageReferenceRow} onPress={() => setSelected(contact)}><View style={stylesFor(colors).messageAvatar}><Text style={stylesFor(colors).largeAvatarText}>{initials(contact)}</Text>{(index === 0 || index === 3) && <View style={stylesFor(colors).unreadBadge}><Text style={stylesFor(colors).unreadText}>{index === 0 ? 2 : 1}</Text></View>}<View style={stylesFor(colors).messageOnlineDot} /></View><View style={stylesFor(colors).flex}><View style={stylesFor(colors).rowBetween}><Text style={stylesFor(colors).messageReferenceName}>{contact}</Text><Text style={stylesFor(colors).messageReferenceTime}>{index === 0 ? '9:15' : index === 1 ? '8:05' : index < 3 ? 'Hier' : 'Samedi'}</Text></View><Text style={stylesFor(colors).messageReferenceRole}>{contact === 'A djal support' ? 'Service client' : role === 'farmer' ? 'Acheteur' : 'Agriculteur'}</Text><Text style={stylesFor(colors).messageReferencePreview} numberOfLines={1}>{messages[contact]?.at(-1) ?? 'Démarrer une conversation'}</Text></View></Pressable>) : <EmptyState icon="search-outline" title="Aucune conversation trouvée" body="Essayez le nom d’un contact ou un mot du dernier message." />}</ScrollView><BottomNav items={role === 'farmer' ? farmerTabs : buyerTabs} active="messages" onPress={onNav} /></View>;
}

type ChatMessage = { id: string; body: string; mine: boolean; createdAt?: string };

/** Heure d'envoi lisible : « 14:05 » aujourd'hui, « Hier 14:05 », sinon « 12/09 14:05 ». */
function formatMessageTime(createdAt?: string): string {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMessageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfMessageDay) / 86400000);
  if (dayDiff === 0) return time;
  if (dayDiff === 1) return `Hier ${time}`;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${time}`;
}

function ChatThread({ contact, avatarUrl, messages, draft, onDraftChange, onSend, onBack, onReport }: { contact: string; avatarUrl?: string; messages: Array<ChatMessage | string>; draft: string; onDraftChange: (value: string) => void; onSend: () => void; onBack: () => void; onReport?: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<React.ComponentRef<typeof NativeTextInput>>(null);
  const scrollRef = useRef<ScrollView>(null);
  // Le côté de la bulle dépend de l'expéditeur réel (mine = message envoyé par moi), plus de l'ordre d'affichage.
  const chatMessages: ChatMessage[] = messages.map((message, index) =>
    typeof message === 'string' ? { id: `local-${index}`, body: message, mine: true } : message,
  );
  const send = () => {
    onSend();
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  return <KeyboardControllerAvoidingView style={stylesFor(colors).screen} behavior="padding" keyboardVerticalOffset={0}><View style={stylesFor(colors).chatHeader}><Pressable onPress={onBack} style={stylesFor(colors).chatBack} hitSlop={16}><Ionicons name="arrow-back" size={21} color={colors.foreground} /></Pressable><View style={stylesFor(colors).chatAvatar}><AvatarFill name={contact} uri={avatarUrl} textStyle={stylesFor(colors).largeAvatarText} /><View style={stylesFor(colors).onlineDot} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).h3}>{contact}</Text><Text style={stylesFor(colors).onlineText}>● en ligne</Text></View>{onReport && <Pressable accessibilityLabel="Signaler cet agriculteur" style={stylesFor(colors).chatCall} onPress={onReport}><Ionicons name="flag-outline" size={20} color={colors.destructive} /></Pressable>}</View><ScrollView ref={scrollRef} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })} contentContainerStyle={stylesFor(colors).chatContent} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">{chatMessages.map((message) => <View key={message.id} style={[stylesFor(colors).messageBubble, message.mine && stylesFor(colors).messageBubbleMine]}><Text style={stylesFor(colors).messageText}>{message.body}</Text>{message.createdAt ? <Text style={stylesFor(colors).messageTime}>{formatMessageTime(message.createdAt)}</Text> : null}</View>)}</ScrollView><View style={[stylesFor(colors).composer, { paddingBottom: Math.max(insets.bottom, 10) }]}><Pressable style={stylesFor(colors).composerIcon} onPress={() => Alert.alert('Pièce jointe', 'Ajoutez une photo depuis votre appareil dans une prochaine mise à jour.')}><Ionicons name="attach-outline" size={22} color={colors.foreground} /></Pressable><View style={stylesFor(colors).composerField}><TextInput ref={inputRef} value={draft} onChangeText={onDraftChange} placeholder="Écrire un message..." placeholderTextColor={colors.mutedForeground} style={stylesFor(colors).composerInput} multiline textAlignVertical="center" /><Pressable onPress={() => onDraftChange(`${draft}😊`)}><Ionicons name="happy-outline" size={20} color={colors.mutedForeground} /></Pressable></View><Pressable onPress={send} style={stylesFor(colors).sendButton} disabled={!draft.trim()}><Ionicons name="send" size={18} color={colors.primaryForeground} /></Pressable></View></KeyboardControllerAvoidingView>;
}

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const colors = useColors();
  return <View style={stylesFor(colors).sectionHeader}><Text style={stylesFor(colors).sectionTitle}>{title}</Text>{action && <Pressable onPress={onPress}><Text style={stylesFor(colors).sectionAction}>{action}</Text></Pressable>}</View>;
}

function ProductCard({ product, onPress, compact = false }: { product: Product; onPress: () => void; compact?: boolean }) {
  const colors = useColors();
  const toast = useToast();
  const { addToCart, role } = useApp();
  const canAdd = role !== 'guest' && product.stock > 0;
  const isUnavailable = product.stock <= 0;
  const add = () => {
    if (role === 'guest') return;
    if (product.stock <= 0) return toast('Ce produit sera bientôt disponible.');
    addToCart(product);
  };
  return <Pressable style={[stylesFor(colors).productCard, compact && stylesFor(colors).productCardCompact]} onPress={onPress}><Image source={{ uri: product.image }} style={stylesFor(colors).productImage} /><View style={stylesFor(colors).productInfo}><Text style={stylesFor(colors).productName} numberOfLines={1}>{product.name}</Text><Text style={stylesFor(colors).productMeta}>{product.farmer} · {product.location}</Text><View style={stylesFor(colors).rowBetween}><View><Text style={stylesFor(colors).price}>{money(product.price)}</Text><Text style={stylesFor(colors).unit}>/{product.unit}</Text></View><Pressable disabled={isUnavailable} style={[stylesFor(colors).addCircle, !canAdd && { backgroundColor: colors.muted }]} onPress={add}><Ionicons name="add" size={20} color={!canAdd ? colors.mutedForeground : colors.primaryForeground} /></Pressable></View></View></Pressable>;
}

function RecommendationCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const colors = useColors();
  const { addToCart, role } = useApp();
  const canAdd = role !== 'guest' && product.stock > 0;
  const isUnavailable = product.stock <= 0;
  const { profile } = useApp();
  const reasons = [
    profile.interests.includes(product.category) ? 'correspond à vos préférences' : null,
    profile.location.toLowerCase().includes(product.location.toLowerCase()) ? 'proche de vous' : null,
    product.harvestDate && product.shelfLifeDays && (Date.now() - new Date(`${product.harvestDate}T12:00:00`).getTime()) / 86_400_000 > product.shelfLifeDays * 0.65 ? 'récolte à consommer bientôt' : null,
  ].filter(Boolean);
  return <Pressable style={stylesFor(colors).recommendCard} onPress={onPress}><Image source={{ uri: product.image }} style={stylesFor(colors).recommendImage} /><View style={stylesFor(colors).recommendCopy}><Text style={stylesFor(colors).productName}>{product.name}</Text><Text style={stylesFor(colors).productMeta}>{product.farmer} · {product.category}</Text>{reasons.length > 0 && <Text style={stylesFor(colors).hintText}>Recommandé car {reasons.join(', ')}</Text>}<View style={stylesFor(colors).ratingRow}><Ionicons name="star" size={13} color={colors.gold} /><Text style={stylesFor(colors).rating}>{product.rating}</Text></View></View><View style={stylesFor(colors).recommendEnd}><Text style={stylesFor(colors).miniPrice}>{money(product.price)}</Text><Pressable disabled={isUnavailable} style={[stylesFor(colors).addCircleSmall, !canAdd && { backgroundColor: colors.muted }]} onPress={() => canAdd && addToCart(product)}><Ionicons name="add" size={17} color={!canAdd ? colors.mutedForeground : colors.primaryForeground} /></Pressable></View></Pressable>;
}

function CategoriesScreen({ onProduct, onNav }: { onProduct: (product: Product) => void; onNav: (screen: Screen) => void }) {
  const colors = useColors();
  const { products, cartCount, categories: categoryOptions } = useApp();
  useEffect(() => {
    openCategoriesCart = () => onNav('cart');
    return () => {
      openCategoriesCart = undefined;
    };
  }, [onNav]);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const filtered = products.filter((product) => (category === 'all' || product.category === category) && `${product.name} ${product.category} ${product.farmer} ${product.location}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <View style={stylesFor(colors).screen}><AppHeader title="Catégories" subtitle="Explorez tous nos produits agricoles" /><ScrollView contentContainerStyle={stylesFor(colors).pageContent} showsVerticalScrollIndicator={false}><View style={stylesFor(colors).searchBar}><Ionicons name="search" size={20} color={colors.mutedForeground} /><TextInput value={query} onChangeText={setQuery} placeholder="Rechercher un produit ou une catégorie" placeholderTextColor={colors.mutedForeground} style={stylesFor(colors).searchInput} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stylesFor(colors).categoryScroll}>{categoryOptions.map((item) => <Pressable key={item.id} style={stylesFor(colors).categoryItem} onPress={() => setCategory(item.id)}><Image source={{ uri: categoryImageFor(item) }} style={[stylesFor(colors).categoryImage, category === item.id && stylesFor(colors).categoryImageActive]} /><Text style={[stylesFor(colors).categoryLabel, category === item.id && { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>{item.label}</Text></Pressable>)}</ScrollView><SectionHeader title="Produits disponibles" action={`${filtered.length} produits`} /><FlatList data={filtered} keyExtractor={(item) => item.id} numColumns={2} columnWrapperStyle={stylesFor(colors).gridGap} scrollEnabled={false} renderItem={({ item }) => <ProductCard product={item} onPress={() => onProduct(item)} />} ListEmptyComponent={<EmptyState icon="leaf-outline" title="Aucun produit dans cette catégorie" body="Les agriculteurs ajoutent de nouvelles récoltes chaque jour." />} /><SectionHeader title="Recommandés" action={`${Math.min(filtered.length, 5)} produits`} /><View style={stylesFor(colors).recommendList}>{filtered.slice(0, 5).map((product) => <RecommendationCard key={`recommend-${product.id}`} product={product} onPress={() => onProduct(product)} />)}</View></ScrollView><BottomNav items={buyerTabs} active="categories" onPress={(key) => onNav(key)} /></View>;
}

function ProductDetail({ product, onBack, onProduct }: { product: Product; onBack: () => void; onProduct: (product: Product) => void }) {
  const colors = useColors();
  const { addToCart, products, role } = useApp();
  const [quantity, setQuantity] = useState(1);
  const similar = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
  const add = () => {
    if (role === 'guest') return Alert.alert('Compte requis', 'Connectez-vous ou créez un compte pour continuer.');
    if (product.stock <= 0) return Alert.alert('Rupture de stock', 'Ce produit sera bientôt disponible.');
    addToCart(product, quantity);
    Alert.alert('Ajouté au panier', `${quantity} ${product.unit} de ${product.name} ajouté(s).`);
  };
  return <View style={stylesFor(colors).screen}><AppHeader title="Détail du produit" onBack={onBack} right={<Pressable onPress={() => Alert.alert('Favoris', 'Produit ajouté à vos favoris.')} style={stylesFor(colors).iconButton}><Ionicons name="heart-outline" size={23} color={colors.foreground} /></Pressable>} /><ScrollView contentContainerStyle={stylesFor(colors).detailContent} showsVerticalScrollIndicator={false}><Image source={{ uri: product.image }} style={stylesFor(colors).detailImage} /><View style={stylesFor(colors).detailTitleRow}><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).h2}>{product.name}</Text><Text style={stylesFor(colors).productMeta}>{product.category} · {product.location}</Text></View><View style={stylesFor(colors).ratingPill}><Ionicons name="star" size={14} color={colors.gold} /><Text style={stylesFor(colors).rating}>{product.rating}</Text></View></View><Text accessibilityLabel="Prix actuel" style={stylesFor(colors).detailPrice}>{money(product.price)} <Text style={stylesFor(colors).detailUnit}>/{product.unit}</Text></Text>{product.originalPrice && <Text accessibilityLabel="Prix habituel" style={stylesFor(colors).productMeta}>Prix habituel : {money(product.originalPrice)} /{product.unit}</Text>}<View style={stylesFor(colors).stockRow}><View style={[stylesFor(colors).stockDot, { backgroundColor: product.stock > 5 ? colors.primary : product.stock > 0 ? colors.orange : colors.destructive }]} /><Text style={stylesFor(colors).stockText}>{product.stock > 5 ? `${product.stock} disponibles` : product.stock > 0 ? `Plus que ${product.stock} en stock` : 'Rupture de stock'}</Text></View><View style={stylesFor(colors).dividerLine} /><Text style={stylesFor(colors).subheading}>À propos de ce produit</Text><Text style={stylesFor(colors).body}>{product.description}</Text><View style={stylesFor(colors).farmerCard}><View style={stylesFor(colors).avatar}><AvatarFill name={product.farmer} uri={product.farmerAvatar} textStyle={stylesFor(colors).avatarText} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).bodySmall}>Vendu par</Text><Text style={stylesFor(colors).cardTitle}>{product.farmer}</Text><Text style={stylesFor(colors).productMeta}>{product.location}, Cameroun</Text></View><Ionicons name="chevron-forward" size={19} color={colors.mutedForeground} /></View><View style={stylesFor(colors).quantityRow}><Text style={stylesFor(colors).subheading}>Quantité</Text><QuantitySelector value={quantity} max={Math.max(product.stock, 1)} onChange={setQuantity} /></View><Pressable style={[stylesFor(colors).primaryButton, (product.stock === 0 || role === 'guest') && { backgroundColor: colors.muted }]} onPress={add}><Ionicons name="cart-outline" size={20} color={product.stock === 0 || role === 'guest' ? colors.mutedForeground : colors.primaryForeground} /><Text style={[stylesFor(colors).primaryButtonText, (product.stock === 0 || role === 'guest') && { color: colors.mutedForeground }]}>{role === 'guest' ? 'Se connecter pour acheter' : product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}</Text></Pressable><SectionHeader title="Vous aimerez aussi" />{similar.map((item) => <RecommendationCard key={item.id} product={item} onPress={() => onProduct(item)} />)}</ScrollView></View>;
}

function QuantitySelector({ value, max, onChange }: { value: number; max: number; onChange: (value: number) => void }) {
  const colors = useColors();
  return <View style={stylesFor(colors).quantitySelector}><Pressable onPress={() => onChange(Math.max(1, value - 1))} style={stylesFor(colors).quantityButton}><Ionicons name="remove" size={17} color={colors.primary} /></Pressable><Text style={stylesFor(colors).quantityValue}>{value}</Text><Pressable onPress={() => onChange(Math.min(max, value + 1))} style={stylesFor(colors).quantityButton}><Ionicons name="add" size={17} color={colors.primary} /></Pressable></View>;
}

function CartScreen({ onBack, onDone }: { onBack: () => void; onDone: (id: string) => void }) {
  const colors = useColors();
  const toast = useToast();
  const { cart, cartTotal, updateCartQuantity, removeFromCart, clearCart, createOrder, role, selectedPaymentMethodId, paymentMethods } = useApp();
  const selectedPayment = paymentMethods.find((item) => item.id === selectedPaymentMethodId);
  const [submitting, setSubmitting] = useState(false);
  const confirm = async () => {
    if (role === 'guest') return toast('Connectez-vous ou créez un compte pour continuer.');
    if (!selectedPayment) return toast('Ajoutez et sélectionnez un moyen de paiement local avant de confirmer.');
    if (submitting) return;
    setSubmitting(true);
    try {
      const created = await createOrder();
      const first = created[0];
      if (first) onDone(first.id);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'La commande a échoué. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };
  return <View style={stylesFor(colors).screen}>
    <AppHeader title="Mon panier" onBack={onBack} subtitle={cart.length ? `${cart.length} produits sélectionnés` : 'Votre sélection du marché'} />
    <ScrollView contentContainerStyle={stylesFor(colors).pageContent}>
      {cart.length === 0 ? <EmptyState icon="cart-outline" title="Votre panier est vide" body="Explorez le marché et ajoutez les récoltes qui vous font envie." action="Découvrir les produits" onAction={onBack} /> : <>
        <View style={stylesFor(colors).cartTop}>
          <Text style={stylesFor(colors).subheading}>Articles sélectionnés</Text>
          <Pressable onPress={() => Alert.alert('Vider le panier', 'Supprimer tous les articles ?', [{ text: 'Annuler' }, { text: 'Vider', style: 'destructive', onPress: clearCart }])}><Text style={stylesFor(colors).dangerLink}>Tout supprimer</Text></Pressable>
        </View>
        {cart.map((line) => <View key={line.id} style={stylesFor(colors).cartItem}>
          <Image source={{ uri: line.product.image }} style={stylesFor(colors).cartImage} />
          <View style={stylesFor(colors).flex}>
            <Text style={stylesFor(colors).cardTitle}>{line.product.name}</Text>
            <Text style={stylesFor(colors).productMeta}>{money(line.product.price)} /{line.product.unit}</Text>
            <QuantitySelector value={line.quantity} max={line.product.stock} onChange={(value) => updateCartQuantity(line.id, value)} />
          </View>
          <View style={stylesFor(colors).cartEnd}>
            <Text style={stylesFor(colors).miniPrice}>{money(line.product.price * line.quantity)}</Text>
            <Pressable onPress={() => removeFromCart(line.id)}><Ionicons name="trash-outline" size={18} color={colors.destructive} /></Pressable>
          </View>
        </View>)}
        <View style={stylesFor(colors).summaryCard}>
          <View style={stylesFor(colors).rowBetween}><Text style={stylesFor(colors).body}>Sous-total</Text><Text style={stylesFor(colors).body}>{money(cartTotal)}</Text></View>
          <View style={stylesFor(colors).rowBetween}><Text style={stylesFor(colors).body}>Paiement</Text><Text style={stylesFor(colors).body}>{selectedPayment?.label ?? 'Non configuré'}</Text></View>
          <View style={stylesFor(colors).dividerLine} />
          <View style={stylesFor(colors).rowBetween}><Text style={stylesFor(colors).h3}>Total</Text><Text style={stylesFor(colors).totalText}>{money(cartTotal)}</Text></View>
        </View>
        <Pressable style={[stylesFor(colors).primaryButton, submitting && { opacity: 0.7 }]} disabled={submitting} onPress={() => { void confirm(); }}><Text style={stylesFor(colors).primaryButtonText}>{submitting ? 'Envoi de la commande…' : 'Confirmer la commande'}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable>
        <Text style={stylesFor(colors).hintText}>Paiement local de démonstration, sans débit réel.</Text>
      </>}
    </ScrollView>
  </View>;
}

function OrdersScreen({ onOrder, onNav, onMessageOrder }: { onOrder: (id: string) => void; onNav: (screen: Screen) => void; onMessageOrder?: (orderId: string) => void }) {
  const colors = useColors();
  const toast = useToast();
  const { orders, cartCount, role, updateOrderStatus } = useApp();
  const [filter, setFilter] = useState('Toutes');
  const filtered = filter === 'Toutes' ? orders : orders.filter((order) => filter === 'En cours' ? ['En attente', 'Confirmée', 'Préparée'].includes(order.status) : order.status === filter);
  if (role === 'guest') return <ProtectedScreen title="Mes commandes" onBack={() => onNav('home')} onLogin={() => onNav('auth')} onCreate={() => onNav('role')} />;
  return <View style={stylesFor(colors).screen}><AppHeader title="Mes commandes" subtitle="Suivez vos achats en temps réel" dark /><ScrollView contentContainerStyle={stylesFor(colors).pageContent}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stylesFor(colors).chipRow}>{['Toutes', 'En cours', 'Terminée', 'Annulée'].map((item) => <Pressable key={item} style={[stylesFor(colors).chip, filter === item && stylesFor(colors).chipActive]} onPress={() => setFilter(item)}><Text style={[stylesFor(colors).chipText, filter === item && stylesFor(colors).chipTextActive]}>{item}</Text></Pressable>)}</ScrollView>{filtered.map((order) => <OrderCard key={order.id} order={order} onPress={() => onOrder(order.id)} onMessage={onMessageOrder ? () => onMessageOrder(order.id) : () => onNav('messages')} onCancel={() => Alert.alert('Annuler la commande', 'Voulez-vous vraiment annuler cette commande ?', [{ text: 'Non' }, { text: 'Oui, annuler', style: 'destructive', onPress: () => { void updateOrderStatus(order.id, 'Annulée').catch((error) => toast(error instanceof Error ? error.message : 'L’annulation a échoué. Réessayez.')); } }])} />)}{filtered.length === 0 && <EmptyState icon="bag-outline" title="Aucune commande ici" body="Vos commandes apparaîtront dans cet espace." />}</ScrollView><BottomNav items={buyerTabs} active="orders" onPress={(key) => onNav(key)} cartCount={cartCount} /></View>;
}

function OrderCard({ order, onPress, onMessage, onCancel }: { order: import('@/src/app-context').Order; onPress: () => void; onMessage?: () => void; onCancel?: () => void }) {
  const colors = useColors();
  const item = order.items[0];
  const statusColor = order.status === 'Terminée' ? colors.primary : order.status === 'Annulée' ? colors.destructive : colors.blueStatus;
  const progressWidth = order.status === 'Terminée' ? '100%' : order.status === 'Annulée' ? '40%' : order.status === 'Confirmée' ? '50%' : order.status === 'Préparée' ? '75%' : '25%';
  return <Pressable style={stylesFor(colors).orderCard} onPress={onPress}><View style={stylesFor(colors).rowBetween}><Text style={stylesFor(colors).cardTitle}>{formatOrderCode(order.id)}</Text><View style={[stylesFor(colors).statusPill, { backgroundColor: `${statusColor}20` }]}><Text style={[stylesFor(colors).statusText, { color: statusColor }]}>{order.status}</Text></View></View><Text style={stylesFor(colors).productMeta}>{order.date}</Text><View style={stylesFor(colors).orderProduct}><Image source={{ uri: item.product.image }} style={stylesFor(colors).orderImage} /><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>{item.product.name}</Text><Text style={stylesFor(colors).productMeta}>{item.quantity} {item.product.unit}</Text></View><Text style={stylesFor(colors).miniPrice}>{money(order.total)}</Text></View><View style={stylesFor(colors).progressTrack}><View style={[stylesFor(colors).progressFill, { width: progressWidth, backgroundColor: statusColor }]} /></View><View style={stylesFor(colors).rowBetween}><Text style={stylesFor(colors).hintText}>{order.status === 'Terminée' ? 'Commande livrée' : order.status === 'Annulée' ? 'Commande annulée' : order.status === 'En attente' ? 'Nouvelle commande, en attente de confirmation' : order.status === 'Confirmée' ? 'Commande confirmée, en préparation' : 'Commande en cours de préparation'}</Text><View style={stylesFor(colors).orderActions}>{onMessage && <Pressable style={stylesFor(colors).orderActionButton} onPress={(event) => { event.stopPropagation(); onMessage(); }}><Ionicons name="chatbubble-outline" size={16} color={colors.primary} /></Pressable>}{onCancel && order.status === 'En attente' && <Pressable style={[stylesFor(colors).orderActionButton, { backgroundColor: `${colors.destructive}12` }]} onPress={(event) => { event.stopPropagation(); onCancel(); }}><Text style={stylesFor(colors).cancelText}>Annuler</Text></Pressable>}<Ionicons name="chevron-forward" size={18} color={colors.primary} /></View></View></Pressable>;
}

function OrderDetail({ orderId, onBack, onMessage, farmer = false }: { orderId: string; onBack: () => void; onMessage?: () => void; farmer?: boolean }) {
  const colors = useColors();
  const toast = useToast();
  const { orders, updateOrderStatus } = useApp();
  const order = orders.find((item) => item.id === orderId);
  if (!order) return <ProtectedScreen title="Commande introuvable" onBack={onBack} onLogin={onBack} onCreate={onBack} />;
  const transition = (status: import('@/src/app-context').Order['status'], failure: string) =>
    void updateOrderStatus(order.id, status).catch((error) => toast(error instanceof Error ? error.message : failure));
  const cancel = () => Alert.alert('Annuler la commande', 'Voulez-vous vraiment annuler cette commande ?', [{ text: 'Non' }, { text: 'Oui, annuler', style: 'destructive', onPress: () => transition('Annulée', 'L’annulation a échoué. Réessayez.') }]);
  const accept = () => transition('Confirmée', 'La confirmation a échoué. Réessayez.');
  const deliver = () => transition('Terminée', 'La livraison a échoué. Réessayez.');
  return <View style={stylesFor(colors).screen}><AppHeader title={farmer ? `Commande ${formatOrderCode(order.id)}` : 'Détail de la commande'} onBack={onBack} farmer={farmer} /><ScrollView contentContainerStyle={stylesFor(colors).pageContent}><View style={stylesFor(colors).detailOrderHero}><View><Text style={stylesFor(colors).productMeta}>Statut de la commande</Text><Text style={[stylesFor(colors).h2, { color: order.status === 'Annulée' ? colors.destructive : colors.foreground }]}>{order.status === 'Terminée' ? 'Livrée' : order.status}</Text></View><StatusIcon status={order.status} /></View><OrderCard order={order} onPress={() => undefined} onMessage={onMessage} onCancel={!farmer ? cancel : undefined} /><View style={stylesFor(colors).customerCard}><View style={stylesFor(colors).avatar}><AvatarFill name={farmer ? order.customer : order.items[0].product.farmer} uri={farmer ? order.buyerAvatar : (order.sellerAvatar ?? order.items[0].product.farmerAvatar)} textStyle={stylesFor(colors).avatarText} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).productMeta}>{farmer ? 'Client' : 'Agriculteur'}</Text><Text style={stylesFor(colors).cardTitle}>{farmer ? order.customer : order.items[0].product.farmer}</Text><Text style={stylesFor(colors).productMeta}>{order.location}</Text></View>{onMessage && <Pressable style={stylesFor(colors).messageOrderButton} onPress={onMessage}><Ionicons name="chatbubble-outline" size={21} color={colors.primary} /></Pressable>}</View><Text style={stylesFor(colors).subheading}>Détails de la commande</Text>{order.items.map((line) => <View key={line.product.id} style={stylesFor(colors).cartItem}><Image source={{ uri: line.product.image }} style={stylesFor(colors).cartImage} /><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>{line.product.name}</Text><Text style={stylesFor(colors).productMeta}>{line.quantity} × {money(line.product.price)}</Text></View><Text style={stylesFor(colors).miniPrice}>{money(line.quantity * line.product.price)}</Text></View>)}<View style={stylesFor(colors).summaryCard}><View style={stylesFor(colors).rowBetween}><Text style={stylesFor(colors).h3}>Total de la commande</Text><Text style={stylesFor(colors).totalText}>{money(order.total)}</Text></View></View>{farmer && order.status === 'En attente' && <Pressable style={stylesFor(colors).primaryButton} onPress={accept}><Ionicons name="checkmark-circle-outline" size={19} color={colors.primaryForeground} /><Text style={stylesFor(colors).primaryButtonText}>Accepter la commande</Text></Pressable>}{farmer && order.status === 'Confirmée' && <Pressable style={stylesFor(colors).primaryButton} onPress={deliver}><Ionicons name="cube-outline" size={19} color={colors.primaryForeground} /><Text style={stylesFor(colors).primaryButtonText}>Marquer comme livrée</Text></Pressable>}</ScrollView></View>;
}

function OrderDetailView({ orderId, onBack, onMessage, farmer = false }: { orderId: string; onBack: () => void; onMessage?: () => void; farmer?: boolean }) {
  const colors = useColors();
  const toast = useToast();
  const { orders, updateOrderStatus } = useApp();
  const order = orders.find((item) => item.id === orderId);
  if (!order) return <ProtectedScreen title="Commande introuvable" onBack={onBack} onLogin={onBack} onCreate={onBack} />;

  const contactName = farmer ? (order.buyerName ?? order.customer) : (order.sellerName ?? order.items[0]?.product.farmer ?? 'Agriculteur');
  const contactCity = farmer ? (order.buyerCity ?? order.location) : (order.sellerCity ?? order.location);
  const contactPhone = farmer ? order.buyerPhone : order.sellerPhone;
  const statusColor = order.status === 'Terminée' ? colors.primary : order.status === 'Annulée' ? colors.destructive : colors.blueStatus;
  const transition = (status: import('@/src/app-context').Order['status'], failure: string) => {
    void updateOrderStatus(order.id, status).catch((error) => toast(error instanceof Error ? error.message : failure));
  };
  const cancel = () => Alert.alert('Refuser la commande', farmer ? 'Cette commande sera annulée et le stock sera remis en vente.' : 'Voulez-vous vraiment annuler cette commande ?', [{ text: 'Non' }, { text: farmer ? 'Refuser' : 'Oui, annuler', style: 'destructive', onPress: () => transition('Annulée', 'La commande n’a pas pu être annulée.') }]);
  const headerTitle = farmer ? `Commande ${formatOrderCode(order.id)}` : 'Détail de la commande';
  return <View style={stylesFor(colors).screen}>
    <AppHeader title={headerTitle} onBack={onBack} farmer={farmer} />
    <ScrollView contentContainerStyle={stylesFor(colors).orderDetailContent} showsVerticalScrollIndicator={false}>
      <View style={[stylesFor(colors).orderStatusBanner, { borderColor: `${statusColor}35`, backgroundColor: `${statusColor}12` }]}>
        <View style={stylesFor(colors).flex}><Text style={stylesFor(colors).productMeta}>Statut de la commande</Text><Text style={[stylesFor(colors).orderStatusTitle, { color: statusColor }]}>{order.status === 'Terminée' ? 'Livrée' : order.status}</Text><Text style={stylesFor(colors).productMeta}>{order.date} · {formatOrderCode(order.id)}</Text></View><StatusIcon status={order.status} />
      </View>
      <View style={stylesFor(colors).orderContactCard}>
        <View style={stylesFor(colors).largeAvatar}><AvatarFill name={contactName} uri={farmer ? order.buyerAvatar : (order.sellerAvatar ?? order.items[0]?.product.farmerAvatar)} textStyle={stylesFor(colors).largeAvatarText} /></View>
        <View style={stylesFor(colors).flex}><Text style={stylesFor(colors).productMeta}>{farmer ? 'Client' : 'Agriculteur'}</Text><Text style={stylesFor(colors).h3}>{contactName}</Text><Text style={stylesFor(colors).productMeta}>{contactCity}</Text>{contactPhone ? <Text style={stylesFor(colors).productMeta}>{contactPhone}</Text> : null}</View>
        {onMessage && <Pressable accessibilityLabel={`Écrire à ${contactName}`} style={stylesFor(colors).messageOrderButton} onPress={onMessage}><Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.primary} /></Pressable>}
      </View>
      <Text style={stylesFor(colors).subheading}>Articles commandés</Text>
      {order.items.map((line) => <View key={line.id} style={stylesFor(colors).orderDetailLine}><Image source={{ uri: line.product.image }} style={stylesFor(colors).orderImageLarge} /><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>{line.product.name}</Text><Text style={stylesFor(colors).productMeta}>{line.quantity} × {money(line.product.price)} /{line.product.unit}</Text></View><Text style={stylesFor(colors).miniPrice}>{money(line.quantity * line.product.price)}</Text></View>)}
      <View style={stylesFor(colors).orderDeliveryCard}><View style={stylesFor(colors).orderDeliveryIcon}><Ionicons name="location-outline" size={20} color={colors.primary} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>{farmer ? 'Adresse de livraison' : 'Lieu de retrait / livraison'}</Text><Text style={stylesFor(colors).productMeta}>{order.location}, Cameroun</Text></View></View>
      <View style={stylesFor(colors).summaryCard}><View style={stylesFor(colors).rowBetween}><Text style={stylesFor(colors).body}>Total de la commande</Text><Text style={stylesFor(colors).totalText}>{money(order.total)}</Text></View><Text style={stylesFor(colors).hintText}>Paiement local de démonstration</Text></View>
      {!farmer && order.status === 'En attente' && <Pressable style={stylesFor(colors).dangerOutlineButton} onPress={cancel}><Ionicons name="close-circle-outline" size={19} color={colors.destructive} /><Text style={stylesFor(colors).dangerButtonText}>Annuler la commande</Text></Pressable>}
      {farmer && order.status === 'En attente' && <View style={stylesFor(colors).orderDecisionRow}><Pressable style={stylesFor(colors).dangerOutlineButton} onPress={cancel}><Ionicons name="close-circle-outline" size={19} color={colors.destructive} /><Text style={stylesFor(colors).dangerButtonText}>Refuser</Text></Pressable><Pressable style={[stylesFor(colors).primaryButton, stylesFor(colors).orderDecisionAccept]} onPress={() => transition('Confirmée', 'La confirmation a échoué. Réessayez.')}><Ionicons name="checkmark-circle-outline" size={19} color={colors.primaryForeground} /><Text style={stylesFor(colors).primaryButtonText}>Accepter</Text></Pressable></View>}
      {farmer && order.status === 'Confirmée' && <Pressable style={stylesFor(colors).primaryButton} onPress={() => transition('Terminée', 'La livraison a échoué. Réessayez.')}><Ionicons name="cube-outline" size={19} color={colors.primaryForeground} /><Text style={stylesFor(colors).primaryButtonText}>Marquer comme livrée</Text></Pressable>}
    </ScrollView>
  </View>;
}

function StatusIcon({ status }: { status: string }) {
  const colors = useColors();
  const iconName = status === 'Terminée' ? 'checkmark-circle' : status === 'Annulée' ? 'close-circle' : 'time';
  const color = status === 'Terminée' ? colors.primary : status === 'Annulée' ? colors.destructive : colors.blueStatus;
  return <Ionicons name={iconName} size={32} color={color} />;
}

function BuyerProfile({ onNav, onSignOut }: { onNav: (screen: Screen) => void; onSignOut: () => void }) {
  const colors = useColors();
  const { orders, cartCount, themeMode, setThemeMode, language, setLanguage, profile, updateProfile, paymentMethods, selectedPaymentMethodId, selectPaymentMethod } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);
  const [address, setAddress] = useState(profile.address);
  const chooseLanguage = () => Alert.alert('Langue', 'Choisissez une langue.', [...languageOptions.map((item) => ({ text: item.label, onPress: () => setLanguage(item.code) })), { text: 'Annuler', style: 'cancel' }]);
  const choosePaymentMethod = () => Alert.alert('Moyen de paiement', 'Sélectionnez un paiement local.', [...paymentMethods.map((method) => ({ text: `${method.label} · ${method.reference}`, onPress: () => selectPaymentMethod(method.id) })), { text: 'Annuler', style: 'cancel' }]);
  useEffect(() => {
    if (!editing) updateProfile({ name, email, phone, location, address });
  }, [editing]);
   return <View style={stylesFor(colors).screen}><AppHeader title="Mon profil" subtitle="Votre espace personnel" /><ScrollView contentContainerStyle={stylesFor(colors).pageContent}><View style={stylesFor(colors).profileCard}><View style={stylesFor(colors).largeAvatar}><AvatarFill name={name} uri={profile.avatarUri} textStyle={stylesFor(colors).largeAvatarText} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).h3}>{name}</Text><Text style={stylesFor(colors).productMeta}>Acheteur · {location}</Text><View style={stylesFor(colors).ratingRow}><Ionicons name="bag-handle-outline" size={13} color={colors.primary} /><Text style={stylesFor(colors).rating}>{orders.length} commande(s)</Text></View></View><Pressable onPress={() => setEditing(!editing)} style={stylesFor(colors).profileEditButton}><Ionicons name="create-outline" size={17} color={colors.primary} /><Text style={stylesFor(colors).profileEditLabel}>{editing ? 'Fermer' : 'Modifier'}</Text></Pressable></View>{editing && <View style={stylesFor(colors).editCard}><Field label="Nom complet" placeholder="Votre nom" value={name} onChangeText={setName} icon="person-outline" /><Field label="Adresse email" placeholder="vous@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" icon="mail-outline" /><Field label="Téléphone" placeholder="+237..." value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="call-outline" /><Field label="Localisation" placeholder="Yaoundé, Cameroun" value={location} onChangeText={setLocation} icon="location-outline" /><Field label="Adresse de livraison" placeholder="Votre adresse complète" value={address} onChangeText={setAddress} icon="home-outline" /><Pressable style={stylesFor(colors).smallButton} onPress={() => setEditing(false)}><Text style={stylesFor(colors).smallButtonText}>Enregistrer les informations</Text></Pressable></View>}<View style={stylesFor(colors).profileStats}><Stat label="Commandes" value={String(orders.length)} icon="bag-handle-outline" color={colors.softGreen} /><Stat label="Dépenses" value={money(orders.reduce((sum, order) => sum + order.total, 0))} icon="cash-outline" color={colors.softGold} /><Stat label="Articles" value={String(orders.reduce((sum, order) => sum + order.items.reduce((items, line) => items + line.quantity, 0), 0))} icon="leaf-outline" color={colors.softBlue} /></View><ProfileMenuItem icon="location-outline" title="Adresse de livraison" subtitle={address} /><ProfileMenuItem icon="card-outline" title="Moyen de paiement" subtitle={paymentMethods.find((method) => method.id === selectedPaymentMethodId)?.label ?? 'Non configuré'} onPress={choosePaymentMethod} /><ProfileMenuItem icon="notifications-outline" title="Notifications" subtitle={profile.notificationsEnabled ? 'Activées' : 'Désactivées'} toggle value={profile.notificationsEnabled} onToggle={() => updateProfile({ notificationsEnabled: !profile.notificationsEnabled })} /><ProfileMenuItem icon="moon-outline" title="Apparence" subtitle={themeMode === 'dark' ? 'Mode nuit' : 'Mode jour'} toggle value={themeMode === 'dark'} onToggle={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} /><ProfileMenuItem icon="globe-outline" title="Langue" subtitle={language === 'fr' ? 'Français' : 'English'} onPress={chooseLanguage} /><ProfileMenuItem icon="help-circle-outline" title="Aide" subtitle="FAQ, contact" /><Pressable style={stylesFor(colors).logoutButton} onPress={onSignOut}><Ionicons name="log-out-outline" size={19} color={colors.destructive} /><Text style={stylesFor(colors).dangerLink}>Se déconnecter</Text></Pressable></ScrollView><BottomNav items={buyerTabs} active="profile" onPress={(key) => onNav(key)} cartCount={cartCount} /></View>;
}

function ProfileMenuItem({ icon, title, subtitle, toggle, value = false, onToggle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; toggle?: boolean; value?: boolean; onToggle?: () => void; onPress?: () => void }) {
  const colors = useColors();
  const toast = useToast();
  const { language, setLanguage } = useApp();
  const [languageOpen, setLanguageOpen] = useState(false);
  const isLanguage = title === 'Langue';
  const onItemPress = toggle ? onToggle : isLanguage ? () => setLanguageOpen((current) => !current) : onPress;
  return <View><Pressable style={stylesFor(colors).menuItem} onPress={onItemPress}><View style={stylesFor(colors).menuIcon}><Ionicons name={icon} size={19} color={colors.primary} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>{title}</Text><Text style={stylesFor(colors).productMeta}>{subtitle}</Text></View>{toggle ? <View style={[stylesFor(colors).toggle, !value && stylesFor(colors).toggleOff]}><View style={[stylesFor(colors).toggleKnob, !value && stylesFor(colors).toggleKnobOff]} /></View> : <Ionicons name={isLanguage && languageOpen ? 'chevron-up' : 'chevron-forward'} size={18} color={colors.mutedForeground} />}</Pressable>{isLanguage && languageOpen && <View style={stylesFor(colors).languageSheet}>{languageOptions.map((item) => <Pressable key={item.code} style={[stylesFor(colors).languageOption, language === item.code && stylesFor(colors).languageOptionActive]} onPress={() => { setLanguage(item.code); setLanguageOpen(false); }}><Text style={[stylesFor(colors).languageOptionText, language === item.code && stylesFor(colors).languageOptionTextActive]}>{item.label}</Text>{language === item.code && <Ionicons name="checkmark" size={17} color={colors.primary} />}</Pressable>)}</View>}</View>;
}

function ProtectedScreen({ title, onBack, onLogin, onCreate }: { title: string; onBack: () => void; onLogin: () => void; onCreate: () => void }) {
  const colors = useColors();
  return <View style={stylesFor(colors).screen}><AppHeader title={title} onBack={onBack} /><View style={stylesFor(colors).protectedState}><View style={stylesFor(colors).protectedIcon}><Ionicons name="lock-closed-outline" size={34} color={colors.primary} /></View><Text style={stylesFor(colors).h2}>Connectez-vous pour continuer</Text><Text style={stylesFor(colors).body}>Connectez-vous ou créez un compte pour accéder à cette fonctionnalité.</Text><Pressable style={stylesFor(colors).primaryButton} onPress={onLogin}><Text style={stylesFor(colors).primaryButtonText}>Se connecter</Text></Pressable><Pressable style={stylesFor(colors).outlineButton} onPress={onCreate}><Text style={stylesFor(colors).outlineButtonText}>Créer un compte</Text></Pressable></View></View>;
}

function BottomNav({ items, active, onPress, cartCount, guest }: { items: NavItem[]; active: Screen; onPress: (screen: Screen) => void; cartCount?: number; guest?: boolean }) {
  const colors = useColors();
  const { language, accessToken } = useApp();
  const [unreadMessages, setUnreadMessages] = useState(0);
  useEffect(() => {
    if (!accessToken) { setUnreadMessages(0); return; }
    let active = true;
    void apiGetConversations(accessToken).then((list) => {
      if (active) setUnreadMessages(list.reduce((sum, item) => sum + (item.unreadCount ?? 0), 0));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [accessToken]);
  return <View style={stylesFor(colors).bottomNav}>{items.map((item) => <Pressable key={item.key} style={stylesFor(colors).navItem} onPress={() => onPress(item.key)}><View><Ionicons name={item.icon} size={23} color={active === item.key ? colors.primary : colors.mutedForeground} />{item.key === 'cart' && cartCount ? <View style={stylesFor(colors).navBadge}><Text style={stylesFor(colors).countText}>{cartCount}</Text></View> : null}{item.key === 'messages' && unreadMessages ? <View style={stylesFor(colors).navBadge}><Text style={stylesFor(colors).countText}>{unreadMessages}</Text></View> : null}</View><Text style={[stylesFor(colors).navLabel, active === item.key && { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>{translateNav(item.label, language)}</Text></Pressable>)}</View>;
}

function FarmerDashboard({ onNav }: { onNav: (screen: Screen) => void }) {
  const colors = useColors();
  const { farmerListings, orders, profile, notifications, notificationsEnabled, refreshNotifications } = useApp();
  const activeProducts = farmerListings.filter((product) => product.stock > 0 && product.status !== 'removed').length;
  const pending = orders.filter((order) => order.status === 'En attente').length;
  const delivered = orders.filter((order) => order.status === 'Terminée').length;
  const revenue = orders.reduce((sum, order) => sum + (order.status === 'Annulée' ? 0 : order.total), 0);
  const lowStock = farmerListings.filter((product) => product.status !== 'removed' && product.stock > 0 && product.stock <= 5);
  const recentOrders = orders.slice(0, 3);
  const unreadNotifications = notifications.filter((item) => !item.readAt).length;
  useEffect(() => {
    if (!notificationsEnabled) return;
    void refreshNotifications();
    const timer = setInterval(() => void refreshNotifications(), 15000);
    return () => clearInterval(timer);
  }, [notificationsEnabled, refreshNotifications]);
  return <View style={stylesFor(colors).screen}><AppHeader farmer title={`Bonjour, ${profile.name.split(' ')[0]} 👋`} location={profile.location} right={<View style={stylesFor(colors).headerActions}><Pressable style={stylesFor(colors).headerCircle} onPress={() => onNav('notifications')}><Ionicons name="notifications-outline" size={19} color={colors.primary} /><View style={stylesFor(colors).unreadBadge}><Text style={stylesFor(colors).unreadText}>{unreadNotifications}</Text></View></Pressable><Pressable style={stylesFor(colors).headerCircle} onPress={() => onNav('farmer-profile')}><Ionicons name="person-outline" size={19} color={colors.primary} /></Pressable></View>} /><ScrollView contentContainerStyle={stylesFor(colors).pageContent} showsVerticalScrollIndicator={false}><SectionHeader title="Résumé du jour" /><View style={stylesFor(colors).statsGrid}><Stat label="Produits actifs" value={String(activeProducts)} icon="cube-outline" color={colors.softGreen} /><Stat label="Commandes en attente" value={String(pending)} icon="time-outline" color={colors.softGold} /><Stat label="Revenu en FCFA" value={String(revenue)} icon="trending-up-outline" color={colors.softBlue} /><Stat label="Commandes livrées" value={String(delivered)} icon="checkmark-circle-outline" color={colors.softGreen} /></View><SectionHeader title="Actions rapides" /><View style={stylesFor(colors).quickRow}><QuickAction icon="add" label="Ajouter un produit" onPress={() => onNav('product-form')} color={colors.primary} /><QuickAction icon="bag-handle-outline" label="Commandes" onPress={() => onNav('farmer-orders')} color={colors.orange} /><QuickAction icon="stats-chart-outline" label="Statistiques" onPress={() => onNav('sales')} color={colors.blue} /><QuickAction icon="trending-up-outline" label="Tendances du marché" onPress={() => onNav('sales')} color={colors.purple} /></View><SectionHeader title="Commandes récentes" action="Voir tout" onPress={() => onNav('farmer-orders')} /><View style={stylesFor(colors).recentOrders}>{recentOrders.map((order) => { const item = order.items[0]; const customer = order.buyerName ?? order.customer; const initials = customer.split(' ').map((word) => word[0]).join('').slice(0, 2); return <Pressable key={order.id} style={stylesFor(colors).recentOrder} onPress={() => onNav('farmer-orders')}><View style={stylesFor(colors).largeAvatar}><Text style={stylesFor(colors).largeAvatarText}>{initials}</Text></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>{customer}</Text><Text style={stylesFor(colors).productMeta}>{order.buyerCity ?? order.location}</Text><Text style={stylesFor(colors).hintText}>{item?.product.name} · {item?.quantity} {item?.product.unit}</Text></View><View style={stylesFor(colors).alignEnd}><Text style={stylesFor(colors).miniPrice}>{money(order.total)}</Text><FarmerOrderStatus status={order.status} /></View></Pressable>; })}{recentOrders.length === 0 && <EmptyState icon="bag-outline" title="Aucune commande reçue" body="Les nouvelles commandes de vos clients apparaîtront ici." />}</View><SectionHeader title="À surveiller" /><View style={stylesFor(colors).notificationCard}><View style={[stylesFor(colors).notificationIcon, { backgroundColor: pending ? colors.softGold : colors.softGreen }]}><Ionicons name={pending ? "time-outline" : "checkmark-circle-outline"} size={18} color={pending ? colors.orange : colors.primary} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>{pending ? `${pending} commande(s) à traiter` : 'Aucune commande en attente'}</Text><Text style={stylesFor(colors).productMeta}>{pending ? 'Ouvrez vos commandes pour confirmer ou refuser chaque demande.' : 'Votre activité est à jour.'}</Text></View></View>{lowStock.length > 0 && <View style={stylesFor(colors).notificationCard}><View style={[stylesFor(colors).notificationIcon, { backgroundColor: colors.softGold }]}><Ionicons name="warning-outline" size={18} color={colors.orange} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>Stock à renouveler</Text><Text style={stylesFor(colors).productMeta}>{lowStock.map((product) => `${product.name} (${product.stock})`).join(' · ')}</Text></View></View>}<View style={stylesFor(colors).performanceCard}><View style={stylesFor(colors).rowBetween}><View><Text style={stylesFor(colors).performanceKicker}>Performance de la ferme</Text><Text style={stylesFor(colors).performanceTitle}>{orders.length ? `${delivered}/${orders.length} commandes livrées` : 'Pas encore de commande'}</Text></View><Pressable style={stylesFor(colors).statsPill} onPress={() => onNav('sales')}><Ionicons name="stats-chart-outline" size={14} color={colors.primary} /><Text style={stylesFor(colors).statsPillText}>Stats</Text></Pressable></View><View style={stylesFor(colors).performanceRow}><PerformanceStat value={orders.length ? `${Math.round((delivered / orders.length) * 100)}%` : '—'} label="Livraison" /><PerformanceStat value={String(farmerListings.length)} label="Publications" /><PerformanceStat value={String(revenue)} label="FCFA générés" /></View></View></ScrollView><BottomNav items={farmerTabs} active="dashboard" onPress={onNav} /></View>;
}

function PerformanceStat({ value, label }: { value: string; label: string }) {
  const colors = useColors();
  return <View style={stylesFor(colors).performanceStat}><Text style={stylesFor(colors).performanceValue}>{value}</Text><Text style={stylesFor(colors).performanceLabel}>{label}</Text></View>;
}

function Stat({ label, value, icon, color, grid = false }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string; grid?: boolean }) {
  const colors = useColors();
  const isDashboardMetric = ['Produits actifs', 'Commandes en attente', 'Revenu en FCFA', 'Commandes livrées'].includes(label);
  return <View style={[stylesFor(colors).statCard, (grid || isDashboardMetric) && stylesFor(colors).dashboardStatCard, { backgroundColor: color, borderColor: color }]}><View style={[stylesFor(colors).statIcon, { backgroundColor: `${colors.primary}16` }]}><Ionicons name={icon} size={24} color={colors.primary} /></View><Ionicons name="arrow-up-outline" size={16} color={colors.primary} style={stylesFor(colors).statArrow} /><Text style={stylesFor(colors).statValue}>{value}</Text><Text style={stylesFor(colors).statLabel}>{label}</Text></View>;
}

function QuickAction({ icon, label, onPress, color, grid = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color: string; grid?: boolean }) {
  const colors = useColors();
  return <Pressable style={[stylesFor(colors).quickAction, { backgroundColor: `${color}18`, borderColor: `${color}35` }]} onPress={onPress}><View style={[stylesFor(colors).quickIcon, { backgroundColor: `${color}35` }]}><Ionicons name={icon} size={26} color={color} /></View><Text style={stylesFor(colors).quickLabel} numberOfLines={2}>{label}</Text></Pressable>;
}

function FarmerProducts({ onAdd, onEdit, onNav }: { onAdd: () => void; onEdit: (product: Product) => void; onNav: (screen: Screen) => void }) {
  const colors = useColors();
  const toast = useToast();
  const { farmerListings, deleteProduct } = useApp();
  const [filter, setFilter] = useState('Tous');
  const [query, setQuery] = useState('');
  const filtered = farmerListings.filter((product) => (filter === 'Tous' || filter === 'Disponible' && product.stock > 5 || filter === 'Faible' && product.stock > 0 && product.stock <= 5 || filter === 'Épuisé' && product.stock === 0) && `${product.name} ${product.category} ${product.farmer} ${product.location}`.toLowerCase().includes(query.trim().toLowerCase()));
  const remove = (product: Product) => Alert.alert('Supprimer le produit', `Supprimer ${product.name} ?`, [{ text: 'Annuler' }, { text: 'Supprimer', style: 'destructive', onPress: () => { void deleteProduct(product.id).catch((error) => toast(error instanceof Error ? error.message : 'La suppression du produit a échoué. Réessayez.')); } }]);
  return <View style={stylesFor(colors).screen}><AppHeader farmer title="Mes produits" subtitle={`${farmerListings.length} références publiées`} right={<Pressable style={stylesFor(colors).headerCircle} onPress={onAdd}><Ionicons name="add" size={22} color={colors.primary} /></Pressable>} /><ScrollView contentContainerStyle={stylesFor(colors).pageContent}><View style={stylesFor(colors).searchBar}><Ionicons name="search" size={20} color={colors.mutedForeground} /><TextInput value={query} onChangeText={setQuery} placeholder="Rechercher un produit" placeholderTextColor={colors.mutedForeground} style={stylesFor(colors).searchInput} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stylesFor(colors).chipRow}>{['Tous', 'Disponible', 'Faible', 'Épuisé'].map((item) => <Pressable key={item} style={[stylesFor(colors).chip, filter === item && stylesFor(colors).chipActive]} onPress={() => setFilter(item)}><Text style={[stylesFor(colors).chipText, filter === item && stylesFor(colors).chipTextActive]}>{item}</Text></Pressable>)}</ScrollView>{filtered.map((product) => <View key={product.id} style={stylesFor(colors).farmerProductCard}><Image source={{ uri: product.image }} style={stylesFor(colors).farmerProductImage} /><View style={stylesFor(colors).flex}><View style={stylesFor(colors).rowBetween}><Text style={stylesFor(colors).cardTitle}>{product.name}</Text><StockIndicator stock={product.stock} /></View><Text style={stylesFor(colors).productMeta}>{product.category}</Text><Text style={stylesFor(colors).price}>{money(product.price)} <Text style={stylesFor(colors).unit}>/{product.unit}</Text></Text><Text style={stylesFor(colors).hintText}>Stock : {product.stock} unités</Text></View><View style={stylesFor(colors).farmerActions}><Pressable onPress={() => onEdit(product)}><Feather name="edit-2" size={17} color={colors.primary} /></Pressable><Pressable onPress={() => remove(product)}><Feather name="trash-2" size={17} color={colors.destructive} /></Pressable></View></View>)}{!filtered.length && <EmptyState icon="cube-outline" title="Aucun produit dans ce filtre" body="Ajoutez votre prochaine récolte en quelques secondes." action="Ajouter un produit" onAction={onAdd} />}</ScrollView><Pressable style={stylesFor(colors).floatingButton} onPress={onAdd}><Ionicons name="add" size={28} color={colors.primaryForeground} /></Pressable><BottomNav items={farmerTabs} active="farmer-products" onPress={onNav} /></View>;
}

function StockIndicator({ stock }: { stock: number }) {
  const colors = useColors();
  const color = stock === 0 ? colors.destructive : stock <= 5 ? colors.orange : colors.primary;
  const label = stock === 0 ? 'Épuisé' : stock <= 5 ? 'Stock faible' : 'Disponible';
  return <View style={[stylesFor(colors).stockPill, { backgroundColor: `${color}18` }]}><Text style={[stylesFor(colors).statusText, { color }]}>{label}</Text></View>;
}

function FarmerOrderStatus({ status }: { status: import('@/src/app-context').Order['status'] }) {
  const colors = useColors();
  const color = status === 'Terminée' ? colors.primary : status === 'Annulée' ? colors.destructive : status === 'Confirmée' ? colors.greenLight : colors.blueStatus;
  const label = status === 'Terminée' ? 'Livrée' : status;
  return <View style={[stylesFor(colors).statusPill, { backgroundColor: `${color}20` }]}><Text style={[stylesFor(colors).statusText, { color }]}>{label}</Text></View>;
}

function FarmerProductForm({ product, onBack, onSaved }: { product: Product | null; onBack: () => void; onSaved: () => void }) {
  return <FarmerProductEditor product={product} onBack={onBack} onSaved={onSaved} />;
  const colors = useColors();
  const { saveProduct, profile, categories: categoryOptions } = useApp();
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [unit, setUnit] = useState(product?.unit ?? 'sac');
  const [category, setCategory] = useState(product?.category ?? 'legumes');
  const [stock, setStock] = useState(String(product?.stock ?? ''));
  const [productIcon, setProductIcon] = useState('🍍');
  const submit = () => {
    if (!name.trim() || !price || !stock) return Alert.alert('Formulaire incomplet', 'Renseignez le nom, le prix et le stock.');
    saveProduct({ id: product?.id ?? `p-${Date.now()}`, name, description: description || 'Produit agricole local soigneusement sélectionné.', price: Number(price), unit, category, stock: Number(stock), image: product?.image ?? '', farmer: profile.name, location: profile.location, rating: product?.rating ?? 4.7, isPopular: product?.isPopular });
    onSaved();
  };
  const productIcons = ['🍍', '🍠', '🦐', '🥬', '🍊', '🌾', '🥔'];
  // @ts-expect-error React Native Alert option inference is narrower than the cancel action used by these legacy inline pickers.
  return <KeyboardAvoidingView style={stylesFor(colors).screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={stylesFor(colors).productFormContent} keyboardShouldPersistTaps="handled"><View style={stylesFor(colors).productFormHeader}><Pressable onPress={onBack} style={stylesFor(colors).productBack}><Ionicons name="arrow-back" size={25} color={colors.foreground} /></Pressable><Text style={stylesFor(colors).productFormTitle}>{product ? 'Modifier un produit' : 'Ajouter un produit'}</Text></View><Text style={stylesFor(colors).productFormLabel}>Icône du produit</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stylesFor(colors).productIconRow}>{[...productIcons, ...productIcons].map((icon, index) => <Pressable key={`${icon}-${index}`} onPress={() => setProductIcon(icon)} style={[stylesFor(colors).productIconChoice, productIcon === icon && stylesFor(colors).productIconSelected]}><Text style={stylesFor(colors).productIconText}>{icon}</Text></Pressable>)}</ScrollView><Text style={stylesFor(colors).productFormLabel}>Photo du produit</Text><Pressable style={stylesFor(colors).productImagePicker} onPress={() => Alert.alert('Photo du produit', 'La sélection d’image sera disponible dans la prochaine version.') }><Ionicons name="camera-outline" size={34} color={colors.primary} /><Text style={stylesFor(colors).productImageText}>Appuyez pour ajouter une image</Text></Pressable><Text style={stylesFor(colors).productFormLabel}>Nom du produit</Text><TextInput style={stylesFor(colors).productFormInput} placeholder="Ex: Tomates fraîches" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} /><Text style={stylesFor(colors).productFormLabel}>Catégorie</Text><Pressable style={stylesFor(colors).productFormInputRow} onPress={() => Alert.alert('Catégorie', 'Choisissez une catégorie', categories.slice(1).map((item) => ({ text: item.label, onPress: () => setCategory(item.id) })).concat([{ text: 'Annuler', style: 'cancel' as const }]))}><Text style={stylesFor(colors).productFormPlaceholder}>{categories.find((item) => item.id === category)?.label ?? 'Légumes'}</Text><Ionicons name="chevron-down" size={21} color={colors.mutedForeground} /></Pressable><View style={stylesFor(colors).productFormTwoColumns}><View style={stylesFor(colors).productFormColumn}><Text style={stylesFor(colors).productFormLabel}>Quantité</Text><TextInput style={stylesFor(colors).productFormInput} placeholder="0" placeholderTextColor={colors.mutedForeground} value={stock} onChangeText={setStock} keyboardType="number-pad" /></View><View style={stylesFor(colors).productFormColumn}><Text style={stylesFor(colors).productFormLabel}>Unité</Text><Pressable style={stylesFor(colors).productFormInputRow} onPress={() => Alert.alert('Unité', 'Choisissez une unité', ['Kg', 'Unité', 'Sac', 'Caisse', 'Filet', 'Régime', 'Tas', 'Litre'].map((item) => ({ text: item, onPress: () => setUnit(item.toLowerCase()) })).concat([{ text: 'Annuler', style: 'cancel' as const }]))}><Text style={stylesFor(colors).productFormPlaceholder}>{unit || 'Kg'}</Text><Ionicons name="chevron-down" size={21} color={colors.mutedForeground} /></Pressable></View></View><Text style={stylesFor(colors).productFormLabel}>Localisation</Text><TextInput style={stylesFor(colors).productFormInput} placeholder="Ex: Okola" placeholderTextColor={colors.mutedForeground} defaultValue="Yaoundé" /><Text style={stylesFor(colors).productFormLabel}>Description</Text><TextInput style={[stylesFor(colors).productFormInput, stylesFor(colors).productFormMultiline]} placeholder="Décrivez votre produit..." placeholderTextColor={colors.mutedForeground} value={description} onChangeText={setDescription} multiline /><Text style={stylesFor(colors).productFormLabel}>Prix</Text><TextInput style={stylesFor(colors).productFormInput} placeholder="Ex: 5000 fcfa" placeholderTextColor={colors.mutedForeground} value={price} onChangeText={setPrice} keyboardType="number-pad" /><Pressable style={stylesFor(colors).productSaveButton} onPress={submit}><Ionicons name="checkmark-circle-outline" size={21} color={colors.primaryForeground} /><Text style={stylesFor(colors).productSaveText}>Enregistrer le produit</Text></Pressable></ScrollView></KeyboardAvoidingView>;
  return <KeyboardAvoidingView style={stylesFor(colors).screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={stylesFor(colors).formContent} keyboardShouldPersistTaps="handled"><AppHeader title={product ? 'Modifier le produit' : 'Ajouter un produit'} onBack={onBack} /><Field label="Nom du produit" placeholder="Ex : Avocats frais" value={name} onChangeText={setName} icon="leaf-outline" /><Field label="Description" placeholder="Décrivez votre récolte" value={description} onChangeText={setDescription} icon="document-text-outline" /><View style={stylesFor(colors).formRow}><View style={stylesFor(colors).half}><Field label="Prix (FCFA)" placeholder="4000" value={price} onChangeText={setPrice} icon="cash-outline" keyboardType="phone-pad" /></View><View style={stylesFor(colors).half}><UnitSelect value={unit} onChange={setUnit} /></View></View><Field label="Stock disponible" placeholder="20" value={stock} onChangeText={setStock} icon="cube-outline" keyboardType="phone-pad" /><Text style={stylesFor(colors).fieldLabel}>Catégorie</Text><View style={stylesFor(colors).chipWrap}>{categories.slice(1).map((item) => <Pressable key={item.id} style={[stylesFor(colors).chip, category === item.id && stylesFor(colors).chipActive]} onPress={() => setCategory(item.id)}><Text style={[stylesFor(colors).chipText, category === item.id && stylesFor(colors).chipTextActive]}>{item.label}</Text></Pressable>)}</View><View style={stylesFor(colors).uploadCard}><Ionicons name="image-outline" size={26} color={colors.primary} /><Text style={stylesFor(colors).cardTitle}>Image du produit</Text><Text style={stylesFor(colors).productMeta}>L’image de démonstration sera utilisée pour cette version locale.</Text></View><Pressable style={stylesFor(colors).primaryButton} onPress={submit}><Text style={stylesFor(colors).primaryButtonText}>{product ? 'Enregistrer les modifications' : 'Publier le produit'}</Text><Ionicons name="checkmark" size={18} color={colors.primaryForeground} /></Pressable></ScrollView></KeyboardAvoidingView>;
}

function FarmerOrders({ onNav, onOrder, onMessageOrder }: { onNav: (screen: Screen) => void; onOrder: (id: string) => void; onMessageOrder?: (orderId: string) => void }) {
  const colors = useColors();
  const { orders } = useApp();
  const [filter, setFilter] = useState('Toutes');
  const filters = ['Toutes', 'En attente', 'Confirmée', 'Livrée', 'Annulée'];
  const filtered = filter === 'Toutes' ? orders : filter === 'Livrée' ? orders.filter((order) => order.status === 'Terminée') : orders.filter((order) => order.status === filter);
  const countFor = (status: string) => status === 'Toutes' ? orders.length : status === 'Livrée' ? orders.filter((order) => order.status === 'Terminée').length : orders.filter((order) => order.status === status).length;
  const openMessage = (orderId: string) => {
    if (onMessageOrder) { onMessageOrder(orderId); return; }
    onNav('messages');
  };
  const renderOrderCard = (order: import('@/src/app-context').Order) => {
    const item = order.items[0];
  const customerInitials = initials(order.customer);
    return (
      <Pressable key={order.id} style={stylesFor(colors).farmerOrderReferenceCard} onPress={() => onOrder(order.id)}>
        <View style={stylesFor(colors).rowBetween}>
          <View style={stylesFor(colors).orderReferenceHead}>
            <Text style={stylesFor(colors).orderReferenceId}>{formatOrderCode(order.id)}</Text>
            <FarmerOrderStatus status={order.status} />
          </View>
          <Text style={stylesFor(colors).orderReferenceDate}>{order.date === 'Aujourd’hui' ? '2026-07-25' : order.date}</Text>
        </View>
        <View style={stylesFor(colors).orderReferenceBody}>
          <View style={stylesFor(colors).orderReferenceAvatar}>
            <AvatarFill name={order.customer} uri={order.buyerAvatar} textStyle={stylesFor(colors).largeAvatarText} />
          </View>
          <View style={stylesFor(colors).flex}>
            <View style={stylesFor(colors).rowBetween}>
              <Text style={stylesFor(colors).cardTitle}>{order.customer}</Text>
              <Text style={stylesFor(colors).productMeta}>{item.product.name}</Text>
            </View>
            <View style={stylesFor(colors).rowBetween}>
              <Text style={stylesFor(colors).miniPrice}>{money(order.total)}</Text>
              <Pressable style={stylesFor(colors).orderActionButton} onPress={(event) => { event.stopPropagation(); openMessage(order.id); }}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };
  return (
    <View style={stylesFor(colors).screen}>
      <AppHeader farmer title="Commandes reçues" right={<Pressable style={stylesFor(colors).headerCircle} onPress={() => onNav('messages')}><Ionicons name="chatbubble-outline" size={22} color={colors.primary} /></Pressable>} />
      <ScrollView contentContainerStyle={stylesFor(colors).farmerOrdersContent} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stylesFor(colors).farmerFilterRow}>
          {filters.map((item) => (
            <Pressable key={item} style={[stylesFor(colors).farmerFilter, filter === item && stylesFor(colors).farmerFilterActive]} onPress={() => setFilter(item)}>
              <Text style={[stylesFor(colors).farmerFilterText, filter === item && stylesFor(colors).farmerFilterTextActive]}>{item} <Text style={stylesFor(colors).farmerFilterCount}>{countFor(item)}</Text></Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={stylesFor(colors).ordersSeeAll} onPress={() => setFilter('Toutes')}>
          <Text style={stylesFor(colors).ordersSeeAllText}>Voir tout</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>
        {filtered.map(renderOrderCard)}
        {filtered.length === 0 && <EmptyState icon="bag-outline" title="Aucune commande" body="Les demandes de vos clients apparaîtront ici." />}
      </ScrollView>
      <BottomNav items={farmerTabs} active="farmer-orders" onPress={onNav} />
    </View>
  );
}

function SalesScreen({ onNav }: { onNav: (screen: Screen) => void }) {
  const colors = useColors();
  const { farmerListings, orders } = useApp();
  const delivered = orders.filter((order) => order.status === 'Terminée');
  const revenue = orders.reduce((sum, order) => sum + (order.status === 'Annulée' ? 0 : order.total), 0);
  const soldByProduct = farmerListings.map((product) => {
    const sold = orders.filter((order) => order.items.some((line) => line.product.id === product.id)).reduce((sum, order) => sum + order.items.filter((line) => line.product.id === product.id).reduce((lineSum, line) => lineSum + line.quantity, 0), 0);
    return { product, sold };
  }).filter((item) => item.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 4);
  return <View style={stylesFor(colors).screen}><AppHeader farmer title="Ventes & statistiques" subtitle="Données issues de vos commandes" right={<Pressable style={stylesFor(colors).headerCircle} onPress={() => onNav('messages')}><Ionicons name="chatbubble-outline" size={19} color={colors.primary} /></Pressable>} /><ScrollView contentContainerStyle={stylesFor(colors).pageContent}><View style={stylesFor(colors).salesHero}><Text style={stylesFor(colors).productMeta}>Revenus cumulés</Text><Text style={stylesFor(colors).salesValue}>{money(revenue)}</Text><View style={stylesFor(colors).growth}><Ionicons name="receipt-outline" size={15} color={colors.primary} /><Text style={stylesFor(colors).growthText}>{orders.length} commande(s) · {delivered.length} livrée(s)</Text></View></View><SectionHeader title="Votre activité" /><View style={stylesFor(colors).statsGrid}><Stat label="Commandes" value={String(orders.length)} icon="bag-handle-outline" color={colors.softGreen} /><Stat label="Livrées" value={String(delivered.length)} icon="checkmark-circle-outline" color={colors.softBlue} /></View><SectionHeader title="Produits vendus" />{soldByProduct.map(({ product, sold }, index) => <View key={product.id} style={stylesFor(colors).salesRow}><Text style={stylesFor(colors).rank}>{index + 1}</Text><Image source={{ uri: product.image }} style={stylesFor(colors).salesImage} /><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>{product.name}</Text><Text style={stylesFor(colors).productMeta}>{sold} unité(s) commandée(s)</Text></View><Text style={stylesFor(colors).miniPrice}>{money(product.price * sold)}</Text></View>)}{soldByProduct.length === 0 && <EmptyState icon="stats-chart-outline" title="Pas encore de vente" body="Les produits vendus apparaîtront ici dès votre première commande." />}</ScrollView><BottomNav items={farmerTabs} active="sales" onPress={onNav} /></View>;
}

function FarmerProfile({ onNav, onSignOut }: { onNav: (screen: Screen) => void; onSignOut: () => void }) {
  const colors = useColors();
  const { themeMode, setThemeMode, language, setLanguage } = useApp();
  const chooseLanguage = () => Alert.alert('Langue', 'Choisissez la langue de l’application.', [{ text: 'Français', onPress: () => setLanguage('fr') }, { text: 'English', onPress: () => setLanguage('en') }, { text: 'Annuler', style: 'cancel' }]);
  return <View style={stylesFor(colors).screen}><AppHeader farmer title="Mon profil" subtitle="Votre espace agriculteur" right={<Pressable style={stylesFor(colors).headerCircle} onPress={() => onNav('messages')}><Ionicons name="chatbubble-outline" size={19} color={colors.primary} /></Pressable>} /><ScrollView contentContainerStyle={stylesFor(colors).pageContent}><View style={stylesFor(colors).profileCard}><View style={stylesFor(colors).largeAvatar}><Text style={stylesFor(colors).largeAvatarText}>CB</Text></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).h3}>Cendra B.</Text><Text style={stylesFor(colors).productMeta}>Agriculteur · Yaoundé</Text><Text style={stylesFor(colors).rating}>Membre depuis 2026</Text></View><Ionicons name="create-outline" size={21} color={colors.primary} /></View><ProfileMenuItem icon="business-outline" title="Mon exploitation" subtitle="Informations de l’exploitation" /><ProfileMenuItem icon="call-outline" title="Coordonnées" subtitle="+237 6 90 00 00 00" /><ProfileMenuItem icon="shield-checkmark-outline" title="Sécurité" subtitle="Email et mot de passe" /><ProfileMenuItem icon="moon-outline" title="Apparence" subtitle={themeMode === 'dark' ? 'Mode nuit' : 'Mode jour'} toggle value={themeMode === 'dark'} onToggle={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} /><ProfileMenuItem icon="globe-outline" title="Langue" subtitle={language === 'fr' ? 'Français' : 'English'} onPress={chooseLanguage} /><ProfileMenuItem icon="help-circle-outline" title="Centre d’aide" subtitle="Besoin d’assistance ?" /><Pressable style={stylesFor(colors).logoutButton} onPress={onSignOut}><Ionicons name="log-out-outline" size={19} color={colors.destructive} /><Text style={stylesFor(colors).dangerLink}>Se déconnecter</Text></Pressable></ScrollView><BottomNav items={farmerTabs} active="farmer-profile" onPress={onNav} /></View>;
}

function AccountProfile({ onNav, onSignOut, farmer = false }: { onNav: (screen: Screen) => void; onSignOut: () => void; farmer?: boolean }) {
  return <ProfileSettingsScreen onNav={onNav} onSignOut={onSignOut} farmer={farmer} />;
  const colors = useColors();
  const toast = useToast();
  const { cartCount, profile, updateProfile, themeMode, setThemeMode, language, setLanguage, paymentMethods, selectedPaymentMethodId, selectPaymentMethod, addPaymentMethod } = useApp();
  const [editing, setEditing] = useState(false);
  const [paymentEditor, setPaymentEditor] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [paymentLabel, setPaymentLabel] = useState('Mobile Money');
  const [paymentReference, setPaymentReference] = useState('');
  const chooseLanguage = () => Alert.alert('Langue', 'Choisissez la langue de l’application.', [...languageOptions.map((item) => ({ text: item.label, onPress: () => setLanguage(item.code) })), { text: 'Annuler', style: 'cancel' }]);
  const choosePayment = () => onNav('payment-methods');
  const saveProfile = async () => {
    const selectedCountry = countryOptions.find((country) => country.code === draft.countryCode) ?? countryOptions[0];
    const number = normalizePhone(draft.phone);
    if (draft.name.trim().length < 2) {
      toast('Votre nom doit contenir au moins 2 caractères.');
      return;
    }
    if (number.length !== selectedCountry.digits) {
      toast('Vérifiez votre numéro de téléphone.');
      return;
    }
    updateProfile({ ...draft, name: draft.name.trim(), email: draft.email.trim(), phone: number, countryName: selectedCountry.name, location: draft.location.trim(), address: draft.address.trim(), crops: draft.crops.trim(), surface: draft.surface.trim() });
    setEditing(false);
    toast('Profil enregistré sur cet appareil.');
  };
  const addPayment = () => {
    if (!paymentLabel.trim() || normalizePhone(paymentReference).length < 7) return toast('Saisissez le nom du moyen et un numéro de paiement valide.');
    addPaymentMethod({ label: paymentLabel.trim(), holder: draft.name || profile.name, reference: paymentReference.trim() });
    setPaymentReference('');
    setPaymentEditor(false);
  };
  const roleLabel = farmer ? 'Agriculteur' : 'Acheteur';
  const selectedPayment = paymentMethods.find((method) => method.id === selectedPaymentMethodId) ?? { label: '', reference: '' };
  return <View style={stylesFor(colors).screen}><AppHeader farmer={farmer} title="Mon profil" subtitle={farmer ? 'Votre espace agriculteur' : 'Votre espace personnel'} right={<Pressable style={stylesFor(colors).headerCircle} onPress={() => onNav('messages')}><Ionicons name="chatbubble-outline" size={19} color={colors.primary} /></Pressable>} /><ScrollView contentContainerStyle={stylesFor(colors).pageContent} keyboardShouldPersistTaps="handled"><View style={stylesFor(colors).profileCard}><View style={stylesFor(colors).largeAvatar}><Text style={stylesFor(colors).largeAvatarText}>{initials(profile.name)}</Text></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).h3}>{profile.name}</Text><Text style={stylesFor(colors).productMeta}>{roleLabel} · {profile.location}</Text><Text style={stylesFor(colors).rating}>{profile.countryCode} {profile.phone}</Text></View><Pressable onPress={() => { setDraft(profile); setEditing(!editing); }} style={stylesFor(colors).profileEditButton}><Ionicons name="create-outline" size={17} color={colors.primary} /><Text style={stylesFor(colors).profileEditLabel}>{editing ? 'Fermer' : 'Modifier'}</Text></Pressable></View>{editing && <View style={stylesFor(colors).editCard}><Text style={stylesFor(colors).settingsEditorTitle}>Informations personnelles</Text><Field label="Nom complet" placeholder="Votre nom" value={draft.name} onChangeText={(name) => setDraft((current) => ({ ...current, name }))} icon="person-outline" /><Field label="Adresse email" placeholder="vous@exemple.com" value={draft.email} onChangeText={(email) => setDraft((current) => ({ ...current, email }))} keyboardType="email-address" icon="mail-outline" /><CountryPhoneField countryCode={draft.countryCode} phone={draft.phone} onCountryChange={(country) => setDraft((current) => ({ ...current, countryCode: country.code, countryName: country.name }))} onPhoneChange={(phone) => setDraft((current) => ({ ...current, phone }))} /><LocationEditor location={draft.location} address={draft.address} onLocationChange={(location) => setDraft((current) => ({ ...current, location }))} onAddressChange={(address) => setDraft((current) => ({ ...current, address }))} />{farmer && <><Text style={stylesFor(colors).settingsEditorTitle}>Mon exploitation</Text><Field label="Cultures principales" placeholder="Tomates, maïs…" value={draft.crops} onChangeText={(crops) => setDraft((current) => ({ ...current, crops }))} icon="leaf-outline" /><Field label="Superficie" placeholder="1 ha" value={draft.surface} onChangeText={(surface) => setDraft((current) => ({ ...current, surface }))} icon="resize-outline" /></>}<Pressable style={stylesFor(colors).smallButton} onPress={saveProfile}><Text style={stylesFor(colors).smallButtonText}>Enregistrer les modifications</Text></Pressable></View>}<ProfileMenuItem icon="location-outline" title="Adresse" subtitle={profile.address} onPress={() => { setDraft(profile); setEditing(true); }} /><ProfileMenuItem icon="card-outline" title="Moyen de paiement" subtitle={selectedPayment ? `${selectedPayment.label} · ${selectedPayment.reference}` : 'Ajouter un moyen'} onPress={choosePayment} /><ProfileMenuItem icon="notifications-outline" title="Notifications" subtitle={profile.notificationsEnabled ? 'Activées' : 'Désactivées'} toggle value={profile.notificationsEnabled} onToggle={() => updateProfile({ notificationsEnabled: !profile.notificationsEnabled })} /><ProfileMenuItem icon="moon-outline" title="Apparence" subtitle={themeMode === 'dark' ? 'Mode nuit' : 'Mode jour'} toggle value={themeMode === 'dark'} onToggle={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} /><ProfileMenuItem icon="globe-outline" title="Langue" subtitle={languageLabel(language)} onPress={chooseLanguage} /><ProfileMenuItem icon="shield-checkmark-outline" title="Sécurité" subtitle="Mot de passe et accès" onPress={() => Alert.alert('Sécurité du compte', 'Pour changer votre mot de passe, utilisez « Mot de passe oublié » depuis l’écran de connexion.')} /><ProfileMenuItem icon="help-circle-outline" title="Centre d’aide" subtitle="FAQ et assistance" onPress={() => Alert.alert('Centre d’aide', 'Pour toute assistance, écrivez à support@adjal.cm ou ouvrez la conversation « A djal support ».')} />{paymentEditor && <View style={stylesFor(colors).editCard}><Text style={stylesFor(colors).settingsEditorTitle}>Ajouter un paiement local</Text><Field label="Moyen de paiement" placeholder="Mobile Money, Orange Money…" value={paymentLabel} onChangeText={setPaymentLabel} icon="card-outline" /><Field label="Numéro associé" placeholder="6 90 00 00 00" value={paymentReference} onChangeText={setPaymentReference} keyboardType="phone-pad" icon="call-outline" /><Pressable style={stylesFor(colors).smallButton} onPress={addPayment}><Text style={stylesFor(colors).smallButtonText}>Ajouter ce moyen</Text></Pressable></View>}<Pressable style={stylesFor(colors).logoutButton} onPress={onSignOut}><Ionicons name="log-out-outline" size={19} color={colors.destructive} /><Text style={stylesFor(colors).dangerLink}>Se déconnecter</Text></Pressable></ScrollView><BottomNav items={farmer ? farmerTabs : buyerTabs} active={farmer ? 'farmer-profile' : 'profile'} onPress={onNav} cartCount={cartCount} /></View>;
}

function ProfileAvatar({ uri, name, editable, onPress }: { uri?: string; name: string; editable?: boolean; onPress?: () => void }) {
  const colors = useColors();
  const displayInitials = initials(name);
  return <Pressable disabled={!editable} accessibilityLabel="Choisir une photo de profil" onPress={onPress} style={stylesFor(colors).avatarPressable}>
    <View style={stylesFor(colors).largeAvatar}>{uri ? <Image source={{ uri }} style={stylesFor(colors).avatarPhoto} /> : <Text style={stylesFor(colors).largeAvatarText}>{displayInitials}</Text>}</View>
    {editable && <View style={stylesFor(colors).avatarCamera}><Ionicons name="camera" size={13} color={colors.primaryForeground} /></View>}
  </Pressable>;
}

/** Icône, couleur et libellé d'action selon le type de notification envoyé par le backend. */
function notificationPresentation(item: ApiNotification): { icon: keyof typeof Ionicons.glyphMap; action: string | null } {
  const source = item.resourceType ?? '';
  if (item.type === 'message' || source === 'conversation') return { icon: 'chatbubble-ellipses-outline', action: 'Ouvrir la conversation' };
  if (item.type === 'new_order') return { icon: 'bag-add-outline', action: 'Voir la commande' };
  if (item.type.includes('order') || source === 'order') return { icon: 'bag-handle-outline', action: 'Voir la commande' };
  if (item.type.includes('product') || source === 'product') return { icon: 'leaf-outline', action: 'Voir le produit' };
  return { icon: 'notifications-outline', action: null };
}

function NotificationsScreen({ onBack, onOpen }: { onBack: () => void; onOpen: (item: ApiNotification) => Promise<boolean> }) {
  const colors = useColors();
  const toast = useToast();
  const { accessToken, profile, refreshNotifications } = useApp();
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const load = async () => {
    if (!accessToken || !profile.notificationsEnabled) { setItems([]); setLoading(false); return; }
    try {
      const result = await apiGetNotifications(accessToken);
      setItems([...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      // Garde la liste actuelle si le serveur ne répond pas.
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [accessToken, profile.notificationsEnabled]);
  const unread = items.filter((item) => !item.readAt).length;
  const markRead = async (item: ApiNotification) => {
    if (!accessToken || item.readAt) return;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry));
    try {
      await apiMarkNotificationRead(accessToken, item.id);
    } finally {
      void refreshNotifications();
    }
  };
  const markAllRead = async () => {
    const pending = items.filter((item) => !item.readAt);
    await Promise.allSettled(pending.map((item) => markRead(item)));
  };
  const open = async (item: ApiNotification) => {
    if (openingId) return;
    setOpeningId(item.id);
    try {
      await markRead(item);
      const opened = await onOpen(item);
      if (!opened) toast('Le contenu lié à cette notification n’est plus disponible.');
    } catch {
      toast('Impossible d’ouvrir cette notification pour le moment.');
    } finally {
      setOpeningId(null);
    }
  };
  const styles = stylesFor(colors);
  return <View style={styles.screen}>
    <AppHeader
      title="Notifications"
      onBack={onBack}
      subtitle={profile.notificationsEnabled ? `${unread} non lue(s)` : 'Désactivées'}
      right={unread > 0 ? <Pressable onPress={() => void markAllRead()} hitSlop={8}><Text style={styles.sectionAction}>Tout lire</Text></Pressable> : undefined}
    />
    <ScrollView contentContainerStyle={styles.pageContent}>
      {!profile.notificationsEnabled
        ? <EmptyState icon="notifications-off-outline" title="Notifications désactivées" body="Activez-les depuis votre profil pour afficher les événements serveur." />
        : loading
          ? <Text style={styles.body}>Chargement…</Text>
          : items.length === 0
            ? <EmptyState icon="notifications-outline" title="Aucune notification" body="Les commandes, messages et produits apparaîtront ici." />
            : items.map((item) => {
              const presentation = notificationPresentation(item);
              const isUnread = !item.readAt;
              return <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityHint={presentation.action ?? undefined}
                style={({ pressed }) => [styles.notificationCard, isUnread && { borderColor: colors.primary, backgroundColor: colors.softGreen }, pressed && { opacity: 0.7 }]}
                onPress={() => void open(item)}
              >
                <View style={styles.notificationIcon}><Ionicons name={presentation.icon} size={18} color={colors.primary} /></View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.bodySmall}>{item.body}</Text>
                  <Text style={styles.hintText}>{formatMessageTime(item.createdAt)}{presentation.action ? ` · ${presentation.action}` : ''}</Text>
                </View>
                {openingId === item.id
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <View style={{ alignItems: 'center', gap: 6 }}>
                    {isUnread && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary }} />}
                    {presentation.action && <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />}
                  </View>}
              </Pressable>;
            })}
    </ScrollView>
  </View>;
}

function ProfileSettingsScreen({ onNav, onSignOut, farmer }: { onNav: (screen: Screen) => void; onSignOut: () => void; farmer: boolean }) {
  const colors = useColors();
  const toast = useToast();
  const { accessToken, cartCount, profile, updateProfile, updateNotificationPreferences, themeMode, setThemeMode, language, setLanguage, paymentMethods, selectedPaymentMethodId } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const choosePhoto = async () => {
    try {
      const avatarUri = await selectImageFromLibrary([1, 1]);
      if (!avatarUri) return;
      if (!accessToken) return toast('Connectez-vous pour enregistrer votre photo de profil.');
      const result = await apiUploadProfileAvatar(accessToken, { uri: avatarUri, name: 'avatar.jpg', type: 'image/jpeg' });
       updateProfile({ avatarUri: apiAssetUrl(result.avatarUrl) });
    } catch {
      toast('Autorisez l’accès aux photos pour choisir une image de profil.');
    }
  };
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        toast('Autorisez l’accès à la caméra pour filmer une photo de profil.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [1, 1] });
      if (result.canceled || !result.assets[0]?.uri) return;
      if (!accessToken) return toast('Connectez-vous pour enregistrer votre photo de profil.');
      const uploaded = await apiUploadProfileAvatar(accessToken, { uri: result.assets[0].uri, name: 'avatar.jpg', type: 'image/jpeg' });
      updateProfile({ avatarUri: apiAssetUrl(uploaded.avatarUrl) });
    } catch {
      toast('La caméra n’a pas pu être ouverte. Vérifiez ses autorisations.');
    }
  };
  const removePhoto = async () => {
    if (!accessToken) {
      updateProfile({ avatarUri: undefined });
      return;
    }
    try {
      await apiUpdateProfile(accessToken, { avatarUrl: null });
      updateProfile({ avatarUri: undefined });
    } catch {
      toast('La suppression de la photo a échoué. Réessayez.');
    }
  };
  const saveProfile = async () => {
    const country = countryOptions.find((item) => item.code === draft.countryCode) ?? countryOptions[0];
    const phone = normalizePhone(draft.phone);
    if (draft.name.trim().length < 2) {
      toast('Votre nom doit contenir au moins 2 caractères.');
      return;
    }
    if (phone.length !== country.digits) {
      toast('Vérifiez votre numéro de téléphone.');
      return;
    }
    try {
      if (accessToken) {
        await apiUpdateProfile(accessToken, {
          name: draft.name.trim(),
          phone,
          city: draft.location.trim(),
        });
      }
      updateProfile({ ...draft, name: draft.name.trim(), email: draft.email.trim(), phone, countryName: country.name, location: draft.location.trim(), address: draft.address.trim(), crops: draft.crops.trim(), surface: draft.surface.trim() });
      setEditing(false);
      toast(accessToken ? 'Profil enregistré sur le serveur.' : 'Connectez-vous pour synchroniser votre profil.');
    } catch {
      toast('Le profil n’a pas pu être enregistré. Vérifiez la connexion au serveur.');
    }
  };
  const selectedPayment = paymentMethods.find((method) => method.id === selectedPaymentMethodId);
  return <View style={stylesFor(colors).screen}>
    <AppHeader farmer={farmer} title="Mon profil" subtitle={farmer ? 'Votre espace agriculteur' : 'Votre espace personnel'} right={<Pressable style={stylesFor(colors).headerCircle} onPress={() => onNav('messages')}><Ionicons name="chatbubble-outline" size={19} color={colors.primary} /></Pressable>} />
    <ScrollView contentContainerStyle={stylesFor(colors).pageContent} keyboardShouldPersistTaps="handled">
      <View style={stylesFor(colors).profileCard}>
        <ProfileAvatar uri={profile.avatarUri} name={profile.name} editable={editing} onPress={editing ? choosePhoto : undefined} />
        <View style={stylesFor(colors).flex}><Text style={stylesFor(colors).h3}>{profile.name}</Text><Text style={stylesFor(colors).productMeta}>{farmer ? 'Agriculteur' : 'Acheteur'} · {profile.location}</Text><Text style={stylesFor(colors).rating}>{profile.countryCode} {profile.phone}</Text></View>
        <Pressable onPress={() => { setDraft(profile); setEditing((value) => !value); }} style={stylesFor(colors).profileEditButton}><Ionicons name="create-outline" size={17} color={colors.primary} /><Text style={stylesFor(colors).profileEditLabel}>{editing ? 'Fermer' : 'Modifier'}</Text></Pressable>
      </View>
      {editing && <View style={stylesFor(colors).photoActionRow}><Pressable style={stylesFor(colors).outlineButton} onPress={choosePhoto}><Ionicons name="image-outline" size={17} color={colors.primary} /><Text style={stylesFor(colors).outlineButtonText}>Choisir une photo</Text></Pressable><Pressable style={stylesFor(colors).outlineButton} onPress={takePhoto}><Ionicons name="camera-outline" size={17} color={colors.primary} /><Text style={stylesFor(colors).outlineButtonText}>Filmer une photo</Text></Pressable>{profile.avatarUri && <Pressable style={stylesFor(colors).textButton} onPress={() => { void removePhoto(); }}><Text style={stylesFor(colors).dangerLink}>Supprimer</Text></Pressable>}</View>}
      {editing && <View style={stylesFor(colors).editCard}>
        <Text style={stylesFor(colors).settingsEditorTitle}>Informations personnelles</Text>
        <Field label="Nom complet" placeholder="Votre nom" value={draft.name} onChangeText={(name) => setDraft((current) => ({ ...current, name }))} icon="person-outline" />
        <Field label="Adresse email" placeholder="vous@exemple.com" value={draft.email} onChangeText={(email) => setDraft((current) => ({ ...current, email }))} keyboardType="email-address" icon="mail-outline" />
        <CountryPhoneField countryCode={draft.countryCode} phone={draft.phone} onCountryChange={(country) => setDraft((current) => ({ ...current, countryCode: country.code, countryName: country.name }))} onPhoneChange={(phone) => setDraft((current) => ({ ...current, phone }))} />
        <LocationEditor location={draft.location} address={draft.address} onLocationChange={(location) => setDraft((current) => ({ ...current, location }))} onAddressChange={(address) => setDraft((current) => ({ ...current, address }))} />
        {farmer && <><Text style={stylesFor(colors).settingsEditorTitle}>Mon exploitation</Text><Field label="Cultures principales" placeholder="Tomates, maïs…" value={draft.crops} onChangeText={(crops) => setDraft((current) => ({ ...current, crops }))} icon="leaf-outline" /><Field label="Superficie" placeholder="1 ha" value={draft.surface} onChangeText={(surface) => setDraft((current) => ({ ...current, surface }))} icon="resize-outline" /></>}
        <Pressable style={stylesFor(colors).smallButton} onPress={saveProfile}><Text style={stylesFor(colors).smallButtonText}>Enregistrer les modifications</Text></Pressable>
      </View>}
      <ProfileMenuItem icon="card-outline" title="Moyen de paiement" subtitle={selectedPayment ? `${selectedPayment.label} · ${selectedPayment.reference}` : 'Ajouter un moyen'} onPress={() => onNav('payment-methods')} />
      {!farmer && <ProfileMenuItem icon="heart-outline" title="Centre d’intérêts" subtitle={profile.interests.length ? `${profile.interests.length} intérêt(s) sélectionné(s)` : 'Personnaliser le marché'} onPress={() => onNav('interests')} />}
      <ProfileMenuItem icon="notifications-outline" title="Notifications" subtitle={profile.notificationsEnabled ? 'Activées' : 'Désactivées'} toggle value={profile.notificationsEnabled} onToggle={async () => {}} />
      <ProfileMenuItem icon="moon-outline" title="Apparence" subtitle={themeMode === 'dark' ? 'Mode nuit' : 'Mode jour'} toggle value={themeMode === 'dark'} onToggle={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} />
      <ProfileMenuItem icon="globe-outline" title="Langue" subtitle={languageLabel(language)} onPress={() => Alert.alert('Langue', 'Choisissez la langue de l’application.', [...languageOptions.map((item) => ({ text: item.label, onPress: () => setLanguage(item.code) })), { text: 'Annuler', style: 'cancel' }])} />
      <ProfileMenuItem icon="shield-checkmark-outline" title="Sécurité" subtitle="Mot de passe et accès" onPress={() => onNav('security')} />
      <Pressable style={stylesFor(colors).logoutButton} onPress={onSignOut}><Ionicons name="log-out-outline" size={19} color={colors.destructive} /><Text style={stylesFor(colors).dangerLink}>Se déconnecter</Text></Pressable>
    </ScrollView>
    <BottomNav items={farmer ? farmerTabs : buyerTabs} active={farmer ? 'farmer-profile' : 'profile'} onPress={onNav} cartCount={cartCount} />
  </View>;
}

const interestOptions = [
  { id: 'fruits', label: 'Fruits locaux', icon: 'nutrition-outline' as const },
  { id: 'legumes', label: 'Légumes frais', icon: 'leaf-outline' as const },
  { id: 'tubercules', label: 'Tubercules', icon: 'ellipse-outline' as const },
  { id: 'cereales', label: 'Céréales', icon: 'reorder-three-outline' as const },
];

type InterestChoice = { id: string; label: string; example: string; image: string; icon: keyof typeof Ionicons.glyphMap };

function InterestOnboarding({ onDone }: { onDone: () => void }) {
  const colors = useColors();
  const toast = useToast();
  const { products, categories: categoryOptions, saveInterests } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [otherSelected, setOtherSelected] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const [saving, setSaving] = useState(false);

  const choices = useMemo<InterestChoice[]>(() => {
    const source = categoryOptions.filter((category) => category.id !== 'all' && category.active);
    const visible = source.length ? source : interestOptions.map((item) => ({ ...item, active: true }));
    return visible.map((category) => {
      const categoryProducts = products.filter((product) => product.category === category.id);
      return {
        id: category.id,
        label: category.label,
        example: categoryProducts.length
          ? categoryProducts.slice(0, 2).map((product) => product.name).join(' · ')
          : 'Récoltes locales du Cameroun',
        image: (category as { imageUrl?: string | null }).imageUrl ?? categoryProducts[0]?.image ?? categoryImageFor(category.id),
        icon: category.icon as keyof typeof Ionicons.glyphMap,
      };
    });
  }, [categoryOptions, products]);

  const count = selected.length + (otherSelected ? 1 : 0);
  const toggle = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length + (otherSelected ? 1 : 0) >= 3) {
        toast('Choisissez au maximum trois centres d’intérêt.');
        return current;
      }
      return [...current, id];
    });
  };
  const toggleOther = () => {
    if (!otherSelected && selected.length >= 3) {
      toast('Choisissez au maximum trois centres d’intérêt.');
      return;
    }
    setOtherSelected((current) => !current);
  };
  const save = async () => {
    const custom = otherSelected ? otherValue.trim() : '';
    if (count === 0) return toast('Choisissez au moins un centre d’intérêt.');
    if (otherSelected && custom.length < 2) return toast('Précisez le produit recherché dans « Autre ».');
    if (saving) return;
    setSaving(true);
    try {
      await saveInterests([...selected, ...(custom ? [`autre:${custom}`] : [])]);
      onDone();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Impossible d’enregistrer vos préférences.');
    } finally {
      setSaving(false);
    }
  };

  return <View style={stylesFor(colors).screen}>
    <View style={stylesFor(colors).interestOnboardingHeader}>
      <Image source={logo} style={stylesFor(colors).interestOnboardingLogo} resizeMode="contain" />
      <Text style={stylesFor(colors).interestStep}>{count}/3</Text>
    </View>
    <ScrollView contentContainerStyle={stylesFor(colors).interestOnboardingContent} showsVerticalScrollIndicator={false}>
      <View style={stylesFor(colors).interestOnboardingIntro}>
        <View style={stylesFor(colors).interestOnboardingIcon}><Ionicons name="sparkles-outline" size={23} color={colors.primary} /></View>
        <Text style={stylesFor(colors).h1}>Personnalisons votre marché</Text>
        <Text style={stylesFor(colors).body}>Choisissez jusqu’à trois produits que vous aimeriez voir régulièrement. Nous utiliserons vos choix, votre proximité et vos recherches pour vous recommander de vraies récoltes.</Text>
      </View>
      <Text style={stylesFor(colors).interestOnboardingLabel}>Mes produits préférés</Text>
      <View style={stylesFor(colors).interestOnboardingGrid}>
        {choices.map((choice) => {
          const active = selected.includes(choice.id);
          return <Pressable testID={`interest-${choice.id}`} key={choice.id} onPress={() => toggle(choice.id)} style={[stylesFor(colors).interestOnboardingChoice, active && stylesFor(colors).interestOnboardingChoiceActive]}>
            <Image source={{ uri: choice.image }} style={stylesFor(colors).interestOnboardingImage} />
            <View style={stylesFor(colors).flex}><Text style={[stylesFor(colors).cardTitle, active && { color: colors.primaryForeground }]}>{choice.label}</Text><Text style={[stylesFor(colors).interestOnboardingExample, active && { color: colors.primaryForeground }]} numberOfLines={1}>{choice.example}</Text></View>
            <Ionicons name={active ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={active ? colors.primaryForeground : colors.primary} />
          </Pressable>;
        })}
        <Pressable testID="interest-other" onPress={toggleOther} style={[stylesFor(colors).interestOnboardingChoice, otherSelected && stylesFor(colors).interestOnboardingChoiceActive]}>
          <View style={stylesFor(colors).interestOtherIcon}><Ionicons name="ellipsis-horizontal" size={22} color={otherSelected ? colors.primaryForeground : colors.primary} /></View>
          <View style={stylesFor(colors).flex}><Text style={[stylesFor(colors).cardTitle, otherSelected && { color: colors.primaryForeground }]}>Autre</Text><Text style={[stylesFor(colors).interestOnboardingExample, otherSelected && { color: colors.primaryForeground }]}>Un produit précis</Text></View>
          <Ionicons name={otherSelected ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={otherSelected ? colors.primaryForeground : colors.primary} />
        </Pressable>
      </View>
      {otherSelected && <TextInput value={otherValue} onChangeText={setOtherValue} placeholder="Ex : miel, arachide, poulet…" placeholderTextColor={colors.mutedForeground} style={stylesFor(colors).interestOtherInput} autoFocus />}
      <Pressable style={[stylesFor(colors).primaryButton, (saving || count === 0) && { opacity: 0.55 }]} onPress={() => { void save(); }} disabled={saving || count === 0}><Text style={stylesFor(colors).primaryButtonText}>{saving ? 'Enregistrement…' : 'Continuer vers mon marché'}</Text><Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} /></Pressable>
      <Text style={stylesFor(colors).hintText}>Vous pourrez modifier ces choix depuis votre profil.</Text>
    </ScrollView>
  </View>;
}

function InterestsScreen({ onBack, farmer }: { onBack: () => void; farmer?: boolean }) {
  const colors = useColors();
  const toast = useToast();
  const { profile, saveInterests } = useApp();
  const [selected, setSelected] = useState<string[]>(profile.interests);
  const [saving, setSaving] = useState(false);
  const toggle = (id: string) => setSelected((current) => {
    if (current.includes(id)) return current.filter((item) => item !== id);
    if (current.length >= 3) {
      toast('Choisissez au maximum trois centres d’intérêt.');
      return current;
    }
    return [...current, id];
  });
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveInterests(selected);
      toast('Vos centres d\u2019int\u00e9r\u00eats sont enregistr\u00e9s.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Impossible d\u2019enregistrer. V\u00e9rifiez votre connexion.');
    } finally {
      setSaving(false);
    }
  };
  return <View style={stylesFor(colors).screen}>
    <AppHeader farmer={farmer} title="Centre d'intérêts" subtitle="Personnalisez les produits mis en avant" onBack={onBack} />
    <ScrollView contentContainerStyle={stylesFor(colors).pageContent}>
       <Text style={stylesFor(colors).paymentIntro}>Sélectionnez jusqu’à trois produits qui comptent le plus pour vous.</Text>
      <View style={stylesFor(colors).interestGrid}>{interestOptions.map((interest) => <Pressable key={interest.id} onPress={() => toggle(interest.id)} style={[stylesFor(colors).interestCard, selected.includes(interest.id) && stylesFor(colors).interestCardSelected]}><Ionicons name={interest.icon} size={25} color={selected.includes(interest.id) ? colors.primaryForeground : colors.primary} /><Text style={[stylesFor(colors).interestLabel, selected.includes(interest.id) && stylesFor(colors).interestLabelSelected]}>{interest.label}</Text><Ionicons name={selected.includes(interest.id) ? 'checkmark-circle' : 'add-circle-outline'} size={19} color={selected.includes(interest.id) ? colors.primaryForeground : colors.mutedForeground} /></Pressable>)}</View>
      <Pressable style={[stylesFor(colors).primaryButton, saving && { opacity: 0.65 }]} onPress={save} disabled={saving}><Ionicons name="checkmark-circle-outline" size={19} color={colors.primaryForeground} /><Text style={stylesFor(colors).primaryButtonText}>{saving ? 'Enregistrement...' : 'Enregistrer mes intérêts'}</Text></Pressable>
    </ScrollView>
  </View>;
}

function SecurityScreen({ onBack, onPasswordReset, onSignOut, farmer }: { onBack: () => void; onPasswordReset: () => void; onSignOut: () => void; farmer?: boolean }) {
  const colors = useColors();
  const { profile } = useApp();
  return <View style={stylesFor(colors).screen}>
    <AppHeader farmer={farmer} title="Sécurité du compte" subtitle="Informations d’accès de la version locale" onBack={onBack} />
    <ScrollView contentContainerStyle={stylesFor(colors).pageContent}>
      <View style={stylesFor(colors).securityHero}><View style={stylesFor(colors).securityIcon}><Ionicons name="phone-portrait-outline" size={32} color={colors.primary} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).h3}>Session sécurisée active</Text><Text style={stylesFor(colors).productMeta}>{profile.email} est connecté avec une session révocable, conservée dans le coffre sécurisé de cet appareil.</Text></View></View>
      <View style={stylesFor(colors).securityCard}><Text style={stylesFor(colors).settingsEditorTitle}>Mot de passe</Text><Text style={stylesFor(colors).productMeta}>La demande de réinitialisation est protégée et ne révèle jamais si un compte existe. Le code envoyé par e-mail est valable 15 minutes et ne peut être utilisé qu’une seule fois.</Text><Pressable style={stylesFor(colors).outlineButton} onPress={onPasswordReset}><Ionicons name="key-outline" size={18} color={colors.primary} /><Text style={stylesFor(colors).outlineButtonText}>Réinitialiser mon mot de passe</Text></Pressable></View>
      <View style={stylesFor(colors).securityCard}><Text style={stylesFor(colors).settingsEditorTitle}>Accès à l’application</Text><Text style={stylesFor(colors).productMeta}>Dans cette version locale, le mode invité masque les pages personnelles, commandes, messages et gestion des produits. Cette restriction sera renforcée côté serveur avec les comptes réels.</Text></View>
      <Pressable style={stylesFor(colors).dangerButton} onPress={onSignOut}><Ionicons name="log-out-outline" size={19} color={colors.destructive} /><Text style={stylesFor(colors).dangerButtonText}>Fermer cette session</Text></Pressable>
    </ScrollView>
  </View>;
}

function FarmerProductEditor({ product, onBack, onSaved }: { product: Product | null; onBack: () => void; onSaved: () => void }) {
  const colors = useColors();
  const toast = useToast();
  const { saveProduct, profile, categories: categoryOptions } = useApp();
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [unit, setUnit] = useState(product?.unit ?? 'sac');
  const [category, setCategory] = useState(product?.category ?? 'legumes');
  const [stock, setStock] = useState(product ? String(product.stock) : '');
  const [location, setLocation] = useState(product?.location ?? profile.location);
  const [imageUri, setImageUri] = useState<string | undefined>(product?.image);
  const chooseImage = async () => {
    try {
      const uri = await selectImageFromLibrary([4, 3]);
      if (uri) setImageUri(uri);
    } catch {
      toast('Autorisez l’accès aux photos pour ajouter une image de produit.');
    }
  };
  const takeImage = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        toast('Autorisez l’accès à la caméra pour ajouter une photo de produit.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [4, 3] });
      if (!result.canceled && result.assets[0]?.uri) setImageUri(result.assets[0].uri);
    } catch {
      toast('La caméra n’a pas pu être ouverte. Vérifiez ses autorisations.');
    }
  };
  const openImageSource = () => Alert.alert('Photo du produit', 'Choisissez la source de l’image.', [
    { text: 'Galerie', onPress: () => { void chooseImage(); } },
    { text: 'Caméra', onPress: () => { void takeImage(); } },
    { text: 'Annuler', style: 'cancel' },
  ]);
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!name.trim() || !price || !stock || Number(price) <= 0 || Number(stock) < 0) return toast('Renseignez un nom, un prix et un stock valides.');
    if (saving) return;
    setSaving(true);
    try {
      await saveProduct({ id: product?.id ?? `p-${Date.now()}`, name: name.trim(), description: description.trim() || 'Produit agricole local soigneusement sélectionné.', price: Number(price), unit, category, stock: Number(stock), image: imageUri ?? '', farmer: profile.name, location: location.trim() || profile.location, rating: product?.rating ?? 4.7, isPopular: product?.isPopular });
      onSaved();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'La publication du produit a échoué. Réessayez.');
    } finally {
      setSaving(false);
    }
  };
  return <KeyboardAvoidingView style={stylesFor(colors).screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={stylesFor(colors).productFormContent} keyboardShouldPersistTaps="handled">
      <View style={stylesFor(colors).productFormHeader}><Pressable accessibilityLabel="Retour" onPress={onBack} style={stylesFor(colors).productBack}><Ionicons name="arrow-back" size={25} color={colors.foreground} /></Pressable><Text style={stylesFor(colors).productFormTitle}>{product ? 'Modifier un produit' : 'Ajouter un produit'}</Text></View>
      <Text style={stylesFor(colors).productFormLabel}>Photo du produit</Text>
       <Pressable accessibilityLabel="Ajouter une photo de produit" style={stylesFor(colors).productImagePicker} onPress={openImageSource}>{imageUri ? <Image source={{ uri: imageUri }} style={stylesFor(colors).productImagePreview} /> : <><Ionicons name="camera-outline" size={34} color={colors.primary} /><Text style={stylesFor(colors).productImageText}>Ajouter depuis la galerie ou la caméra</Text></>}<View style={stylesFor(colors).productImageHint}><Ionicons name="images-outline" size={15} color={colors.primaryForeground} /><Text style={stylesFor(colors).productImageHintText}>{imageUri ? 'Remplacer la photo' : 'Galerie ou caméra'}</Text></View></Pressable>
      {imageUri && <Pressable style={stylesFor(colors).textButton} onPress={() => setImageUri(undefined)}><Text style={stylesFor(colors).dangerLink}>Retirer la photo</Text></Pressable>}
      <Field label="Nom du produit" placeholder="Ex : Tomates fraîches" value={name} onChangeText={setName} icon="leaf-outline" />
      <Text style={stylesFor(colors).fieldLabel}>Catégorie</Text><View style={stylesFor(colors).chipWrap}>{categoryOptions.slice(1).map((item) => <Pressable key={item.id} style={[stylesFor(colors).chip, category === item.slug && stylesFor(colors).chipActive]} onPress={() => setCategory(item.slug)}><Text style={[stylesFor(colors).chipText, category === item.slug && stylesFor(colors).chipTextActive]}>{item.label}</Text></Pressable>)}</View>
      <View style={stylesFor(colors).formRow}><View style={stylesFor(colors).half}><Field label="Prix (FCFA)" placeholder="4000" value={price} onChangeText={setPrice} icon="cash-outline" keyboardType="phone-pad" /></View><View style={stylesFor(colors).half}><UnitSelect value={unit} onChange={setUnit} /></View></View>
      <Field label="Stock disponible" placeholder="20" value={stock} onChangeText={setStock} icon="cube-outline" keyboardType="phone-pad" />
      <Field label="Localisation" placeholder="Yaoundé, Cameroun" value={location} onChangeText={setLocation} icon="location-outline" />
      <Field label="Description" placeholder="Décrivez votre récolte" value={description} onChangeText={setDescription} icon="document-text-outline" />
      <Pressable style={[stylesFor(colors).primaryButton, saving && { opacity: 0.7 }]} disabled={saving} onPress={() => { void submit(); }}><Text style={stylesFor(colors).primaryButtonText}>{saving ? 'Publication en cours…' : product ? 'Enregistrer les modifications' : 'Publier le produit'}</Text><Ionicons name="checkmark" size={18} color={colors.primaryForeground} /></Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const paymentChoices: Array<{ kind: PaymentKind; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { kind: 'orange-money', label: 'Orange Money', description: 'Paiement mobile Orange', icon: 'phone-portrait-outline' },
  { kind: 'mtn-momo', label: 'MTN MoMo', description: 'Mobile Money MTN', icon: 'wallet-outline' },
  { kind: 'visa', label: 'Carte Visa', description: 'Carte bancaire Visa', icon: 'card-outline' },
  { kind: 'mastercard', label: 'Carte Mastercard', description: 'Carte bancaire Mastercard', icon: 'card-outline' },
  { kind: 'cash', label: 'Paiement à la livraison', description: 'Réglez à la réception', icon: 'cash-outline' },
];

function PaymentMethodsScreen({ onBack, onNav, farmer = false }: { onBack: () => void; onNav: (screen: Screen) => void; farmer?: boolean }) {
  const colors = useColors();
  const toast = useToast();
  const { profile, paymentMethods, selectedPaymentMethodId, selectPaymentMethod, addPaymentMethod, cartCount, language } = useApp();
  const [kind, setKind] = useState<PaymentKind>('orange-money');
  const [reference, setReference] = useState(profile.phone);
  const selectedChoice = paymentChoices.find((choice) => choice.kind === kind) ?? paymentChoices[0];
  const referenceLabel = kind === 'visa' || kind === 'mastercard' ? 'Numéro de carte' : kind === 'cash' ? 'Instructions de livraison' : 'Numéro associé';
  const addMethod = () => {
    const normalizedReference = normalizePhone(reference);
    const isCard = kind === 'visa' || kind === 'mastercard';
    if (kind !== 'cash' && normalizedReference.length < (isCard ? 12 : 7)) {
      toast('Saisissez un numéro de paiement ou de carte valide.');
      return;
    }
    const storedReference = kind === 'cash' ? 'À régler à la réception' : isCard ? `•••• ${normalizedReference.slice(-4)}` : reference.trim();
    addPaymentMethod({ kind, label: selectedChoice.label, holder: profile.name, reference: storedReference });
    toast(`${selectedChoice.label} ${translateText(language, 'est prêt pour vos prochaines commandes.')}`);
  };
  return <View style={stylesFor(colors).screen}><AppHeader farmer={farmer} title="Choisir un moyen de paiement" subtitle="Paiement local sécurisé" onBack={onBack} /><ScrollView contentContainerStyle={stylesFor(colors).pageContent} keyboardShouldPersistTaps="handled"><Text style={stylesFor(colors).paymentIntro}>Choisissez votre moyen préféré pour vos prochaines commandes.</Text><Text style={stylesFor(colors).paymentSectionTitle}>Moyens disponibles</Text><View style={stylesFor(colors).paymentChoiceList}>{paymentChoices.map((choice) => <Pressable key={choice.kind} style={[stylesFor(colors).paymentChoice, kind === choice.kind && stylesFor(colors).paymentChoiceSelected]} onPress={() => { setKind(choice.kind); if (choice.kind === 'cash') setReference(''); }}><View style={[stylesFor(colors).paymentChoiceIcon, kind === choice.kind && stylesFor(colors).paymentChoiceIconSelected]}><Ionicons name={choice.icon} size={22} color={kind === choice.kind ? colors.primaryForeground : colors.primary} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>{choice.label}</Text><Text style={stylesFor(colors).productMeta}>{choice.description}</Text></View><Ionicons name={kind === choice.kind ? 'radio-button-on' : 'radio-button-off'} size={21} color={kind === choice.kind ? colors.primary : colors.mutedForeground} /></Pressable>)}</View><View style={stylesFor(colors).paymentForm}><Text style={stylesFor(colors).paymentSectionTitle}>Ajouter {selectedChoice.label}</Text>{kind !== 'cash' && <Field label={referenceLabel} placeholder={kind === 'visa' || kind === 'mastercard' ? '1234 5678 9012 3456' : '6 90 00 00 00'} value={reference} onChangeText={setReference} keyboardType="phone-pad" icon={kind === 'visa' || kind === 'mastercard' ? 'card-outline' : 'call-outline'} />}<Pressable style={stylesFor(colors).primaryButton} onPress={addMethod}><Ionicons name="add-circle-outline" size={19} color={colors.primaryForeground} /><Text style={stylesFor(colors).primaryButtonText}>Ajouter ce moyen</Text></Pressable></View><Text style={stylesFor(colors).paymentSectionTitle}>Moyens enregistrés</Text>{paymentMethods.length ? paymentMethods.map((method) => <Pressable key={method.id} style={[stylesFor(colors).savedPayment, method.id === selectedPaymentMethodId && stylesFor(colors).savedPaymentSelected]} onPress={() => { selectPaymentMethod(method.id); toast(`${method.label} ${translateText(language, 'est le moyen sélectionné.')}`); }}><View style={stylesFor(colors).paymentChoiceIcon}><Ionicons name={method.kind === 'cash' ? 'cash-outline' : method.kind === 'visa' || method.kind === 'mastercard' ? 'card-outline' : 'phone-portrait-outline'} size={21} color={colors.primary} /></View><View style={stylesFor(colors).flex}><Text style={stylesFor(colors).cardTitle}>{method.label}</Text><Text style={stylesFor(colors).productMeta}>{method.reference}</Text></View>{method.id === selectedPaymentMethodId ? <View style={stylesFor(colors).paymentSelectedPill}><Ionicons name="checkmark" size={14} color={colors.primaryForeground} /><Text style={stylesFor(colors).paymentSelectedText}>Méthode sélectionnée</Text></View> : <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />}</Pressable>) : <Text style={stylesFor(colors).mutedText}>Aucun moyen de paiement enregistré.</Text>}</ScrollView><BottomNav items={farmer ? farmerTabs : buyerTabs} active={farmer ? 'farmer-profile' : 'profile'} onPress={onNav} cartCount={cartCount} /></View>;
}

function EmptyState({ icon, title, body, action, onAction }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={stylesFor(colors).emptyState}><View style={stylesFor(colors).emptyIcon}><Ionicons name={icon} size={34} color={colors.primary} /></View><Text style={stylesFor(colors).h3}>{title}</Text><Text style={stylesFor(colors).body}>{body}</Text>{action && <Pressable style={stylesFor(colors).outlineButton} onPress={onAction}><Text style={stylesFor(colors).outlineButtonText}>{action}</Text><Ionicons name="arrow-forward" size={17} color={colors.primary} /></Pressable>}</View>;
}

function stylesFor(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    toastRoot: { flex: 1 },
    toast: { position: 'absolute', left: 18, right: 18, zIndex: 100, minHeight: 48, borderRadius: 15, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: colors.foreground, flexDirection: 'row', alignItems: 'center', gap: 9, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 8 },
    toastText: { flex: 1, color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17 },
    onboardingScreen: { flex: 1, backgroundColor: colors.card },
    splashIntro: { flex: 1, backgroundColor: '#2F7D32', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    splashRings: { position: 'absolute', left: '50%', top: '50%', marginLeft: -310, marginTop: -310, width: 620, height: 620, alignItems: 'center', justifyContent: 'center' },
    splashRing: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
    splashLogo: { width: 176, height: 78 },
    splashTagline: { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 14 },
    splashSubtitle: { color: 'rgba(255,255,255,0.82)', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 10 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
    pageContent: { padding: 16, paddingBottom: Platform.OS === 'web' ? 108 : 96 },
    offersBlock: { marginBottom: 3 },
    offersScroll: { gap: 10, paddingRight: 4 },
    offerCard: { width: 328, height: 190, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.primary },
    offerImage: { width: '100%', height: '100%', position: 'absolute' },
    offerOverlay: { flex: 1, justifyContent: 'space-between', padding: 15 },
    offerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    offerBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, backgroundColor: colors.orange },
    offerBadgeText: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 9 },
    offerLabel: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Inter_600SemiBold', fontSize: 11 },
    offerProductName: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 23, marginTop: 1 },
    offerMeta: { color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
    offerPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    offerPrice: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 15 },
    offerDots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 9, marginBottom: 4 },
    offerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
    offerDotActive: { width: 18, backgroundColor: colors.primary },
    paymentIntro: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 18 },
    paymentSectionTitle: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 10, marginTop: 3 },
    paymentChoiceList: { gap: 9 },
    paymentChoice: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.card, borderRadius: 17, borderWidth: 1, borderColor: colors.border },
    paymentChoiceSelected: { borderColor: colors.primary, backgroundColor: colors.softGreen },
    paymentChoiceIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softGreen },
    paymentChoiceIconSelected: { backgroundColor: colors.primary },
    paymentForm: { padding: 15, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginVertical: 20 },
    savedPayment: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginBottom: 9 },
    savedPaymentSelected: { borderColor: colors.primary, backgroundColor: colors.softGreen },
    paymentSelectedPill: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 3 },
    paymentSelectedText: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 9 },
    detailContent: { padding: 18, paddingBottom: 42 },
    formContent: { paddingBottom: 36 },
    productFormContent: { backgroundColor: colors.background, paddingHorizontal: 38, paddingBottom: 34 },
    productFormHeader: { height: 88, backgroundColor: colors.primary, marginHorizontal: -38, marginBottom: 22, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 18 },
    productBack: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    productFormTitle: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 18 },
    productFormLabel: { color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 15, marginTop: 16, marginBottom: 9 },
    productIconRow: { gap: 10, paddingVertical: 2 },
    productIconChoice: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
    productIconSelected: { borderColor: colors.primary, backgroundColor: colors.softGreen },
    productIconText: { fontSize: 25 },
    productImagePicker: { minHeight: 150, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.mutedForeground, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' },
    productImageText: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 14 },
    productImagePreview: { width: '100%', height: 180 },
    productImageHint: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.primary },
    productImageHintText: { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
    productFormInput: { height: 48, backgroundColor: colors.card, borderRadius: 16, color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 14, paddingHorizontal: 18 },
    productFormInputRow: { height: 48, backgroundColor: colors.card, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
    productFormPlaceholder: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 14, textTransform: 'capitalize' },
    productFormTwoColumns: { flexDirection: 'row', gap: 16 },
    productFormColumn: { flex: 1 },
    productFormMultiline: { minHeight: 74, height: 74, paddingTop: 14, textAlignVertical: 'top' },
    productSaveButton: { minHeight: 50, backgroundColor: colors.primary, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, marginTop: 18 },
    productSaveText: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 14 },
    onboardingTop: { paddingHorizontal: 22, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    onboardingLogo: { width: 92, height: 44 },
    skip: { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    onboardingPhotoFrame: { height: '48%', minHeight: 330, overflow: 'hidden', backgroundColor: colors.primary },
    onboardingImage: { width: '100%', height: '100%' },
    onboardingImageMark: { position: 'absolute', top: 18, left: 20, width: 58, height: 24, opacity: 0.9 },
    onboardingImageLogo: { width: '100%', height: '100%' },
    onboardingSheet: { flex: 1, backgroundColor: colors.card, borderTopLeftRadius: 34, borderTopRightRadius: 34, marginTop: -28, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 18 },
    onboardingBadge: { alignSelf: 'flex-start', borderRadius: 13, paddingHorizontal: 11, paddingVertical: 6 },
    onboardingBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
    onboardingTitle: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 31, marginTop: 14 },
    onboardingBody: { color: colors.foreground, fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular', marginTop: 12 },
    onboardingFooter: { flex: 1, justifyContent: 'flex-end' },
    onboardingActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    onboardingBack: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    onboardingNext: { flex: 1 },
    body: { color: colors.foreground, fontSize: 15, lineHeight: 23, fontFamily: 'Inter_400Regular' },
    bodySmall: { color: colors.foreground, fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular' },
    mutedText: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
    dots: { flexDirection: 'row', gap: 7, marginBottom: 18 },
    dot: { width: 22, height: 5, borderRadius: 3 },
    primaryButton: { minHeight: 52, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 18 },
    primaryButtonText: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 14 },
    secondaryButton: { minHeight: 52, borderRadius: 17, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 18, marginTop: 14 },
    secondaryButtonText: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 14 },
    roleScreen: { padding: 24, paddingTop: 36, justifyContent: 'center' },
    roleLogo: { width: 122, height: 62, alignSelf: 'center', marginBottom: 18 },
    roleSubtitle: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', marginBottom: 8 },
    roleStartButton: { minHeight: 51, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 20 },
    roleStartButtonDisabled: { backgroundColor: colors.muted },
    authChoiceScreen: { flex: 1, backgroundColor: colors.background },
    authChoiceHero: { height: '52%', backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    authChoiceReference: { position: 'absolute', top: 0, width: '100%', height: '194%' },
    authChoiceSheet: { flex: 1, backgroundColor: colors.card, borderTopLeftRadius: 31, borderTopRightRadius: 31, marginTop: -25, paddingHorizontal: 24, paddingTop: 21, paddingBottom: 14 },
    authChoiceLead: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 25, textAlign: 'center', marginBottom: 17 },
    authChoicePrimary: { minHeight: 51, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
    authChoicePrimaryText: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 14 },
    authChoiceOutline: { minHeight: 51, borderRadius: 16, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    authChoiceOutlineText: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 14 },
    authChoiceDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 17 },
    guestLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 17 },
    authPageTitle: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 27, marginBottom: 6 },
    authPageSubtitle: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginBottom: 4 },
     resetProgress: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden', marginBottom: 22 },
     resetProgressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
    authLogo: { width: 122, height: 62, alignSelf: 'center', marginBottom: 18 },
    h1: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 27, textAlign: 'center', marginBottom: 8 },
    h2: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 29 },
    h3: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 17 },
    roleCard: { flexDirection: 'row', borderWidth: 1.5, borderColor: colors.border, borderRadius: 19, padding: 14, marginTop: 15, backgroundColor: colors.card },
    roleIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    roleContent: { flex: 1 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 15 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primaryForeground },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
    detailText: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, flex: 1 },
    footNote: { textAlign: 'center', color: colors.mutedForeground, fontSize: 11, marginTop: 18, fontFamily: 'Inter_400Regular' },
    authScroll: { padding: 24, paddingTop: 18, paddingBottom: 35, flexGrow: 1 },
    backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    field: { marginTop: 16 },
    fieldLabel: { color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12, marginBottom: 7 },
    inputWrap: { height: 50, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
    input: { flex: 1, color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 14 },
     phoneRow: { flexDirection: 'row', gap: 8 },
     countryPicker: { height: 50, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 5 },
     countryFlag: { fontSize: 17 },
     countryCode: { color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
     phoneInputWrap: { flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
     surfaceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
     surfaceInput: { flex: 1 },
     surfacePickerWrap: { width: 92, marginTop: 16 },
     surfacePicker: { height: 50, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
     surfacePickerText: { color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
     surfaceOptions: { position: 'absolute', top: 76, left: 0, right: 0, zIndex: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 5, overflow: 'hidden' },
     surfaceOption: { minHeight: 40, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
     surfaceOptionActive: { backgroundColor: colors.softGreen },
     surfaceOptionText: { color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 13 },
     surfaceOptionTextActive: { color: colors.primary, fontFamily: 'Inter_700Bold' },
     fieldHint: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 6 },
     locationActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
     locationButton: { flex: 1, minHeight: 43, borderWidth: 1, borderColor: colors.primary, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, gap: 5 },
     locationButtonText: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11, textAlign: 'center' },
     mapButton: { flex: 1, minHeight: 43, borderRadius: 13, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, gap: 5 },
     mapButtonText: { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11, textAlign: 'center' },
    errorText: { color: colors.destructive, fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 10 },
    linkText: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 13, textAlign: 'center', marginTop: 17 },
    orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 22 },
    divider: { flex: 1, height: 1, backgroundColor: colors.border },
    socialRow: { flexDirection: 'row', gap: 8 },
    socialButton: { flex: 1, minHeight: 43, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 5 },
    switchAuth: { color: colors.mutedForeground, textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 28 },
    header: { backgroundColor: colors.background, paddingHorizontal: 16, paddingBottom: 12 },
    headerBrand: { minHeight: 34, justifyContent: 'center' },
    headerLogo: { width: 67, height: 30 },
    marketBadge: { borderRadius: 10, backgroundColor: colors.softGreen, paddingHorizontal: 8, paddingVertical: 5 },
    marketBadgeText: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 9 },
    headerTitle: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 24, marginTop: 11 },
    headerSubtitle: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 3 },
    headerLocation: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
    headerLocationText: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
    headerFarmer: { backgroundColor: colors.primary },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerCircle: { width: 38, height: 38, backgroundColor: colors.background, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    searchBar: { height: 50, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9, marginBottom: 18 },
    searchInput: { flex: 1, color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 13 },
    heroCard: { minHeight: 152, borderRadius: 23, padding: 19, overflow: 'hidden', marginBottom: 22, justifyContent: 'center' },
    heroCopy: { maxWidth: '75%' },
    heroKicker: { color: colors.primaryForeground, opacity: 0.8, fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
    heroTitle: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 24, marginTop: 7 },
    heroBody: { color: colors.primaryForeground, opacity: 0.78, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 9 },
    heroIcon: { position: 'absolute', right: 8, bottom: -11, transform: [{ rotate: '-18deg' }] },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 2 },
    sectionTitle: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 17 },
    sectionAction: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
    horizontalList: { gap: 12, paddingBottom: 18 },
    categoryItem: { alignItems: 'center', width: 64 },
    categoryIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
    categoryScroll: { gap: 14, paddingBottom: 22 },
     categoryImage: { width: 58, height: 58, borderRadius: 15, backgroundColor: colors.muted, marginBottom: 7, borderWidth: 2, borderColor: 'transparent' },
     categoryImageActive: { borderColor: colors.primary },
    categoryLabel: { color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 11, textAlign: 'center' },
    productCard: { width: '48%', borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 13 },
    productCardCompact: { width: 190, marginBottom: 0 },
    productImage: { width: '100%', height: 158, backgroundColor: colors.muted },
    productInfo: { padding: 10 },
    productName: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 14 },
    productMeta: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
    price: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12, marginTop: 8 },
    unit: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10 },
    addCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    addCircleSmall: { width: 27, height: 27, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    recommendList: { gap: 9 },
    recommendCard: { minHeight: 72, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 9 },
    recommendImage: { width: 55, height: 55, borderRadius: 12, backgroundColor: colors.muted },
    recommendCopy: { flex: 1 },
    recommendEnd: { alignItems: 'flex-end', gap: 8 },
    miniPrice: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 11 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    rating: { color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 10 },
    chipRow: { gap: 8, paddingBottom: 16 },
    chip: { borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 15, paddingVertical: 9 },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    chipText: { color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 },
    chipTextActive: { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' },
     seeAllRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
    gridGap: { justifyContent: 'space-between' },
    cartHeader: { position: 'relative', padding: 5 },
    countBadge: { position: 'absolute', right: -1, top: -2, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
    countText: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 9 },
    detailImage: { width: '100%', height: 258, borderRadius: 25, backgroundColor: colors.muted },
    detailTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 12 },
    flex: { flex: 1 },
    ratingPill: { backgroundColor: colors.softGold, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
    detailPrice: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 12 },
    detailUnit: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13 },
    stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    stockDot: { width: 8, height: 8, borderRadius: 4 },
    stockText: { color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 },
    dividerLine: { height: 1, backgroundColor: colors.border, marginVertical: 17 },
    subheading: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 8 },
    farmerCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: colors.softGreen, marginTop: 17 },
    avatar: { width: 39, height: 39, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 12 },
    quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 21, marginBottom: 13 },
    quantitySelector: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' },
    quantityButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
    quantityValue: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 14, minWidth: 27, textAlign: 'center' },
    cartTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dangerLink: { color: colors.destructive, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    cartItem: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
    cartImage: { width: 66, height: 66, borderRadius: 14, backgroundColor: colors.muted },
    cartEnd: { alignItems: 'flex-end', gap: 20 },
    summaryCard: { backgroundColor: colors.card, borderRadius: 18, padding: 16, marginTop: 22, gap: 12, borderWidth: 1, borderColor: colors.border },
    totalText: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 18 },
    hintText: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10 },
    orderCard: { borderRadius: 19, backgroundColor: colors.card, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
     orderActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
     orderActionButton: { minHeight: 30, borderRadius: 10, backgroundColor: colors.softGreen, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
     cancelText: { color: colors.destructive, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
    statusPill: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.softGold },
    statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
    orderProduct: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
    orderImage: { width: 53, height: 53, borderRadius: 12, backgroundColor: colors.muted },
     orderImageLarge: { width: 68, height: 68, borderRadius: 15, backgroundColor: colors.muted },
    progressTrack: { height: 5, backgroundColor: colors.border, borderRadius: 3, marginTop: 16, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
     orderDetailContent: { padding: 16, paddingBottom: 38 },
     orderStatusBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
     orderStatusTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 4 },
     orderContactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
     orderDetailLine: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
     orderDeliveryCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.softGreen, borderRadius: 17, padding: 14, marginTop: 18 },
     orderDeliveryIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
     dangerOutlineButton: { minHeight: 49, borderRadius: 15, borderWidth: 1, borderColor: colors.destructive, backgroundColor: `${colors.destructive}08`, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 14, paddingHorizontal: 16 },
     orderDecisionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
     orderDecisionAccept: { flex: 1, marginTop: 0 },
    detailOrderHero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.softGreen, borderRadius: 18, padding: 16, marginBottom: 14 },
     customerCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.card, borderRadius: 17, padding: 13, borderWidth: 1, borderColor: colors.border, marginBottom: 18 },
     messageOrderButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center' },
     dangerButton: { minHeight: 48, borderRadius: 15, backgroundColor: `${colors.destructive}18`, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 12 },
     dangerButtonText: { color: colors.destructive, fontFamily: 'Inter_700Bold', fontSize: 13 },
    profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    profileEditButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.softGreen },
    profileEditLabel: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
    settingsEditorTitle: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 2, marginTop: 2 },
    languageSheet: { marginTop: -4, marginBottom: 10, marginHorizontal: 8, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    languageOption: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
    languageOptionActive: { backgroundColor: colors.softGreen },
    languageOptionText: { color: colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 13 },
    languageOptionTextActive: { color: colors.primary, fontFamily: 'Inter_700Bold' },
    largeAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarPressable: { position: 'relative' },
    avatarPhoto: { width: '100%', height: '100%' },
    avatarCamera: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.card },
    photoActionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
    textButton: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 10 },
    interestGrid: { gap: 10 },
    interestCard: { minHeight: 70, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 12 },
    interestCardSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
    interestLabel: { flex: 1, color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    interestLabelSelected: { color: colors.primaryForeground },
     interestOnboardingHeader: { minHeight: 68, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
     interestOnboardingLogo: { width: 82, height: 42 },
     interestStep: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 13 },
     interestOnboardingContent: { padding: 18, paddingBottom: 40 },
     interestOnboardingIntro: { alignItems: 'center', marginBottom: 22 },
     interestOnboardingIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
     interestOnboardingLabel: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 10 },
     interestOnboardingGrid: { gap: 10 },
     interestOnboardingChoice: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 9, backgroundColor: colors.card },
     interestOnboardingChoiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
     interestOnboardingImage: { width: 56, height: 56, borderRadius: 13, backgroundColor: colors.muted },
     interestOnboardingExample: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
     interestOtherIcon: { width: 56, height: 56, borderRadius: 13, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center' },
     interestOtherInput: { minHeight: 50, borderWidth: 1, borderColor: colors.primary, borderRadius: 14, paddingHorizontal: 14, color: colors.foreground, backgroundColor: colors.card, fontFamily: 'Inter_400Regular', marginTop: 10 },
    securityHero: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.softGreen, borderRadius: 18, padding: 16, marginBottom: 12 },
    securityIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    securityCard: { gap: 11, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
    largeAvatarText: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 15 },
    profileStats: { flexDirection: 'row', flexWrap: 'nowrap', gap: 7, marginVertical: 12 },
    statCard: { flex: 1, flexBasis: 0, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 9, minHeight: 88, position: 'relative' },
    dashboardStatCard: { flexBasis: '47%', flexGrow: 0, minHeight: 112, padding: 12 },
    statArrow: { position: 'absolute', right: 12, top: 12, opacity: 0.75 },
    statIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
    statValue: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 18 },
    statLabel: { color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 13, marginTop: 2 },
    menuItem: { minHeight: 65, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
    menuIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center' },
    toggle: { width: 41, height: 25, borderRadius: 13, backgroundColor: colors.primary, justifyContent: 'center', padding: 3 },
    toggleOff: { backgroundColor: colors.muted },
    toggleKnob: { width: 19, height: 19, borderRadius: 10, backgroundColor: colors.primaryForeground, alignSelf: 'flex-end' },
    toggleKnobOff: { alignSelf: 'flex-start', backgroundColor: colors.card },
    logoutButton: { minHeight: 55, borderRadius: 15, backgroundColor: `${colors.destructive}12`, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 18 },
    editCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 13, marginTop: 12 },
    smallButton: { backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 40, marginTop: 12 },
    smallButtonText: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 12 },
    protectedState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 12 },
    protectedIcon: { width: 78, height: 78, borderRadius: 28, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center' },
    bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: Platform.OS === 'web' ? 84 : 76, paddingBottom: Platform.OS === 'web' ? 34 : 10, paddingTop: 9, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', justifyContent: 'space-around' },
    navItem: { alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 54 },
    navLabel: { color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 10 },
    navBadge: { position: 'absolute', top: -4, right: -8, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 14 },
    quickRow: { flexDirection: 'row', flexWrap: 'nowrap', gap: 7, marginBottom: 14 },
    quickAction: { flex: 1, flexBasis: 0, minHeight: 86, borderRadius: 15, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
    quickIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    quickLabel: { color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 10, textAlign: 'center', lineHeight: 12 },
    recentOrders: { gap: 9, marginBottom: 17 },
    recentOrder: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
    alignEnd: { alignItems: 'flex-end' },
    notificationCard: { minHeight: 76, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
    notificationIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    performanceCard: { backgroundColor: colors.primary, borderRadius: 20, padding: 16, marginTop: 12, marginBottom: 10 },
    performanceKicker: { color: colors.primaryForeground, opacity: 0.8, fontFamily: 'Inter_400Regular', fontSize: 11 },
    performanceTitle: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 17, marginTop: 3 },
    statsPill: { borderRadius: 12, backgroundColor: colors.primaryForeground, paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
    statsPillText: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 10 },
    performanceRow: { flexDirection: 'row', gap: 8, marginTop: 15 },
    performanceStat: { flex: 1, minHeight: 57, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', padding: 9, justifyContent: 'center' },
    performanceValue: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 14 },
    performanceLabel: { color: colors.primaryForeground, opacity: 0.75, fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 3 },
    farmerProductCard: { flexDirection: 'row', gap: 11, padding: 11, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginBottom: 11 },
    farmerProductImage: { width: 78, height: 82, borderRadius: 13, backgroundColor: colors.muted },
    stockPill: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 5 },
    farmerActions: { justifyContent: 'space-between', paddingVertical: 3 },
    floatingButton: { position: 'absolute', right: 20, bottom: Platform.OS === 'web' ? 103 : 89, width: 57, height: 57, borderRadius: 29, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5 },
    formRow: { flexDirection: 'row', gap: 10 },
    half: { flex: 1 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 18 },
    uploadCard: { borderRadius: 17, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 7, marginBottom: 18 },
    farmerOrderCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, marginBottom: 12 },
    farmerOrdersContent: { padding: 28, paddingBottom: Platform.OS === 'web' ? 118 : 104 },
    farmerFilterRow: { gap: 10, paddingBottom: 21 },
    farmerFilter: { minHeight: 39, borderRadius: 20, backgroundColor: colors.card, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    farmerFilterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    farmerFilterText: { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
    farmerFilterTextActive: { color: colors.primaryForeground },
    farmerFilterCount: { fontFamily: 'Inter_700Bold' },
    ordersSeeAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginBottom: 36 },
    ordersSeeAllText: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 13 },
    farmerOrderReferenceCard: { backgroundColor: colors.card, borderRadius: 17, paddingHorizontal: 18, paddingVertical: 15, marginBottom: 12 },
    orderReferenceHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    orderReferenceId: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 13 },
    orderReferenceDate: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10 },
    orderReferenceBody: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 13 },
    orderReferenceAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    orderReferenceTotal: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12, marginBottom: 5 },
    outlineButton: { minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 13, marginTop: 13 },
    outlineButtonText: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 12 },
    salesHero: { backgroundColor: colors.primary, borderRadius: 21, padding: 20, marginBottom: 22 },
    salesValue: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 29, marginTop: 6 },
    growth: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
    growthText: { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
    chartCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 19, padding: 16, marginBottom: 20 },
    chartBars: { height: 115, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
    barColumn: { alignItems: 'center', justifyContent: 'flex-end', gap: 7, height: '100%' },
    bar: { width: 20, borderRadius: 9 },
    barLabel: { color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 10 },
    salesRow: { minHeight: 69, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 },
    rank: { color: colors.mutedForeground, fontFamily: 'Inter_700Bold', fontSize: 13, width: 16 },
    salesImage: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.muted },
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 11 },
    emptyIcon: { width: 84, height: 84, borderRadius: 30, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
    marketCard: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 15, marginTop: 2, marginBottom: 18 },
    marketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
    marketKicker: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.8 },
    marketTitle: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 4 },
    marketRows: { gap: 2 },
    marketRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.border },
    marketProductIcon: { width: 33, height: 33, borderRadius: 11, backgroundColor: colors.softGreen, alignItems: 'center', justifyContent: 'center' },
    marketTrend: { fontFamily: 'Inter_600SemiBold', fontSize: 10, marginTop: 3 },
     messageSearch: { marginHorizontal: 16, marginTop: 4, marginBottom: 5 },
     messageList: { padding: 16, paddingBottom: 92 },
     conversationCard: { minHeight: 79, backgroundColor: colors.card, borderRadius: 17, borderWidth: 1, borderColor: colors.border, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10 },
     messageTopBar: { minHeight: 90, paddingHorizontal: 38, paddingTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
     messageLogo: { width: 80, height: 35 },
     messageReferenceSearch: { height: 56, borderRadius: 18, backgroundColor: colors.card, marginHorizontal: 20, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border },
     messageReferenceList: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
     messageReferenceRow: { minHeight: 106, flexDirection: 'row', alignItems: 'center', gap: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
     messageReferenceName: { color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 },
     messageReferenceTime: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11 },
     messageReferenceRole: { color: colors.primary, fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 5 },
     messageReferencePreview: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 5 },
     messageOnlineDot: { position: 'absolute', right: 1, bottom: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.background },
     messageAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
     unreadBadge: { position: 'absolute', right: -2, top: -3, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
     unreadText: { color: colors.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 9 },
     chatHeader: { minHeight: 78, paddingHorizontal: 14, paddingTop: 9, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
      chatBack: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
     chatAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
     onlineDot: { position: 'absolute', right: 1, bottom: 2, width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.card },
     onlineText: { color: colors.primary, fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 3 },
     chatCall: { width: 39, height: 39, borderRadius: 20, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
    messageContext: { color: colors.primary, fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 4 },
    chatContent: { padding: 18, paddingBottom: 22, gap: 10, flexGrow: 1 },
    messageBubble: { alignSelf: 'flex-start', maxWidth: '82%', backgroundColor: colors.card, borderRadius: 16, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: colors.border, padding: 11 },
    messageBubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.softGreen, borderColor: colors.softGreen, borderBottomLeftRadius: 16, borderBottomRightRadius: 5 },
    messageText: { color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
    messageTime: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 5, textAlign: 'right' },
     composer: { minHeight: 67, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
     composerIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.muted },
     composerField: { flex: 1, minHeight: 43, borderRadius: 15, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingRight: 10 },
     composerInput: { flex: 1, minHeight: 41, color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 13, paddingHorizontal: 13 },
    sendButton: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  });
}
