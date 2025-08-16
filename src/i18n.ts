import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      marketplace: "Marketplace",
      academy: "Academy", 
      pricing: "Pricing",
      agentWallet: "Agent Wallet",
      
      // Marketplace
      marketplaceTitle: "Marketplace.",
      marketplaceDescription: "Finally, we silenced the noise. Welcome to the Marketplace. Explore premium services you already use — now at a fraction of the cost. Everything is curated, easy to compare, and backed by verified agents like you. Stop guessing. Start growing. Buy outcomes, not tools.",
      services: "Services",
      vendors: "Vendors",
      searchPlaceholder: "Search services, vendors, or categories...",
      allCategories: "All Categories",
      selectCategory: "Select Category",
      
      // Filters
      priceRange: "Price Range",
      circleVerifiedOnly: "Circle Verified Only",
      featuredOnly: "Featured Only",
      coPayEligible: "Co-Pay Eligible",
      clearAll: "Clear all",
      
      // Service Card
      featured: "Featured",
      topPick: "Top Pick",
      verified: "Verified",
      listPrice: "List Price",
      circleProPrice: "Circle Pro Price",
      yourCoPay: "Your Co-Pay",
      addToCart: "Add to Cart",
      estROI: "Est. ROI",
      
      // Common
      loading: "Loading",
      noResultsFound: "No {{type}} found",
      tryAdjustingFilters: "Try adjusting your search terms or filters",
      signIn: "Sign In",
      signUp: "Sign Up",
      
      // Currency
      currency: "USD",
      
      // First Visit Intro
      intro: {
        newBadge: "New",
        headline: "Welcome to Circle — Where Top Agents Thrive",
        subheadline: "Join thousands of agents saving money and growing their business with our curated marketplace.",
        benefit1Title: "Massive Savings",
        benefit1Desc: "Save 40-80% on tools you already use",
        benefit2Title: "AI-Powered Growth",
        benefit2Desc: "Get personalized recommendations to boost your ROI",
        benefit3Title: "Agent-Verified",
        benefit3Desc: "Every service is tested by successful agents like you",
        learnMore: "Explore First",
        getStarted: "Get Started Free"
      }
    }
  },
  es: {
    translation: {
      // Navigation
      marketplace: "Mercado",
      academy: "Academia",
      pricing: "Precios", 
      agentWallet: "Cartera del Agente",
      
      // Marketplace
      marketplaceTitle: "Mercado.",
      marketplaceDescription: "Finalmente, silenciamos el ruido. Bienvenido al Mercado. Descubre servicios de marketing premium y conecta con vendedores de alto rendimiento que realmente harán avanzar tu negocio.",
      services: "Servicios",
      vendors: "Vendedores",
      searchPlaceholder: "Buscar servicios, vendedores o categorías...",
      allCategories: "Todas las Categorías",
      selectCategory: "Seleccionar Categoría",
      
      // Filters
      priceRange: "Rango de Precio",
      circleVerifiedOnly: "Solo Verificados por Circle",
      featuredOnly: "Solo Destacados",
      coPayEligible: "Elegible para Co-Pago",
      clearAll: "Limpiar todo",
      
      // Service Card
      featured: "Destacado",
      topPick: "Mejor Opción",
      verified: "Verificado",
      listPrice: "Precio de Lista",
      circleProPrice: "Precio Circle Pro",
      yourCoPay: "Tu Co-Pago",
      addToCart: "Agregar al Carrito",
      estROI: "ROI Est.",
      
      // Common
      loading: "Cargando",
      noResultsFound: "No se encontraron {{type}}",
      tryAdjustingFilters: "Intenta ajustar tus términos de búsqueda o filtros",
      signIn: "Iniciar Sesión",
      signUp: "Registrarse",
      
      // Currency
      currency: "USD"
    }
  },
  fr: {
    translation: {
      // Navigation
      marketplace: "Marché",
      academy: "Académie",
      pricing: "Tarification",
      agentWallet: "Portefeuille Agent",
      
      // Marketplace
      marketplaceTitle: "Marché.",
      marketplaceDescription: "Enfin, nous avons fait taire le bruit. Bienvenue sur le Marché. Découvrez des services de marketing premium et connectez-vous avec des fournisseurs performants qui feront vraiment avancer votre entreprise.",
      services: "Services",
      vendors: "Fournisseurs",
      searchPlaceholder: "Rechercher des services, fournisseurs ou catégories...",
      allCategories: "Toutes les Catégories",
      selectCategory: "Sélectionner une Catégorie",
      
      // Filters
      priceRange: "Gamme de Prix",
      circleVerifiedOnly: "Seulement Vérifiés Circle",
      featuredOnly: "Seulement Mis en Vedette",
      coPayEligible: "Éligible Co-Paiement",
      clearAll: "Tout effacer",
      
      // Service Card
      featured: "En Vedette",
      topPick: "Meilleur Choix",
      verified: "Vérifié",
      listPrice: "Prix de Liste",
      circleProPrice: "Prix Circle Pro",
      yourCoPay: "Votre Co-Paiement",
      addToCart: "Ajouter au Panier",
      estROI: "ROI Est.",
      
      // Common
      loading: "Chargement",
      noResultsFound: "Aucun {{type}} trouvé",
      tryAdjustingFilters: "Essayez d'ajuster vos termes de recherche ou filtres",
      signIn: "Se Connecter",
      signUp: "S'inscrire",
      
      // Currency
      currency: "CAD"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;