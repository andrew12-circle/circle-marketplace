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
      
      // Hero Section
      heroTitle: "The Marketplace",
      heroSubtitle: "Agents Actually Asked For",
      heroDescription: "Finally, a vetted, agent-approved marketplace with negotiated pricing and proven vendors. Every tool you need—faster, cheaper, without the awkward sales calls.",
      saveUpTo: "Save up to 80% on top tools",
      preVettedVendors: "Pre-vetted vendors",
      vendorsCoPayUpTo: "Vendors co-pay up to 50%",
      exploreMarketplace: "Explore Marketplace →",
      seeVendorCoPay: "See Vendor Co-Pay →",
      trustedByAgents: "Trusted by 500+ agents and counting",
      
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
      
      // Common UI
      loading: "Loading",
      noResultsFound: "No {{type}} found",
      tryAdjustingFilters: "Try adjusting your search terms or filters",
      signIn: "Sign In",
      signUp: "Sign Up",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      close: "Close",
      
      // Currency
      currency: "USD",
      
      // First Visit Intro
      intro: {
        newBadge: "New",
        headline: "Welcome to Circle Network - Where Top Agents Thrive",
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
      
      // Hero Section
      heroTitle: "El Mercado",
      heroSubtitle: "Que los Agentes Realmente Pidieron",
      heroDescription: "Finalmente, un mercado verificado y aprobado por agentes con precios negociados y vendedores probados. Todas las herramientas que necesitas—más rápido, más barato, sin llamadas de ventas incómodas.",
      saveUpTo: "Ahorra hasta 80% en herramientas principales",
      preVettedVendors: "Vendedores pre-verificados",
      vendorsCoPayUpTo: "Vendedores co-pagan hasta 50%",
      exploreMarketplace: "Explorar Mercado →",
      seeVendorCoPay: "Ver Co-Pago de Vendedor →",
      trustedByAgents: "Confiado por 500+ agentes y contando",
      
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
      
      // Common UI
      loading: "Cargando",
      noResultsFound: "No se encontraron {{type}}",
      tryAdjustingFilters: "Intenta ajustar tus términos de búsqueda o filtros",
      signIn: "Iniciar Sesión",
      signUp: "Registrarse",
      save: "Guardar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      view: "Ver",
      close: "Cerrar",
      
      // Currency
      currency: "USD",
      
      // First Visit Intro  
      intro: {
        newBadge: "Nuevo",
        headline: "Bienvenido a Circle Network - Donde los Mejores Agentes Prosperan",
        subheadline: "Únete a miles de agentes ahorrando dinero y haciendo crecer su negocio con nuestro mercado curado.",
        benefit1Title: "Ahorros Masivos",
        benefit1Desc: "Ahorra 40-80% en herramientas que ya usas",
        benefit2Title: "Crecimiento Impulsado por IA",
        benefit2Desc: "Obtén recomendaciones personalizadas para aumentar tu ROI",
        benefit3Title: "Verificado por Agentes",
        benefit3Desc: "Cada servicio es probado por agentes exitosos como tú",
        learnMore: "Explorar Primero",
        getStarted: "Comenzar Gratis"
      }
    }
  },
  fr: {
    translation: {
      // Navigation
      marketplace: "Marché",
      academy: "Académie",
      pricing: "Tarification",
      agentWallet: "Portefeuille Agent",
      
      // Hero Section
      heroTitle: "Le Marché",
      heroSubtitle: "Que les Agents Ont Vraiment Demandé",
      heroDescription: "Enfin, un marché vérifié et approuvé par les agents avec des prix négociés et des fournisseurs éprouvés. Tous les outils dont vous avez besoin—plus rapide, moins cher, sans appels de vente gênants.",
      saveUpTo: "Économisez jusqu'à 80% sur les meilleurs outils",
      preVettedVendors: "Fournisseurs pré-vérifiés",
      vendorsCoPayUpTo: "Les fournisseurs co-paient jusqu'à 50%",
      exploreMarketplace: "Explorer le Marché →",
      seeVendorCoPay: "Voir Co-Paiement Fournisseur →",
      trustedByAgents: "Approuvé par 500+ agents et plus",
      
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
      
      // Common UI
      loading: "Chargement",
      noResultsFound: "Aucun {{type}} trouvé",
      tryAdjustingFilters: "Essayez d'ajuster vos termes de recherche ou filtres",
      signIn: "Se Connecter",
      signUp: "S'inscrire",
      save: "Sauvegarder",
      cancel: "Annuler",
      edit: "Modifier",
      delete: "Supprimer",
      view: "Voir",
      close: "Fermer",
      
      // Currency
      currency: "CAD",
      
      // First Visit Intro
      intro: {
        newBadge: "Nouveau",
        headline: "Bienvenue sur Circle Network - Où les Meilleurs Agents Prospèrent",
        subheadline: "Rejoignez des milliers d'agents qui économisent de l'argent et développent leur entreprise avec notre marché curé.",
        benefit1Title: "Économies Massives",
        benefit1Desc: "Économisez 40-80% sur les outils que vous utilisez déjà",
        benefit2Title: "Croissance Alimentée par l'IA",
        benefit2Desc: "Obtenez des recommandations personnalisées pour augmenter votre ROI",
        benefit3Title: "Vérifié par les Agents",
        benefit3Desc: "Chaque service est testé par des agents performants comme vous",
        learnMore: "Explorer d'Abord",
        getStarted: "Commencer Gratuitement"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('preferredLanguage') || 'en', // Load saved language or default to English
    fallbackLng: 'en',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false
    }
  });

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('preferredLanguage', lng);
  // Update HTML lang attribute for better accessibility
  document.documentElement.lang = lng;
});

export default i18n;