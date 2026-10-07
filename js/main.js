import { MENU_DATA, STORE_CONFIG, CUSTOM_OPTIONS } from './products.js';
import { 
  getCart, 
  setCart, 
  quickAddToCart, 
  saveCart, 
  calculateCartTotals, 
  updateCartUI, 
  changeItemQty, 
  removeItemFromCart 
} from './modules/cart.js';
import { 
  getCurrentTheme, 
  applyTheme, 
  toggleTheme, 
  initScrollAnimations, 
  observeScrollElements 
} from './modules/ui.js';
import { handleCheckoutSubmit } from './modules/api.js';

// Estado de la Aplicación
let currentFilter = 'all';
let searchQuery = '';
let orderType = 'delivery'; 
let currentProductToCustomize = null;

// Elementos DOM Principales
const productsGrid = document.getElementById('products-grid');
const filterBtns = document.querySelectorAll('.filter-btn');
const menuSearchInput = document.getElementById('menu-search-input');
const menuSearchClearBtn = document.getElementById('menu-search-clear-btn');
const quickTagChips = document.querySelectorAll('.quick-tag-chip');
const menuSearchStatus = document.getElementById('menu-search-status');
const searchStatusCount = document.getElementById('search-status-count');
const searchStatusDesc = document.getElementById('search-status-desc');
const searchStatusClearBtn = document.getElementById('search-status-clear-btn');
const cartBadgeCount = document.getElementById('cart-badge-count');
const cartBtnTotal = document.getElementById('cart-btn-total');
const cartItemCountLabel = document.getElementById('cart-item-count-label');
const cartItemsContainer = document.getElementById('cart-items-container');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryTotal = document.getElementById('summary-total');

// Modales y Drawer
const cartBackdrop = document.getElementById('cart-backdrop');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const cartCloseBtn = document.getElementById('cart-close-btn');
const mobileCartFloat = document.getElementById('mobile-cart-float');
const mobileCartCount = document.getElementById('mobile-cart-count');
const mobileCartTotal = document.getElementById('mobile-cart-total');

// Checkout Modal
const checkoutModalBackdrop = document.getElementById('checkout-modal-backdrop');
const checkoutModalClose = document.getElementById('checkout-modal-close');
const checkoutTriggerBtn = document.getElementById('checkout-trigger-btn');
const checkoutForm = document.getElementById('checkout-form');
const paymentMethodSelect = document.getElementById('payment-method');
const changeFieldGroup = document.getElementById('change-field-group');
const addressFieldGroup = document.getElementById('address-field-group');
const customerAddressInput = document.getElementById('customer-address');

// Customize Modal
const customizeModalBackdrop = document.getElementById('customize-modal-backdrop');
const customizeModalClose = document.getElementById('customize-modal-close');
const modalProductTitle = document.getElementById('modal-product-title');
const customizeProductDetails = document.getElementById('customize-product-details');
const exclusionsOptionsContainer = document.getElementById('exclusions-options-container');
const extrasOptionsContainer = document.getElementById('extras-options-container');
const customItemNoteInput = document.getElementById('custom-item-note');
const modalCalculatedPrice = document.getElementById('modal-calculated-price');
const confirmCustomizeAddBtn = document.getElementById('confirm-customize-add-btn');

// Tipo de entrega buttons
const typeDeliveryBtn = document.getElementById('type-delivery-btn');
const typePickupBtn = document.getElementById('type-pickup-btn');

// Navegación móvil
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');
const header = document.getElementById('header');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const heroWhatsappBtn = document.getElementById('hero-whatsapp-btn');

// Tema
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeToggleIcon = document.getElementById('theme-toggle-icon');
const themeTooltip = document.getElementById('theme-tooltip');
const mobileThemeToggleBtn = document.getElementById('mobile-theme-toggle-btn');
const mobileThemeIcon = document.getElementById('mobile-theme-icon');
const mobileThemeLabel = document.getElementById('mobile-theme-label');

// Estado del Negocio y Horarios
const navStatusDot = document.getElementById('nav-status-dot');
const navStatusText = document.getElementById('nav-status-text');

// =========================================================================
// 1. RENDERIZADO DEL MENÚ
// =========================================================================

function normalizeSearchText(str) {
  if (!str) return '';
  return str.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getCategoryLabel(catId) {
  switch (catId) {
    case 'burgers': return 'Hamburguesas';
    case 'hotdogs': return 'Hot Dogs';
    case 'extras': return 'Extras & Bebidas';
    default: return 'Todo el Menú';
  }
}

function matchProductWithQuery(product, query) {
  if (!query) return true;
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return true;
  const terms = normQuery.split(/\s+/).filter(Boolean);
  const prodName = normalizeSearchText(product.name);
  const prodDesc = normalizeSearchText(product.description);
  const prodIncludes = normalizeSearchText(product.includes || '');
  const prodBadge = normalizeSearchText(product.badge || '');
  const prodCategory = normalizeSearchText(product.category || '');

  let categorySynonyms = '';
  if (product.category === 'burgers') {
    categorySynonyms = 'hamburguesa hamburguesas burger burgers carne res plancha';
  } else if (product.category === 'hotdogs') {
    categorySynonyms = 'hotdog hotdogs perro perros salchicha hot dog pan';
  } else if (product.category === 'extras') {
    categorySynonyms = 'papas fritas francesas bebida refresco extra';
  }

  const searchableBlob = `${prodName} ${prodDesc} ${prodIncludes} ${prodBadge} ${prodCategory} ${categorySynonyms}`;
  return terms.every(term => searchableBlob.includes(term));
}

function highlightMatches(text, query) {
  if (!text || !query) return text;
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return text;
  const terms = normQuery.split(/\s+/).filter(t => t.length > 1);
  if (terms.length === 0) return text;
  let result = text;
  terms.forEach(term => {
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeTerm})`, 'gi');
    result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
  });
  return result;
}

function selectCategory(cat) {
  currentFilter = cat;
  filterBtns.forEach(b => {
    const isMatch = b.getAttribute('data-category') === cat;
    b.classList.toggle('active', isMatch);
    b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
  });
  renderProducts();
}

function clearSearch() {
  searchQuery = '';
  if (menuSearchInput) menuSearchInput.value = '';
  syncQuickChipsState();
  renderProducts();
}

function syncQuickChipsState() {
  const norm = normalizeSearchText(searchQuery);
  quickTagChips.forEach(chip => {
    const chipTerm = normalizeSearchText(chip.getAttribute('data-search') || '');
    chip.classList.toggle('active', norm.length > 0 && norm === chipTerm);
  });
}

function renderProducts() {
  if (!productsGrid) return;
  productsGrid.innerHTML = '';
  productsGrid.className = 'products-grid pin-board-grid';

  const queryTrimmed = searchQuery.trim();
  const hasSearch = queryTrimmed.length > 0;

  if (menuSearchClearBtn) {
    menuSearchClearBtn.style.display = hasSearch ? 'flex' : 'none';
  }

  const allMatches = hasSearch 
    ? MENU_DATA.filter(item => matchProductWithQuery(item, queryTrimmed))
    : MENU_DATA;

  const categoryFiltered = (currentFilter === 'all')
    ? allMatches
    : allMatches.filter(item => item.category === currentFilter);

  if (menuSearchStatus) {
    if (hasSearch) {
      menuSearchStatus.style.display = 'flex';
      const count = categoryFiltered.length;
      if (searchStatusCount) searchStatusCount.textContent = `${count} ${count === 1 ? 'encontrado' : 'encontrados'}`;
      if (searchStatusDesc) {
        const categorySuffix = currentFilter !== 'all' ? ` en ${getCategoryLabel(currentFilter)}` : '';
        searchStatusDesc.innerHTML = `para "<strong>${escapeHtml(queryTrimmed)}</strong>"${categorySuffix}`;
      }
    } else {
      menuSearchStatus.style.display = 'none';
    }
  }

  if (categoryFiltered.length === 0) {
    if (hasSearch && allMatches.length > 0) {
      productsGrid.innerHTML = `
        <div class="menu-no-results">
          <div class="no-results-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
          <h3>Sin resultados en ${getCategoryLabel(currentFilter)}</h3>
          <p>No hay coincidencias en esta categoría, pero encontramos <strong>${allMatches.length} ${allMatches.length === 1 ? 'platillo' : 'platillos'}</strong> con "<strong>${escapeHtml(queryTrimmed)}</strong>" en otras secciones del menú.</p>
          <div class="no-results-actions">
            <button class="btn btn-primary" id="btn-show-all-search">
              <i class="fa-solid fa-layer-group"></i> Ver en Todo el Menú (${allMatches.length})
            </button>
            <button class="btn btn-outline" id="btn-clear-empty-search">
              <i class="fa-solid fa-xmark"></i> Quitar búsqueda
            </button>
          </div>
        </div>
      `;
      document.getElementById('btn-show-all-search')?.addEventListener('click', () => selectCategory('all'));
      document.getElementById('btn-clear-empty-search')?.addEventListener('click', () => clearSearch());
      return;
    }
    if (hasSearch) {
      productsGrid.innerHTML = `
        <div class="menu-no-results">
          <div class="no-results-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
          <h3>No encontramos platillos para "${escapeHtml(queryTrimmed)}"</h3>
          <p>Intenta buscar por ingredientes populares como <em>tocino, queso, piña, jalapeño, salsa BBQ</em> o selecciona una de nuestras categorías.</p>
          <div class="no-results-actions">
            <button class="btn btn-primary" id="btn-clear-empty-search">
              <i class="fa-solid fa-rotate-left"></i> Limpiar búsqueda y ver todo
            </button>
            <button class="btn btn-outline" id="btn-empty-burgers">
              <i class="fa-solid fa-burger"></i> Ver Hamburguesas
            </button>
            <button class="btn btn-outline" id="btn-empty-hotdogs">
              <i class="fa-solid fa-hotdog"></i> Ver Hot Dogs
            </button>
          </div>
        </div>
      `;
      document.getElementById('btn-clear-empty-search')?.addEventListener('click', () => clearSearch());
      document.getElementById('btn-empty-burgers')?.addEventListener('click', () => { clearSearch(); selectCategory('burgers'); });
      document.getElementById('btn-empty-hotdogs')?.addEventListener('click', () => { clearSearch(); selectCategory('hotdogs'); });
      return;
    }
    productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">No hay productos disponibles en esta categoría.</p>`;
    return;
  }

  categoryFiltered.forEach((product, idx) => {
    const card = document.createElement('article');
    const aspectClass = product.aspectClass || 'pin-aspect-standard';
    card.className = `pin-card product-card ${aspectClass} scroll-fade-item`;
    card.style.setProperty('--fade-idx', (idx % 6));
    
    const titleHtml = hasSearch ? highlightMatches(product.name, queryTrimmed) : product.name;
    const descHtml = hasSearch ? highlightMatches(product.description, queryTrimmed) : product.description;
    const includesHtml = product.includes ? (hasSearch ? highlightMatches(product.includes, queryTrimmed) : product.includes) : '';

    const isHotDog = (product.category === 'hotdogs' && product.priceWithFries);
    const priceDisplayHtml = isHotDog ? `
      <div class="hotdog-price-dual">
        <div class="price-dual-row">
          <span class="price-dual-val">${STORE_CONFIG.currency}${product.price}</span>
          <span class="price-dual-tag">Sin papas</span>
        </div>
        <div class="price-dual-row highlight">
          <span class="price-dual-val">${STORE_CONFIG.currency}${product.priceWithFries}</span>
          <span class="price-dual-tag">Con papas 🍟</span>
        </div>
      </div>
    ` : `
      <div class="pin-price-wrap">
        <span class="pin-price-val">${STORE_CONFIG.currency}${product.price}</span>
        ${product.includes && product.category === 'burgers' ? '<span class="pin-fries-tag">🍟 Incluye Papas</span>' : ''}
      </div>
    `;

    card.innerHTML = `
      <div class="pin-media-wrap product-img-wrap gallery-photo-trigger" data-id="${product.id}" role="button" tabindex="0" title="Toca para ver ${product.name} en el tablero">
        <img src="${product.image}" alt="${product.name}" class="pin-img product-img" loading="lazy" onerror="this.src='assets/images/hero_burger.jpg'">
        ${product.badge ? `<span class="pin-badge product-badge">${product.badge}</span>` : ''}
        <div class="pin-hover-overlay">
          <div class="pin-top-actions">
            <button type="button" class="pin-save-btn btn-add-cart-action" data-id="${product.id}">
              <i class="fa-solid fa-cart-plus"></i> ${isHotDog ? 'Elegir' : 'Añadir'}
            </button>
          </div>
          <div class="pin-bottom-actions">
            <button type="button" class="pin-circle-btn pin-whatsapp-action" data-id="${product.id}" title="Pedir este platillo por WhatsApp">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
            <button type="button" class="pin-circle-btn pin-zoom-action" data-id="${product.id}" title="Ampliar Pin">
              <i class="fa-solid fa-expand"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="pin-meta product-card-body">
        <div class="pin-meta-header product-header">
          <h3 class="pin-title product-title">${titleHtml}</h3>
          ${priceDisplayHtml}
        </div>
        <p class="pin-desc product-desc">${descHtml}</p>
        ${product.includes && product.category !== 'burgers' ? `
          <div class="pin-includes product-includes">
            <i class="fa-solid fa-sparkles"></i> ${includesHtml}
          </div>
        ` : ''}
        <div class="pin-footer">
          <div class="pin-author">
            <img src="assets/images/entre_3_logo.jpg" alt="Logo ENTRE 3" class="pin-author-img">
            <span class="pin-author-name">ENTRE 3</span>
          </div>
          <div class="pin-actions-btns">
            <button type="button" class="pin-customize-btn btn-customize-action" data-id="${product.id}" title="Personalizar ingredientes (quitar/agregar extras)">
              <i class="fa-solid fa-sliders"></i>
            </button>
            <button type="button" class="pin-mobile-add-btn btn-add-cart-action" data-id="${product.id}">
              <i class="fa-solid fa-plus"></i> ${isHotDog ? 'Elegir' : 'Añadir'}
            </button>
          </div>
        </div>
      </div>
    `;
    productsGrid.appendChild(card);
  });

  productsGrid.querySelectorAll('.btn-add-cart-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const res = quickAddToCart(id);
      if (res.needsCustomization) openCustomizeModal(id);
      else if (res.success) {
        updateCartUI();
        showToast(`✓ ¡${res.product.name} agregado al pedido!`);
      }
    });
  });

  productsGrid.querySelectorAll('.btn-customize-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      openCustomizeModal(id);
    });
  });

  productsGrid.querySelectorAll('.pin-whatsapp-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const prod = MENU_DATA.find(p => p.id === id);
      if (prod) {
        const text = encodeURIComponent(`¡Hola ENTRE 3! 🍔 Me gustaría ordenar: *${prod.name}* (${STORE_CONFIG.currency}${prod.price}).`);
        window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${text}`, '_blank');
      }
    });
  });

  productsGrid.querySelectorAll('.pin-zoom-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (id) openProductInLightbox(id);
    });
  });

  productsGrid.querySelectorAll('.gallery-photo-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const id = trigger.getAttribute('data-id');
      if (id) openProductInLightbox(id);
    });
  });

  // Observar los nuevos pines para la animación de cascada
  observeScrollElements(productsGrid);
}

// =========================================================================
// 2. MODAL DE PERSONALIZACIÓN
// =========================================================================

function openCustomizeModal(productId) {
  const product = MENU_DATA.find(p => p.id === productId);
  if (!product) return;

  currentProductToCustomize = product;
  modalProductTitle.textContent = `Personalizar: ${product.name}`;

  const isHotDog = (product.category === 'hotdogs');
  const displayBasePrice = isHotDog 
    ? `Sin papas: ${STORE_CONFIG.currency}${product.priceWithoutFries || product.price} / Con papas: ${STORE_CONFIG.currency}${product.priceWithFries}`
    : `${STORE_CONFIG.currency}${product.price}`;

  customizeProductDetails.innerHTML = `
    <div style="display: flex; gap: 14px; align-items: center; background: var(--bg-surface); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
      <img src="${product.image}" style="width: 60px; height: 60px; border-radius: var(--radius-sm); object-fit: cover;" onerror="this.src='assets/images/hero_burger.jpg'">
      <div style="font-size: 0.9rem; font-weight: 700;">${product.name}</div>
      <div style="color: var(--secondary); font-weight: 800; font-size: 0.9rem;">${displayBasePrice}</div>
    </div>
  `;

  const hotdogFriesGroup = document.getElementById('hotdog-fries-selection-group');
  const hotdogFriesContainer = document.getElementById('hotdog-fries-options-container');

  if (hotdogFriesGroup && hotdogFriesContainer) {
    if (isHotDog && product.priceWithFries) {
      hotdogFriesGroup.style.display = 'block';
      hotdogFriesContainer.innerHTML = `
        <label class="fries-choice-card" id="card-choice-no">
          <input type="radio" name="hotdog-fries-option" value="no" class="hotdog-fries-radio">
          <div class="fries-choice-info">
            <span class="fries-choice-label">Sin papas</span>
            <span class="fries-choice-price">${STORE_CONFIG.currency}${product.priceWithoutFries || product.price}</span>
          </div>
        </label>
        <label class="fries-choice-card active" id="card-choice-yes">
          <input type="radio" name="hotdog-fries-option" value="yes" checked class="hotdog-fries-radio">
          <div class="fries-choice-info">
            <span class="fries-choice-label">🍟 Con papas fritas</span>
            <span class="fries-choice-price">${STORE_CONFIG.currency}${product.priceWithFries}</span>
          </div>
        </label>
      `;
      hotdogFriesContainer.querySelectorAll('.hotdog-fries-radio').forEach(r => {
        r.addEventListener('change', () => {
          hotdogFriesContainer.querySelectorAll('.fries-choice-card').forEach(c => c.classList.remove('active'));
          r.closest('.fries-choice-card').classList.add('active');
          recalculateModalPrice();
        });
      });
    } else {
      hotdogFriesGroup.style.display = 'none';
      hotdogFriesContainer.innerHTML = '';
    }
  }

  exclusionsOptionsContainer.innerHTML = CUSTOM_OPTIONS.exclusions.map(ex => `
    <label class="option-checkbox-label">
      <div class="option-left">
        <input type="checkbox" name="exclusion" value="${ex.label}" class="custom-exclusion-chk">
        <span>${ex.label}</span>
      </div>
    </label>
  `).join('');

  extrasOptionsContainer.innerHTML = CUSTOM_OPTIONS.extras.map(extra => `
    <label class="option-checkbox-label">
      <div class="option-left">
        <input type="checkbox" name="extra" value="${extra.label}" data-price="${extra.price}" class="custom-extra-chk">
        <span>${extra.label}</span>
        <span class="option-extra-price">+${STORE_CONFIG.currency}${extra.price}</span>
      </div>
    </label>
  `).join('');

  customItemNoteInput.value = '';
  recalculateModalPrice();

  customizeModalBackdrop.querySelectorAll('.custom-extra-chk').forEach(chk => {
    chk.addEventListener('change', recalculateModalPrice);
  });

  customizeModalBackdrop.classList.add('active');
}

function recalculateModalPrice() {
  if (!currentProductToCustomize) return;
  let base = currentProductToCustomize.price;
  if (currentProductToCustomize.category === 'hotdogs') {
    const withFries = customizeModalBackdrop.querySelector('input[name="hotdog-fries-option"]:checked')?.value === 'yes';
    base = withFries 
      ? (currentProductToCustomize.priceWithFries || currentProductToCustomize.price) 
      : (currentProductToCustomize.priceWithoutFries || currentProductToCustomize.price);
  }
  const checkedExtras = customizeModalBackdrop.querySelectorAll('.custom-extra-chk:checked');
  checkedExtras.forEach(chk => {
    base += parseFloat(chk.getAttribute('data-price') || 0);
  });
  modalCalculatedPrice.textContent = `${STORE_CONFIG.currency}${base}`;
}

function handleConfirmCustomize() {
  if (!currentProductToCustomize) return;
  let basePrice = currentProductToCustomize.price;
  let itemDisplayName = currentProductToCustomize.name;
  let friesOptionLabel = null;

  if (currentProductToCustomize.category === 'hotdogs') {
    const withFries = customizeModalBackdrop.querySelector('input[name="hotdog-fries-option"]:checked')?.value === 'yes';
    basePrice = withFries 
      ? (currentProductToCustomize.priceWithFries || currentProductToCustomize.price) 
      : (currentProductToCustomize.priceWithoutFries || currentProductToCustomize.price);
    itemDisplayName = `${currentProductToCustomize.name} ${withFries ? '(Con Papas 🍟)' : '(Sin Papas)'}`;
    friesOptionLabel = withFries ? '🍟 Combo con papas fritas' : 'Sin papas';
  }

  const exclusions = Array.from(customizeModalBackdrop.querySelectorAll('.custom-exclusion-chk:checked')).map(c => c.value);
  const extras = Array.from(customizeModalBackdrop.querySelectorAll('.custom-extra-chk:checked')).map(c => ({
    label: c.value,
    price: parseFloat(c.getAttribute('data-price') || 0)
  }));
  const note = customItemNoteInput.value.trim();
  let extraPriceTotal = extras.reduce((sum, e) => sum + e.price, 0);
  let finalItemUnitPrice = basePrice + extraPriceTotal;

  const cart = getCart();
  const updatedCart = [...cart, {
    cartItemId: Date.now() + Math.random().toString(36).substring(2, 6),
    id: currentProductToCustomize.id,
    name: itemDisplayName,
    unitPrice: basePrice,
    totalPrice: finalItemUnitPrice,
    quantity: 1,
    image: currentProductToCustomize.image,
    exclusions: exclusions,
    extras: extras,
    note: note,
    friesChoice: friesOptionLabel
  }];
  setCart(updatedCart);
  updateCartUI();
  customizeModalBackdrop.classList.remove('active');
  showToast(`✓ ¡${itemDisplayName} agregado a tu orden!`);
}

// =========================================================================
// 3. GALERÍA LIGHTBOX
// =========================================================================

function openProductInLightbox(productId) {
  const idx = MENU_DATA.findIndex(p => p.id === productId);
  if (idx === -1) return;
  
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxPrice = document.getElementById('lightbox-price');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxOrderBtn = document.getElementById('lightbox-order-btn');
  const lightboxWhatsappBtn = document.getElementById('lightbox-whatsapp-btn');

  if (!lightbox) return;

  const showPinByIndex = (index) => {
    if (MENU_DATA.length === 0) return;
    if (index < 0) index = MENU_DATA.length - 1;
    if (index >= MENU_DATA.length) index = 0;
    
    const product = MENU_DATA[index];
    if (lightboxImg) lightboxImg.src = product.image;
    if (lightboxTitle) lightboxTitle.textContent = product.name;
    if (lightboxDesc) lightboxDesc.textContent = product.description;
    
    let priceText = `${STORE_CONFIG.currency}${product.price} MXN`;
    if (product.category === 'hotdogs' && product.priceWithFries) {
      priceText = `Sin papas: ${STORE_CONFIG.currency}${product.price} / Con papas: ${STORE_CONFIG.currency}${product.priceWithFries} 🍟`;
    } else if (product.includes) {
      priceText = `${STORE_CONFIG.currency}${product.price} MXN (${product.includes})`;
    }
    if (lightboxPrice) lightboxPrice.textContent = priceText;
    if (lightboxCategory) lightboxCategory.textContent = getCategoryLabel(product.category);

    if (lightboxOrderBtn) {
      lightboxOrderBtn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> ' + (product.category === 'hotdogs' ? 'Elegir Presentación y Ordenar' : 'Añadir al Carrito');
      lightboxOrderBtn.onclick = () => {
        closeLightbox();
        const res = quickAddToCart(product.id);
        if (res.needsCustomization) openCustomizeModal(product.id);
        else if (res.success) {
          updateCartUI();
          showToast(`✓ ¡${product.name} agregado al pedido!`);
        }
      };
    }

    if (lightboxWhatsappBtn) {
      lightboxWhatsappBtn.onclick = () => {
        closeLightbox();
        const text = encodeURIComponent(`¡Hola ENTRE 3! 🍔 Me interesa ordenar este pin: *${product.name}* (${STORE_CONFIG.currency}${product.price}).`);
        window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${text}`, '_blank');
      };
    }
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => showPinByIndex(idx - 1));
  if (lightboxNext) lightboxNext.addEventListener('click', () => showPinByIndex(idx + 1));
  
  showPinByIndex(idx);
}

// =========================================================================
// 4. HORARIOS Y UTILIDADES
// =========================================================================

function checkStoreHours() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const isMonday = (day === 1);
  const isWithinHours = !isMonday && (hour >= 18 && hour < 24);
  return { isOpen: isWithinHours, isMonday };
}

function updateStoreHoursUI() {
  const store = checkStoreHours();
  if (navStatusDot && navStatusText) {
    if (store.isOpen) {
      navStatusDot.className = 'status-dot';
      navStatusText.textContent = 'Abierto';
    } else {
      navStatusDot.className = 'status-dot closed';
      navStatusText.textContent = 'Cerrado';
    }
  }
}

function showToast(message) {
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// Funciones globales expuestas para el HTML (onclick en línea)
window.openProductInLightbox = openProductInLightbox;
window.changeItemQty = changeItemQty;
window.removeItemFromCart = removeItemFromCart;
window.showToast = showToast;

function init() {
  applyTheme(getCurrentTheme(), false);
  renderProducts();
  initScrollAnimations();
  updateCartUI();
  updateStoreHoursUI();
  setupEventListeners();

  setInterval(() => {
    updateStoreHoursUI();
  }, 60000);
}

function setupEventListeners() {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category');
      selectCategory(cat);
    });
  });

  if (menuSearchInput) {
    menuSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      syncQuickChipsState();
      renderProducts();
    });
    menuSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        clearSearch();
        menuSearchInput.blur();
      }
    });
  }

  if (menuSearchClearBtn) {
    menuSearchClearBtn.addEventListener('click', () => {
      clearSearch();
      menuSearchInput.focus();
    });
  }

  if (searchStatusClearBtn) {
    searchStatusClearBtn.addEventListener('click', () => {
      clearSearch();
    });
  }

  if (quickTagChips) {
    quickTagChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const queryTerm = chip.getAttribute('data-search') || '';
        if (normalizeSearchText(searchQuery) === normalizeSearchText(queryTerm)) {
          clearSearch();
        } else {
          searchQuery = queryTerm;
          if (menuSearchInput) menuSearchInput.value = queryTerm;
          syncQuickChipsState();
          renderProducts();
        }
      });
    });
  }

  if (cartToggleBtn) {
    cartToggleBtn.addEventListener('click', () => {
      cartBackdrop.classList.add('active');
    });
  }

  if (mobileCartFloat) {
    mobileCartFloat.addEventListener('click', () => {
      cartBackdrop.classList.add('active');
    });
  }

  if (cartCloseBtn) {
    cartCloseBtn.addEventListener('click', () => {
      cartBackdrop.classList.remove('active');
    });
  }

  if (cartBackdrop) {
    cartBackdrop.addEventListener('click', (e) => {
      if (e.target === cartBackdrop) {
        cartBackdrop.classList.remove('active');
      }
    });
  }

  if (typeDeliveryBtn) {
    typeDeliveryBtn.addEventListener('click', () => {
      orderType = 'delivery';
      typeDeliveryBtn.classList.add('active');
      typePickupBtn.classList.remove('active');
      document.getElementById('delivery-cost-row').style.display = 'flex';
      addressFieldGroup.style.display = 'block';
      customerAddressInput.required = true;
      updateWaitTimeUI();
    });
  }

  if (typePickupBtn) {
    typePickupBtn.addEventListener('click', () => {
      orderType = 'pickup';
      typePickupBtn.classList.add('active');
      document.getElementById('delivery-cost-row').style.display = 'none';
      addressFieldGroup.style.display = 'none';
      customerAddressInput.required = false;
      updateWaitTimeUI();
    });
  }

  if (checkoutTriggerBtn) {
    checkoutTriggerBtn.addEventListener('click', () => {
      if (getCart().length === 0) {
        showToast('Agrega productos al carrito primero.');
        } else {
        checkoutModalBackdrop.classList.add('active');
        }
      });
  }

  if (checkoutModalClose) {
    checkoutModalClose.addEventListener('click', () => {
      checkoutModalBackdrop.classList.remove('active');
    });
  }

  if (checkoutModalBackdrop) {
    checkoutModalBackdrop.addEventListener('click', (e) => {
      if (e.target === checkoutModalBackdrop) {
        checkoutModalBackdrop.classList.remove('active');
      }
    });
  }

  if (confirmCustomizeAddBtn) {
    confirmCustomizeAddBtn.addEventListener('click', handleConfirmCustomize);
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  if (paymentMethodSelect) {
    paymentMethodSelect.addEventListener('change', () => {
      if (paymentMethodSelect.value === 'Efectivo (Cambio)') {
        changeFieldGroup.style.display = 'block';
      } else {
        changeFieldGroup.style.display = 'none';
      }
    });
  }

  if (heroWhatsappBtn) {
    heroWhatsappBtn.addEventListener('click', () => {
      const directMsg = `¡Hola! Me gustaría hacer un pedido en ${STORE_CONFIG.name}. ¿Me podrían compartir el menú o promociones del día? 🍔`;
      window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(directMsg)}`, '_blank');
    });
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      toggleTheme(showToast);
    });
  }

  if (mobileThemeToggleBtn) {
    mobileThemeToggleBtn.addEventListener('click', () => {
      toggleTheme(showToast);
      if (navLinks) navLinks.classList.remove('open');
    });
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

function updateWaitTimeUI() {
  // Tiempo estimado de espera según la modalidad elegida
  const waitTimeEl = document.getElementById('summary-wait-time');
  if (!waitTimeEl) return;
  waitTimeEl.textContent = (orderType === 'delivery') ? '25 - 35 min' : '15 - 25 min';
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
