import { useEffect, useState } from "react";

export type AdminLanguage = "fr" | "en";

const STORAGE_KEY = "adjal_admin_language";
const translations: Record<string, { fr: string; en: string }> = {
  Overview: { fr: "Vue d’ensemble", en: "Overview" },
  Users: { fr: "Utilisateurs", en: "Users" },
  Products: { fr: "Produits", en: "Products" },
  Categories: { fr: "Catégories", en: "Categories" },
  Settings: { fr: "Paramètres", en: "Settings" },
  "Sign Out": { fr: "Se déconnecter", en: "Sign Out" },
  "A DJAL Admin": { fr: "Administration A DJAL", en: "A DJAL Admin" },
  "Marketplace Overview": { fr: "Vue d’ensemble du marché", en: "Marketplace Overview" },
  "Product Moderation": { fr: "Modération des produits", en: "Product Moderation" },
  "Category Management": { fr: "Gestion des catégories", en: "Category Management" },
  "Administrator settings": { fr: "Paramètres administrateur", en: "Administrator settings" },
  "Personal information": { fr: "Informations personnelles", en: "Personal information" },
  "Save changes": { fr: "Enregistrer les modifications", en: "Save changes" },
  "Language": { fr: "Langue", en: "Language" },
  "French": { fr: "Français", en: "French" },
  "English": { fr: "Anglais", en: "English" },
  "Active": { fr: "Active", en: "Active" },
  "Inactive": { fr: "Inactive", en: "Inactive" },
  "Activate": { fr: "Activer", en: "Activate" },
  "Deactivate": { fr: "Désactiver", en: "Deactivate" },
  "Delete": { fr: "Supprimer", en: "Delete" },
  "Create category": { fr: "Créer une catégorie", en: "Create category" },
  "Category name": { fr: "Nom de la catégorie", en: "Category name" },
  "Slug": { fr: "Identifiant", en: "Slug" },
  "Add category": { fr: "Ajouter la catégorie", en: "Add category" },
  "Name": { fr: "Nom", en: "Name" },
  "Phone": { fr: "Téléphone", en: "Phone" },
  "City": { fr: "Ville", en: "City" },
  "Email": { fr: "Email", en: "Email" },
  "Secure Marketplace Administration": { fr: "Administration sécurisée de la marketplace", en: "Secure Marketplace Administration" },
  "Sign In": { fr: "Se connecter", en: "Sign In" },
  "Enter your credentials to access the back-office": { fr: "Saisissez vos identifiants pour accéder au back-office", en: "Enter your credentials to access the back-office" },
  "Authenticating...": { fr: "Authentification...", en: "Authenticating..." },
  "Access Denied": { fr: "Accès refusé", en: "Access Denied" },
  "You do not have administrative privileges.": { fr: "Vous ne disposez pas des droits administrateur.", en: "You do not have administrative privileges." },
  "Welcome back": { fr: "Bon retour", en: "Welcome back" },
  "Successfully authenticated to A DJAL Admin.": { fr: "Connexion réussie à l’administration A DJAL.", en: "Successfully authenticated to A DJAL Admin." },
  "Authentication Failed": { fr: "Échec de l’authentification", en: "Authentication Failed" },
  "Please check your credentials and try again.": { fr: "Vérifiez vos identifiants et réessayez.", en: "Please check your credentials and try again." },
  "Total Users": { fr: "Utilisateurs", en: "Total Users" },
  "Active Products": { fr: "Produits actifs", en: "Active Products" },
  "Pending Moderation": { fr: "En attente de modération", en: "Pending Moderation" },
  "Transactions": { fr: "Transactions", en: "Transactions" },
  "Monitor the health and activity of the A DJAL agricultural marketplace.": { fr: "Suivez la santé et l’activité de la marketplace agricole A DJAL.", en: "Monitor the health and activity of the A DJAL agricultural marketplace." },
  "Quick Actions": { fr: "Actions rapides", en: "Quick Actions" },
  "Failed to load summary": { fr: "Impossible de charger le résumé", en: "Failed to load summary" },
  "There was an error communicating with the server. Please try again later.": { fr: "Une erreur est survenue lors de la communication avec le serveur. Réessayez plus tard.", en: "There was an error communicating with the server. Please try again later." },
  "Failed to load users": { fr: "Impossible de charger les utilisateurs", en: "Failed to load users" },
  "Failed to load products": { fr: "Impossible de charger les produits", en: "Failed to load products" },
  "Review Pending": { fr: "Examiner les annonces", en: "Review Pending" },
  "Manage Users": { fr: "Gérer les utilisateurs", en: "Manage Users" },
  "System Status": { fr: "État du système", en: "System Status" },
  "User Management": { fr: "Gestion des utilisateurs", en: "User Management" },
  "View and manage buyer and farmer accounts across the marketplace.": { fr: "Consultez et gérez les comptes acheteurs et agriculteurs.", en: "View and manage buyer and farmer accounts across the marketplace." },
  "Content Moderation": { fr: "Modération du contenu", en: "Content Moderation" },
  "Product Listings": { fr: "Annonces produits", en: "Product Listings" },
  "Category created": { fr: "Catégorie créée", en: "Category created" },
  "Unable to create category": { fr: "Impossible de créer la catégorie", en: "Unable to create category" },
  "Unable to update category": { fr: "Impossible de modifier la catégorie", en: "Unable to update category" },
  "Unable to delete category": { fr: "Impossible de supprimer la catégorie", en: "Unable to delete category" },
  "Add image": { fr: "Ajouter une image", en: "Add image" },
  "Change image": { fr: "Changer l’image", en: "Change image" },
  "Category image": { fr: "Image de la catégorie", en: "Category image" },
  "Category image updated": { fr: "Image de la catégorie mise à jour", en: "Category image updated" },
  "The image is shown to buyers in the mobile app.": { fr: "L’image est affichée aux acheteurs dans l’application mobile.", en: "The image is shown to buyers in the mobile app." },
  "Unable to load categories": { fr: "Impossible de charger les catégories", en: "Unable to load categories" },
  "Administrators control the categories available to farmers and buyers.": { fr: "Les administrateurs contrôlent les catégories proposées aux agriculteurs et aux acheteurs.", en: "Administrators control the categories available to farmers and buyers." },
  "Use a stable lowercase slug for product listings.": { fr: "Utilisez un identifiant stable en minuscules pour les annonces.", en: "Use a stable lowercase slug for product listings." },
  "No categories yet": { fr: "Aucune catégorie pour le moment", en: "No categories yet" },
  "Update your personal details and dashboard language.": { fr: "Modifiez vos informations personnelles et la langue du tableau de bord.", en: "Update your personal details and dashboard language." },
  "These details are used for your administrator account.": { fr: "Ces informations sont utilisées pour votre compte administrateur.", en: "These details are used for your administrator account." },
  "This preference is saved in this browser.": { fr: "Cette préférence est enregistrée dans ce navigateur.", en: "This preference is saved in this browser." },
  "Saving...": { fr: "Enregistrement...", en: "Saving..." },
  "Profile updated": { fr: "Profil mis à jour", en: "Profile updated" },
  "Unable to update profile": { fr: "Impossible de mettre à jour le profil", en: "Unable to update profile" },
  "Logged out successfully": { fr: "Déconnexion réussie", en: "Logged out successfully" },
};

function readLanguage(): AdminLanguage {
  if (typeof window === "undefined") return "fr";
  return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "fr";
}

export function useAdminLanguage() {
  const [language, setLanguageState] = useState<AdminLanguage>(readLanguage);

  useEffect(() => {
    const onLanguageChange = () => setLanguageState(readLanguage());
    window.addEventListener("adjal-admin-language-change", onLanguageChange);
    return () => window.removeEventListener("adjal-admin-language-change", onLanguageChange);
  }, []);

  const setLanguage = (next: AdminLanguage) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setLanguageState(next);
    window.dispatchEvent(new Event("adjal-admin-language-change"));
  };

  const t = (key: string) => translations[key]?.[language] ?? key;
  return { language, setLanguage, t };
}