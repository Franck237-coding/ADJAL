import { Language } from './app-context';

type Dictionary = Record<string, string>;

const english: Dictionary = {
  'Accueil': 'Home', 'Catégories': 'Categories', 'Commandes': 'Orders', 'Messages': 'Messages', 'Profil': 'Profile',
  'Marché agricole': 'Agricultural marketplace', 'Votre marché agricole local': 'Your local agricultural marketplace',
  'Bonjour, Cendra 👋': 'Hello, Cendra 👋', 'Offre du jour': 'Today’s offer', 'OFFRE DU JOUR': 'TODAY’S OFFER',
  'Voir tout': 'See all', 'Produits vedettes': 'Featured products', 'Recommandés': 'Recommended',
  'Prix du marché': 'Market prices', 'TENDANCE DES PRIX': 'PRICE TREND', 'Les produits du moment': 'Today’s products',
  'Prix moyen au marché': 'Average market price', 'Rechercher un produit ou un agriculteur': 'Search a product or farmer',
  'Aucun produit trouvé': 'No product found', 'Essayez une autre recherche ou une autre catégorie.': 'Try another search or category.',
  'Mon profil': 'My profile', 'Votre espace personnel': 'Your personal space', 'Votre espace agriculteur': 'Your farmer space',
  'Acheteur': 'Buyer', 'Agriculteur': 'Farmer', 'Modifier': 'Edit', 'Fermer': 'Close',
  'Informations personnelles': 'Personal information', 'Nom complet': 'Full name', 'Adresse email': 'Email address',
  'Ville et pays': 'City and country', 'Adresse': 'Address', 'Mon exploitation': 'My farm',
  'Cultures principales': 'Main crops', 'Superficie': 'Land area', 'Enregistrer les modifications': 'Save changes',
  'Moyen de paiement': 'Payment method', 'Notifications': 'Notifications', 'Activées': 'Enabled', 'Désactivées': 'Disabled',
  'Apparence': 'Appearance', 'Mode nuit': 'Dark mode', 'Mode jour': 'Light mode', 'Langue': 'Language',
  'Sécurité': 'Security', 'Mot de passe et accès': 'Password and access', 'Centre d’aide': 'Help center',
  'FAQ et assistance': 'FAQ and support', 'Se déconnecter': 'Sign out', 'Retour': 'Back',
  'Choisir un moyen de paiement': 'Choose a payment method', 'Moyens enregistrés': 'Saved methods',
  'Ajouter un moyen': 'Add a method', 'Ajouter ce moyen': 'Add this method', 'Numéro associé': 'Linked number',
  'Titulaire du compte': 'Account holder', 'Numéro de téléphone': 'Phone number', 'Numéro de carte': 'Card number',
  'Orange Money': 'Orange Money', 'MTN MoMo': 'MTN MoMo', 'Carte Visa': 'Visa card', 'Carte Mastercard': 'Mastercard',
  'Paiement local sécurisé': 'Secure local payment', 'Choisissez votre moyen préféré pour vos prochaines commandes.': 'Choose your preferred method for your next orders.',
  'Moyens disponibles': 'Available methods', 'Paiement mobile Orange': 'Orange mobile payment', 'Mobile Money MTN': 'MTN Mobile Money',
  'Carte bancaire Visa': 'Visa bank card', 'Carte bancaire Mastercard': 'Mastercard bank card', 'Paiement à la livraison': 'Pay on delivery',
  'Réglez à la réception': 'Pay when you receive your order', 'Instructions de livraison': 'Delivery instructions',
  'À régler à la réception': 'Pay on delivery', 'Saisissez un numéro de paiement ou de carte valide.': 'Enter a valid payment or card number.',
  'est prêt pour vos prochaines commandes.': 'is ready for your next orders.', 'est le moyen sélectionné.': 'is now the selected method.',
  'Méthode sélectionnée': 'Selected method', 'Disponible pour vos prochaines commandes': 'Available for your next orders',
  'Aucun moyen de paiement enregistré.': 'No saved payment method.', 'Ajouter au panier': 'Add to cart',
  'Détail du produit': 'Product details', 'Mon panier': 'My cart', 'Mes commandes': 'My orders',
  'Rechercher un produit ou une catégorie': 'Search a product or category', 'Aucune conversation trouvée': 'No conversation found',
  'Écrire un message...': 'Write a message...', 'Service client': 'Customer support', 'en ligne': 'online',
  'Aujourd’hui': 'Today', 'En attente': 'Pending', 'Confirmée': 'Confirmed', 'Préparée': 'Prepared',
  'Terminée': 'Completed', 'Annulée': 'Cancelled', 'Continuer': 'Continue', 'Annuler': 'Cancel',
  'Créer un compte': 'Create an account', 'Se connecter': 'Sign in', 'Mot de passe oublié ?': 'Forgot password?',
  'Bon retour': 'Welcome back', 'Votre commande': 'Your order', 'Commander': 'Place order',
  'Se déconnecter ?': 'Sign out?', 'Voulez-vous vraiment fermer votre session sur cet appareil ?': 'Do you really want to sign out on this device?',
  'Rester connecté': 'Stay signed in', 'Votre nom': 'Your name', 'Téléphone': 'Phone', 'Localisation': 'Location',
  'Adresse de livraison': 'Delivery address', 'Votre adresse complète': 'Your full address', 'Moyen incomplet': 'Incomplete method',
};

const dictionaries: Partial<Record<Language, Dictionary>> = { en: english };

export function translateText(language: Language, text: string): string {
  if (language === 'fr') return text;
  return dictionaries[language]?.[text] ?? english[text] ?? text;
}