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

  // --- SECCIÓN HOT DOGS (JOCHOS JUMBOS) ---
  {
    id: "hotdog-sencillo",
    name: "Hot Dog Sencillo",
    category: "hotdogs",
    price: 40,
    priceWithoutFries: 40,
    priceWithFries: 50,
    badge: "Clásico",
    description: "Pan artesanal caliente, salchicha doradita, aderezos cremosos de la casa y salsas.",
    includes: "Con papas: $50 / Sin papas: $40",
    image: "assets/images/hotdog_loaded.jpg",
    popular: false
  },
  {
    id: "hotdog-queso",
    name: "Hot Dog de Queso",
    category: "hotdogs",
    price: 45,
    priceWithoutFries: 45,
    priceWithFries: 55,
    badge: "Queso Fundido",
    description: "Salchicha dorada con generosa porción de queso fundido, aderezos especiales y salsas.",
    includes: "Con papas: $55 / Sin papas: $45",
    image: "assets/images/hotdog_loaded.jpg",
    popular: false
  },
  {
    id: "hotdog-tocino",
    name: "Hot Dog de Tocino",
    category: "hotdogs",
    price: 65,
    priceWithoutFries: 65,
    priceWithFries: 75,
    badge: "Tocino Crujiente",
    description: "Salchicha envuelta en tocino crujiente, queso fundido, aderezos especiales y salsas.",
    includes: "Con papas: $75 / Sin papas: $65",
    image: "assets/images/hotdog_special.jpg",
    popular: true
  },
  {
    id: "hotdog-hawaiano",
    name: "Hot Dog Hawaiano",
    category: "hotdogs",
    price: 70,
    priceWithoutFries: 70,
    priceWithFries: 75,
    badge: "Piña Asada",
    description: "Salchicha, queso derretido, tocino crujiente, piña asada caramelizada y salsas.",
    includes: "Con papas: $75 / Sin papas: $70",
    image: "assets/images/hotdog_hawaiano.jpg",
    popular: false
  },
  {
    id: "hotdog-combinado",
    name: "Hot Dog Combinado",
    category: "hotdogs",
    price: 80,
    priceWithoutFries: 80,
    priceWithFries: 90,
    badge: "⭐ Especial de la Casa",
    description: "Salchicha envuelta en tocino crujiente, queso de hebra deshebrado, piña dulce y salsas de la casa.",
    includes: "Con papas: $90 / Sin papas: $80",
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
  name: "ENTRE 3",
  tagline: "Tres amigos, un mismo sabor",
  specialties: "Hamburguesas • Hot Dogs • Papas",
  phone: "+52 921 303 3313", // Cambia esto por tu número de teléfono real con código de país
  whatsappNumber: "529213033313", // Cambia esto por tu número de WhatsApp real con código de país (ej. 521XXXXXXXXXX)
  currency: "$",
  deliveryNote: "🛵 Envíos a domicilio con costo adicional según zona",
  promoHero: "🔥 ¡Todas las Burgers de ENTRE 3 incluyen papas fritas gratis!",
  hours: {
    openHour: 18, // 6:00 PM
    closeHour: 24, // 12:00 AM
    closedDays: [1], // Lunes = 1
    scheduleText: "Mar a Dom: 6:00 PM - 12:00 AM • Lunes: Cerrado"
  }
};
