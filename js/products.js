/**
 * BASE DE DATOS DE PRODUCTOS - BURGER & HOT DOGS
 * Datos basados fielmente en el menú del negocio
 */

const MENU_DATA = [
  // --- SECCIÓN HAMBURGUESAS (Todas incluyen papas) ---
  {
    id: "burger-sencilla",
    name: "Burguer Sencilla",
    category: "burgers",
    price: 100,
    badge: "Clásica",
    description: "Carne de res seleccionada, cebolla caramelizada, lechuga fresca, jamón, queso amarillo derretido y chile jalapeño.",
    includes: "🍟 Incluye porción de papas",
    image: "assets/images/burger_fries.jpg",
    popular: false
  },
  {
    id: "burger-tocino",
    name: "Burguer de Tocino",
    category: "burgers",
    price: 110,
    badge: "Favorita",
    description: "Carne de res, cebolla caramelizada, lechuga, jamón, queso amarillo, queso de hebra fundido, tocino crujiente, salsa BBQ y chile.",
    includes: "🍟 Incluye porción de papas",
    image: "assets/images/burger_bacon.jpg",
    popular: true
  },
  {
    id: "burger-hawaiana",
    name: "Burguer Hawaiana",
    category: "burgers",
    price: 125,
    badge: "Tropical",
    description: "Carne de res, cebolla caramelizada, lechuga, jamón, queso amarillo, queso de hebra, piña asada, salsa BBQ y chile.",
    includes: "🍟 Incluye porción de papas",
    image: "assets/images/burger_combo.jpg",
    popular: false
  },
  {
    id: "burger-especial",
    name: "Burguer Especial",
    category: "burgers",
    price: 150,
    badge: "🔥 La Más Completa",
    description: "Carne de res premium, cebolla caramelizada, lechuga, jamón, queso amarillo, queso de hebra, piña dulce, tocino crujiente, salsa BBQ y chile.",
    includes: "🍟 Incluye porción de papas",
    image: "assets/images/hero_burger.jpg",
    popular: true
  },

  // --- SECCIÓN HOT DOGS ---
  {
    id: "hotdog-sencillo",
    name: "Hot Dog Sencillo",
    category: "hotdogs",
    price: 45,
    badge: "Clásico",
    description: "Pan artesanal caliente, salchicha doradita, aderezos cremosos de la casa, mayonesa, ketchup y mostaza.",
    includes: "Aderezos de la casa",
    image: "assets/images/hotdog_loaded.jpg",
    popular: false
  },
  {
    id: "hotdog-queso",
    name: "Hot Dog con Queso",
    category: "hotdogs",
    price: 55,
    badge: "Queso de Hebra",
    description: "Salchicha dorada con generosa porción de queso de hebra fundido y gratinado, más aderezos especiales.",
    includes: "Queso de hebra fundido",
    image: "assets/images/hotdog_loaded.jpg",
    popular: false
  },
  {
    id: "hotdog-tocino",
    name: "Hot Dog de Tocino",
    category: "hotdogs",
    price: 75,
    badge: "Crujiente",
    description: "Salchicha envuelta en tocino crujiente, queso fundido, aderezos especiales y toque de chile.",
    includes: "Tocino crujiente",
    image: "assets/images/hotdog_special.jpg",
    popular: true
  },
  {
    id: "hotdog-hawaiano",
    name: "Hot Dog Hawaiano",
    category: "hotdogs",
    price: 75,
    badge: "Agridulce",
    description: "Salchicha, piña caramelizada, abundante queso de hebra fundido, tocino y salsa BBQ.",
    includes: "Piña asada & BBQ",
    image: "assets/images/hotdog_hawaiano.jpg",
    popular: false
  },
  {
    id: "hotdog-combinado",
    name: "Hot Dog Combinado",
    category: "hotdogs",
    price: 90,
    badge: "⭐ Especial de la Casa",
    description: "La joya de la casa: salchicha envuelta en tocino, queso de hebra deshebrado, piña, aderezos y salsas.",
    includes: "Cargado con todo",
    image: "assets/images/hotdog_special.jpg",
    popular: true
  },

  // --- SECCIÓN COMPLEMENTOS Y BEBIDAS ---
  {
    id: "extra-papas",
    name: "Orden Extra de Papas",
    category: "extras",
    price: 40,
    badge: "Acompañamiento",
    description: "Papas a la francesa doraditas y sazonadas con sal y aderezos al gusto.",
    includes: "Porción individual",
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80",
    popular: false
  },
];

// Opciones de personalización disponibles
const CUSTOM_OPTIONS = {
  exclusions: [
    { id: "sin-cebolla", label: "Sin Cebolla Caramelizada" },
    { id: "sin-chile", label: "Sin Chile" },
    { id: "sin-lechuga", label: "Sin Lechuga" },
    { id: "sin-aderezos", label: "Sin Aderezos / Salsas" },
    { id: "sin-pina", label: "Sin Piña" }
  ],
  extras: [
    { id: "extra-queso", label: "Extra Queso de Hebra", price: 15 },
    { id: "extra-tocino", label: "Extra Tocino Crujiente", price: 20 },
    { id: "extra-carne", label: "Carne Extra (Burger)", price: 35 }
  ]
};

// Configuración general del negocio
const STORE_CONFIG = {
  name: "BURGER & HOT DOGS",
  tagline: "El auténtico sabor urbano & a la plancha",
  phone: "+52 921 303 3313", // Cambia esto por tu número de teléfono real con código de país
  whatsappNumber: "529213033313", // Cambia esto por tu número de WhatsApp real con código de país (ej. 521XXXXXXXXXX)
  currency: "$",
  deliveryNote: "🛵 Envíos a domicilio con costo adicional según zona",
  promoHero: "🔥 ¡Todas las Burgers incluyen papas fritas gratis!"
};
