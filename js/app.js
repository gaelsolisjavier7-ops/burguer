/**
 * APP.JS - LÓGICA PRINCIPAL DEL SITIO DE COMERCIO ELECTRÓNICO
 * Funcionalidad: Renderizado de menú, Carrito interactivo,
 * Personalización de platillos y Generador de pedidos a WhatsApp.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado del Carrito y Aplicación
  let cart = JSON.parse(localStorage.getItem('restaurant_cart')) || [];
  let currentFilter = 'all';
  let searchQuery = '';
  let orderType = 'delivery'; // 'delivery' o 'pickup'
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

  // Dynamic Wait Time Indicator Elements
  const cartWaitWidget = document.getElementById('cart-wait-widget');
  const waitPulseDot = document.getElementById('wait-pulse-dot');
  const waitStatusPill = document.getElementById('wait-status-pill');
  const waitModeToggleBtn = document.getElementById('wait-mode-toggle-btn');
  const waitQueueCounter = document.getElementById('wait-queue-counter');
  const waitIconBox = document.getElementById('wait-icon-box');
  const waitTimeValue = document.getElementById('wait-time-value');
  const waitTypeIcon = document.getElementById('wait-type-icon');
  const waitTypeText = document.getElementById('wait-type-text');
  const waitProgressFill = document.getElementById('wait-progress-fill');
  const waitTimeContext = document.getElementById('wait-time-context');
  const waitItemImpact = document.getElementById('wait-item-impact');
  const summaryWaitTime = document.getElementById('summary-wait-time');
  const checkoutWaitTime = document.getElementById('checkout-wait-time');

  // Interruptor de Tema (Dark / Light Mode)
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');
  const themeTooltip = document.getElementById('theme-tooltip');
  const mobileThemeToggleBtn = document.getElementById('mobile-theme-toggle-btn');
  const mobileThemeIcon = document.getElementById('mobile-theme-icon');
  const mobileThemeLabel = document.getElementById('mobile-theme-label');

  // Estado del Negocio y Horarios
  const navStatusDot = document.getElementById('nav-status-dot');
  const navStatusText = document.getElementById('nav-status-text');

  // Estado y configuraciones del motor dinámico de tiempo de espera
  const SIM_MODES = [
    { id: 'auto', label: 'Automático (Hora actual)' },
    { id: 'busy', label: 'Hora Pico 🔥', queue: 7, progress: 85, state: 'busy', statusText: 'Demanda Alta', minPrep: 28, maxPrep: 40 },
    { id: 'normal', label: 'Demanda Normal ⚡', queue: 4, progress: 52, state: 'normal', statusText: 'Demanda Normal', minPrep: 18, maxPrep: 28 },
    { id: 'fast', label: 'Cocina Rápida 🟢', queue: 1, progress: 25, state: 'fast', statusText: 'Cocina Rápida', minPrep: 10, maxPrep: 18 }
  ];
  let currentSimIndex = 0;
  let simulatedJitter = 0;
  let currentWaitRangeString = '25 - 35 min';

  // =========================================================================
  // 1. INICIALIZACIÓN Y RENDERIZADO DEL MENÚ
  // =========================================================================
  function init() {
    applyTheme(getCurrentTheme(), false);
    renderProducts();
    initGallery();
    initScrollAnimations();
    updateCartUI();
    updateWaitTimeUI();
    updateStoreHoursUI();
    setupEventListeners();

    // Actualización reactiva periódica cada 30 segundos para cocina y horario
    setInterval(() => {
      simulatedJitter = (simulatedJitter === 1) ? -1 : (simulatedJitter + 1);
      updateWaitTimeUI();
      updateStoreHoursUI();
    }, 30000);
  }

  // =========================================================================
  // 1. INICIALIZACIÓN Y RENDERIZADO DEL MENÚ CON BÚSQUEDA EN TIEMPO REAL
  // =========================================================================
  function normalizeSearchText(str) {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

    // Sinónimos contextuales comunes para usuarios de comida rápida
    let categorySynonyms = '';
    if (product.category === 'burgers') {
      categorySynonyms = 'hamburguesa hamburguesas burger burgers carne res plancha';
    } else if (product.category === 'hotdogs') {
      categorySynonyms = 'hotdog hotdogs perro perros salchicha hot dog pan';
    } else if (product.category === 'extras') {
      categorySynonyms = 'papas fritas francesas bebida refresco extra';
    }

    const searchableBlob = `${prodName} ${prodDesc} ${prodIncludes} ${prodBadge} ${prodCategory} ${categorySynonyms}`;

    return terms.every(term => {
      if (term === 'hamburguesa' || term === 'hamburguesas') {
        return product.category === 'burgers' || prodName.includes('burger');
      }
      if (term === 'hotdog' || term === 'hotdogs' || term === 'perro' || term === 'perros') {
        return product.category === 'hotdogs';
      }
      return searchableBlob.includes(term);
    });
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
    if (menuSearchInput) {
      menuSearchInput.value = '';
    }
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

    const queryTrimmed = searchQuery.trim();
    const hasSearch = queryTrimmed.length > 0;

    // Actualizar visibilidad de botón de limpiar búsqueda
    if (menuSearchClearBtn) {
      menuSearchClearBtn.style.display = hasSearch ? 'flex' : 'none';
    }

    // Filtrar primero según término de búsqueda en todo el menú
    const allMatches = hasSearch 
      ? MENU_DATA.filter(item => matchProductWithQuery(item, queryTrimmed))
      : MENU_DATA;

    // Luego filtrar por la categoría activa seleccionada
    const categoryFiltered = (currentFilter === 'all')
      ? allMatches
      : allMatches.filter(item => item.category === currentFilter);

    // Actualizar barra de resumen y feedback de búsqueda
    if (menuSearchStatus) {
      if (hasSearch) {
        menuSearchStatus.style.display = 'flex';
        const count = categoryFiltered.length;
        if (searchStatusCount) {
          searchStatusCount.textContent = `${count} ${count === 1 ? 'encontrado' : 'encontrados'}`;
        }
        if (searchStatusDesc) {
          const categorySuffix = currentFilter !== 'all' ? ` en ${getCategoryLabel(currentFilter)}` : '';
          searchStatusDesc.innerHTML = `para "<strong>${escapeHtml(queryTrimmed)}</strong>"${categorySuffix}`;
        }
      } else {
        menuSearchStatus.style.display = 'none';
      }
    }

    // CASO 1: Búsqueda activa pero sin resultados en la categoría actual
    if (categoryFiltered.length === 0) {
      if (hasSearch && allMatches.length > 0) {
        // Encontramos resultados en otra categoría del menú
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

        const btnShowAll = document.getElementById('btn-show-all-search');
        if (btnShowAll) {
          btnShowAll.addEventListener('click', () => {
            selectCategory('all');
          });
        }
        const btnClear = document.getElementById('btn-clear-empty-search');
        if (btnClear) {
          btnClear.addEventListener('click', () => {
            clearSearch();
          });
        }
        return;
      }

      if (hasSearch) {
        // Cero resultados en todo el catálogo
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

        const btnClear = document.getElementById('btn-clear-empty-search');
        if (btnClear) {
          btnClear.addEventListener('click', () => {
            clearSearch();
          });
        }
        const btnB = document.getElementById('btn-empty-burgers');
        if (btnB) {
          btnB.addEventListener('click', () => {
            clearSearch();
            selectCategory('burgers');
          });
        }
        const btnH = document.getElementById('btn-empty-hotdogs');
        if (btnH) {
          btnH.addEventListener('click', () => {
            clearSearch();
            selectCategory('hotdogs');
          });
        }
        return;
      }

      // Categoría vacía regular
      productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">No hay productos disponibles en esta categoría.</p>`;
      return;
    }

    // Renderizar tarjetas de productos coincidentes
    categoryFiltered.forEach((product, idx) => {
      const card = document.createElement('article');
      card.className = 'product-card scroll-fade-item';
      card.style.setProperty('--fade-idx', (idx % 6));
      
      const titleHtml = hasSearch ? highlightMatches(product.name, queryTrimmed) : product.name;
      const descHtml = hasSearch ? highlightMatches(product.description, queryTrimmed) : product.description;
      const includesHtml = product.includes 
        ? (hasSearch ? highlightMatches(product.includes, queryTrimmed) : product.includes)
        : '';

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
      ` : `<span class="product-price">${STORE_CONFIG.currency}${product.price}</span>`;

      card.innerHTML = `
        <div class="product-img-wrap">
          <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy" onerror="this.src='assets/images/hero_burger.jpg'">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
        </div>
        <div class="product-card-body">
          <div class="product-header">
            <h3 class="product-title">${titleHtml}</h3>
            ${priceDisplayHtml}
          </div>
          <p class="product-desc">${descHtml}</p>
          ${product.includes ? `
            <div class="product-includes">
              <i class="fa-solid fa-sparkles"></i> ${includesHtml}
            </div>
          ` : ''}
          <div class="product-actions">
            <button class="btn-add-cart" data-id="${product.id}">
              <i class="fa-solid fa-plus"></i> ${isHotDog ? 'Elegir' : 'Añadir'}
            </button>
            <button class="btn-customize" data-id="${product.id}" title="Personalizar ingredientes">
              <i class="fa-solid fa-sliders"></i>
            </button>
          </div>
        </div>
      `;
      productsGrid.appendChild(card);
    });

    // Attach listeners to new buttons
    productsGrid.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        quickAddToCart(id);
      });
    });

    productsGrid.querySelectorAll('.btn-customize').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openCustomizeModal(id);
      });
    });

    // Observar elementos para animación suave de entrada
    if (typeof observeScrollElements === 'function') {
      observeScrollElements(productsGrid);
    }
  }

  // =========================================================================
  // 2. GESTIÓN DEL CARRITO DE COMPRAS
  // =========================================================================
  function quickAddToCart(productId) {
    const product = MENU_DATA.find(p => p.id === productId);
    if (!product) return;

    // Si es un hot dog, abrimos el modal para elegir presentación (Con papas o Sin papas)
    if (product.category === 'hotdogs') {
      openCustomizeModal(productId);
      return;
    }

    // Buscar si ya existe el mismo item sin personalizaciones
    const existingIndex = cart.findIndex(item => 
      item.id === productId && 
      (!item.exclusions || item.exclusions.length === 0) && 
      (!item.extras || item.extras.length === 0) &&
      !item.note
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        cartItemId: Date.now() + Math.random().toString(36).substring(2, 6),
        id: product.id,
        name: product.name,
        unitPrice: product.price,
        totalPrice: product.price,
        quantity: 1,
        image: product.image,
        exclusions: [],
        extras: [],
        note: ''
      });
    }

    saveCart();
    updateCartUI();
    showToast(`✓ ¡${product.name} agregado al pedido!`);
  }

  function saveCart() {
    localStorage.setItem('restaurant_cart', JSON.stringify(cart));
  }

  function calculateCartTotals() {
    let subtotal = 0;
    let totalItems = 0;

    cart.forEach(item => {
      subtotal += item.totalPrice * item.quantity;
      totalItems += item.quantity;
    });

    return { subtotal, totalItems };
  }

  function updateCartUI() {
    const { subtotal, totalItems } = calculateCartTotals();

    // Actualizar contadores y badges
    cartBadgeCount.textContent = totalItems;
    cartBtnTotal.textContent = `${STORE_CONFIG.currency}${subtotal}`;
    cartItemCountLabel.textContent = `(${totalItems} ${totalItems === 1 ? 'item' : 'items'})`;
    
    if (mobileCartCount) mobileCartCount.textContent = totalItems;
    if (mobileCartTotal) mobileCartTotal.textContent = `${STORE_CONFIG.currency}${subtotal}`;
    
    summarySubtotal.textContent = `${STORE_CONFIG.currency}${subtotal}`;
    summaryTotal.textContent = `${STORE_CONFIG.currency}${subtotal}`;

    // Actualizar tiempo de espera según cantidad de items y estado
    updateWaitTimeUI();

    // Renderizar lista de items dentro del drawer
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon"><i class="fa-solid fa-burger"></i></div>
          <h4>Tu carrito está vacío</h4>
          <p>Agrega deliciosas hamburguesas o hot dogs para comenzar tu orden.</p>
          <a href="#menu" class="btn btn-primary" onclick="document.getElementById('cart-backdrop').classList.remove('active')">
            Ver el Menú
          </a>
        </div>
      `;
      checkoutTriggerBtn.disabled = true;
      checkoutTriggerBtn.style.opacity = '0.5';
      checkoutTriggerBtn.style.cursor = 'not-allowed';
    } else {
      checkoutTriggerBtn.disabled = false;
      checkoutTriggerBtn.style.opacity = '1';
      checkoutTriggerBtn.style.cursor = 'pointer';

      cartItemsContainer.innerHTML = cart.map(item => {
        const hasCustoms = (item.exclusions && item.exclusions.length > 0) || 
                            (item.extras && item.extras.length > 0) || 
                            item.note ||
                            item.friesChoice;

        let customsHtml = '';
        if (hasCustoms) {
          const friesTxt = item.friesChoice ? `<span style="color: var(--secondary); font-weight: 700;">${item.friesChoice}</span>` : '';
          const exclusionsTxt = item.exclusions && item.exclusions.length > 0 ? `⛔ ${item.exclusions.join(', ')}` : '';
          const extrasTxt = item.extras && item.extras.length > 0 ? `✨ Extras: ${item.extras.map(e => e.label).join(', ')}` : '';
          const noteTxt = item.note ? `📝 "${item.note}"` : '';
          customsHtml = `<div class="cart-item-notes">${[friesTxt, exclusionsTxt, extrasTxt, noteTxt].filter(Boolean).join('<br>')}</div>`;
        }

        return `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='assets/images/hero_burger.jpg'">
            <div class="cart-item-info">
              <h4 class="cart-item-title">${item.name}</h4>
              <div class="cart-item-price">${STORE_CONFIG.currency}${item.totalPrice} c/u</div>
              ${customsHtml}
              <div class="cart-item-controls">
                <div class="qty-stepper">
                  <button class="qty-btn" onclick="window.changeItemQty('${item.cartItemId}', -1)">-</button>
                  <span class="qty-value">${item.quantity}</span>
                  <button class="qty-btn" onclick="window.changeItemQty('${item.cartItemId}', 1)">+</button>
                </div>
                <button class="cart-item-remove" onclick="window.removeItemFromCart('${item.cartItemId}')" title="Eliminar">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Funciones globales expuestas para los botones de lista dinámica
  window.changeItemQty = function(cartItemId, delta) {
    const itemIndex = cart.findIndex(i => i.cartItemId === cartItemId);
    if (itemIndex > -1) {
      cart[itemIndex].quantity += delta;
      if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
      }
      saveCart();
      updateCartUI();
    }
  };

  window.removeItemFromCart = function(cartItemId) {
    cart = cart.filter(i => i.cartItemId !== cartItemId);
    saveCart();
    updateCartUI();
    showToast('Producto removido del pedido');
  };

  // =========================================================================
  // MOTOR DINÁMICO DE TIEMPO ESTIMADO DE ESPERA
  // =========================================================================
  function getTimeBasedState() {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    const timeFormatted = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    
    // Franjas horarias del restaurante:
    // Noche de cena (alta demanda / hora pico): 19:30 a 22:45
    // Almuerzo / Tarde: 13:00 a 15:30
    if ((hour >= 19 && (hour < 22 || (hour === 22 && min <= 45))) || (hour >= 13 && hour < 15)) {
      return {
        state: 'busy',
        statusText: 'Demanda Alta 🔥',
        queue: Math.max(5, 7 + simulatedJitter),
        progress: 82,
        minPrep: 26,
        maxPrep: 38,
        context: `Hora pico (${timeFormatted}): alta afluencia de pedidos en cocina`
      };
    } else if ((hour >= 18 && hour < 19) || (hour >= 22 && hour < 24) || (hour >= 12 && hour < 13)) {
      return {
        state: 'normal',
        statusText: 'Demanda Normal ⚡',
        queue: Math.max(2, 4 + simulatedJitter),
        progress: 52,
        minPrep: 18,
        maxPrep: 28,
        context: `Horario fluido (${timeFormatted}): cocina con ritmo constante`
      };
    } else {
      return {
        state: 'fast',
        statusText: 'Cocina Rápida 🟢',
        queue: Math.max(1, 2 + simulatedJitter),
        progress: 25,
        minPrep: 12,
        maxPrep: 20,
        context: `Tráfico ligero (${timeFormatted}): despacho rápido garantizado`
      };
    }
  }

  function calculateWaitTime() {
    const { totalItems } = calculateCartTotals();
    const activeMode = SIM_MODES[currentSimIndex];
    let stateData;

    if (activeMode.id === 'auto') {
      stateData = getTimeBasedState();
    } else {
      stateData = {
        state: activeMode.state,
        statusText: activeMode.statusText,
        queue: Math.max(1, activeMode.queue + simulatedJitter),
        progress: activeMode.progress,
        minPrep: activeMode.minPrep,
        maxPrep: activeMode.maxPrep,
        context: `Modo ${activeMode.label}: cocina al ${activeMode.progress}% de capacidad`
      };
    }

    // Impacto por volumen del carrito (+minutos adicionales)
    let itemExtraMinutes = 0;
    if (totalItems > 4) {
      itemExtraMinutes = Math.min(15, Math.floor((totalItems - 3) * 2));
    } else if (totalItems >= 3) {
      itemExtraMinutes = 3;
    }

    // Impacto por modalidad de entrega:
    // A Domicilio: empacado + asignación de repartidor + traslado (+12 a +18 min)
    // Para Recoger: directo de la parrilla a mostrador (+0 min)
    const isDelivery = (orderType === 'delivery');
    const deliveryExtraMin = isDelivery ? 12 : 0;
    const deliveryExtraMax = isDelivery ? 18 : 0;

    const finalMin = stateData.minPrep + itemExtraMinutes + deliveryExtraMin;
    const finalMax = stateData.maxPrep + itemExtraMinutes + deliveryExtraMax;
    const timeRangeStr = `${finalMin} - ${finalMax} min`;
    currentWaitRangeString = timeRangeStr;

    return {
      timeRangeStr,
      stateData,
      itemExtraMinutes,
      totalItems,
      isDelivery
    };
  }

  function updateWaitTimeUI() {
    const result = calculateWaitTime();
    const { timeRangeStr, stateData, itemExtraMinutes, totalItems, isDelivery } = result;

    if (waitTimeValue) waitTimeValue.textContent = timeRangeStr;
    if (summaryWaitTime) summaryWaitTime.textContent = timeRangeStr;
    if (checkoutWaitTime) checkoutWaitTime.textContent = timeRangeStr;

    if (waitStatusPill) {
      waitStatusPill.textContent = stateData.statusText;
      waitStatusPill.className = `wait-status-pill pill-${stateData.state}`;
    }

    if (cartWaitWidget) {
      cartWaitWidget.className = `cart-wait-widget state-${stateData.state}`;
    }

    if (waitPulseDot) {
      waitPulseDot.className = `wait-pulse-dot dot-${stateData.state}`;
    }

    if (waitIconBox) {
      waitIconBox.className = `wait-icon-box icon-${stateData.state}`;
    }

    if (waitQueueCounter) {
      waitQueueCounter.textContent = `${stateData.queue} órdenes en cocina`;
    }

    if (waitTypeIcon && waitTypeText) {
      if (isDelivery) {
        waitTypeIcon.className = 'fa-solid fa-motorcycle';
        waitTypeText.textContent = 'A Domicilio (+15m)';
      } else {
        waitTypeIcon.className = 'fa-solid fa-store';
        waitTypeText.textContent = 'Para Recoger (Directo)';
      }
    }

    if (waitProgressFill) {
      const volumeBonus = totalItems > 3 ? 8 : 0;
      const progressPercent = Math.min(96, Math.max(20, stateData.progress + volumeBonus));
      waitProgressFill.style.width = `${progressPercent}%`;
    }

    if (waitTimeContext) {
      waitTimeContext.innerHTML = `<i class="fa-regular fa-clock"></i> ${stateData.context}`;
    }

    if (waitItemImpact) {
      if (itemExtraMinutes > 0) {
        waitItemImpact.textContent = `+${itemExtraMinutes}m por ${totalItems} platillos`;
        waitItemImpact.style.display = 'inline';
      } else {
        waitItemImpact.textContent = 'Tiempo base óptimo';
      }
    }
  }

  // =========================================================================
  // 3. MODAL DE PERSONALIZACIÓN DE PLATILLOS
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
        <div>
          <h4 style="font-size: 1rem; font-weight: 700;">${product.name}</h4>
          <span style="color: var(--secondary); font-weight: 800; font-size: 0.9rem;">${displayBasePrice}</span>
        </div>
      </div>
    `;

    // Sección de selección de papas para Hot Dogs
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

    // Renderizar Exclusiones
    exclusionsOptionsContainer.innerHTML = CUSTOM_OPTIONS.exclusions.map(ex => `
      <label class="option-checkbox-label">
        <div class="option-left">
          <input type="checkbox" name="exclusion" value="${ex.label}" class="custom-exclusion-chk">
          <span>${ex.label}</span>
        </div>
      </label>
    `).join('');

    // Renderizar Extras con precio adicional
    extrasOptionsContainer.innerHTML = CUSTOM_OPTIONS.extras.map(extra => `
      <label class="option-checkbox-label">
        <div class="option-left">
          <input type="checkbox" name="extra" value="${extra.label}" data-price="${extra.price}" class="custom-extra-chk">
          <span>${extra.label}</span>
        </div>
        <span class="option-extra-price">+${STORE_CONFIG.currency}${extra.price}</span>
      </label>
    `).join('');

    customItemNoteInput.value = '';
    recalculateModalPrice();

    // Event listeners para recalcular precio en vivo
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

    cart.push({
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
    });

    saveCart();
    updateCartUI();
    customizeModalBackdrop.classList.remove('active');
    showToast(`✓ ¡${itemDisplayName} agregado a tu orden!`);
  }

  // =========================================================================
  // 4. CHECKOUT Y ENVÍO DEL PEDIDO A WHATSAPP
  // =========================================================================
  function handleCheckoutSubmit(e) {
    e.preventDefault();

    if (cart.length === 0) {
      showToast('⚠️ Tu carrito está vacío.');
      return;
    }

    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = orderType === 'delivery' ? customerAddressInput.value.trim() : 'Recoger en Sucursal / Para Llevar';
    const payment = paymentMethodSelect.value;
    const changeAmount = document.getElementById('payment-change').value.trim();
    const notes = document.getElementById('order-notes').value.trim();

    const { subtotal } = calculateCartTotals();

    // Construcción del Mensaje Estructurado para WhatsApp
    let message = `🍔 *¡NUEVO PEDIDO - ${STORE_CONFIG.name}!*\n`;
    message += `───────────────────────\n`;
    message += `👤 *Cliente:* ${name}\n`;
    message += `📱 *Teléfono:* ${phone}\n`;
    message += `📍 *Modalidad:* ${orderType === 'delivery' ? '🛵 Entrega a Domicilio' : '🥡 Para Recoger en Sucursal'}\n`;
    
    if (orderType === 'delivery') {
      message += `🏠 *Dirección:* ${address}\n`;
    }
    
    message += `💳 *Pago:* ${payment}`;
    if (payment === 'Efectivo (Cambio)' && changeAmount) {
      message += ` (Paga con: ${changeAmount})`;
    }
    message += `\n───────────────────────\n`;
    message += `📋 *RESUMEN DEL PEDIDO:*\n`;

    cart.forEach(item => {
      message += `\n• *${item.quantity}x ${item.name}* (${STORE_CONFIG.currency}${item.totalPrice * item.quantity})\n`;
      if (item.exclusions && item.exclusions.length > 0) {
        message += `   ↳ ⛔ _${item.exclusions.join(', ')}_\n`;
      }
      if (item.extras && item.extras.length > 0) {
        message += `   ↳ ✨ _Extras: ${item.extras.map(e => e.label).join(', ')}_\n`;
      }
      if (item.note) {
        message += `   ↳ 📝 _Nota: ${item.note}_\n`;
      }
    });

    message += `\n───────────────────────\n`;
    message += `💵 *Subtotal:* ${STORE_CONFIG.currency}${subtotal}\n`;
    if (orderType === 'delivery') {
      message += `🛵 *Envío:* Según zona de entrega\n`;
    }
    message += `🔥 *TOTAL ESTIMADO: ${STORE_CONFIG.currency}${subtotal} MXN*\n`;
    message += `⏱️ *Tiempo Estimado de Entrega:* ${currentWaitRangeString} (${orderType === 'delivery' ? 'A Domicilio 🛵' : 'Para Recoger en Sucursal 🥡'})\n`;
    message += `───────────────────────\n`;
    
    if (notes) {
      message += `📌 *Instrucción Especial:* ${notes}\n\n`;
    }

    message += `¡Hola! Me gustaría confirmar este pedido. Quedo atento a su confirmación y tiempo estimado de entrega. 🙌`;

    // Enviar a la API de WhatsApp
    const whatsappUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Abrir WhatsApp en nueva pestaña
    window.open(whatsappUrl, '_blank');

    // Cerrar modal y drawer
    checkoutModalBackdrop.classList.remove('active');
    cartBackdrop.classList.remove('active');

    // Limpiar carrito tras realizar pedido
    cart = [];
    localStorage.removeItem('restaurant_cart');
    updateCartUI();
    updateWaitTimeUI();

    showToast('🚀 ¡Pedido listo! Abriendo WhatsApp de ENTRE 3...');
  }

  // =========================================================================
  // 4.5. HORARIOS COMERCIALES DEL NEGOCIO
  // =========================================================================
  function checkStoreHours() {
    const now = new Date();
    const day = now.getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mié, 4: Jue, 5: Vie, 6: Sáb
    const hour = now.getHours();

    const isMonday = (day === 1);
    const isWithinHours = !isMonday && (hour >= 18 && hour < 24);

    return {
      isOpen: isWithinHours,
      isMonday
    };
  }

  function updateStoreHoursUI() {
    const store = checkStoreHours();

    // Actualizar indicador en Navbar
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

  // =========================================================================
  // 4.6. SISTEMA DE INTERRUPTOR DE TEMA (DARK / LIGHT MODE)
  // =========================================================================
  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 
           localStorage.getItem('bhd_theme') || 
           'dark';
  }

  function applyTheme(theme, notify = false) {
    const isLight = (theme === 'light');
    const targetTheme = isLight ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', targetTheme);
    try {
      localStorage.setItem('bhd_theme', targetTheme);
    } catch (e) {}

    // Actualizar botón de escritorio
    if (themeToggleBtn && themeToggleIcon) {
      if (isLight) {
        themeToggleBtn.setAttribute('aria-label', 'Cambiar a modo oscuro');
        themeToggleBtn.setAttribute('title', 'Cambiar a modo oscuro (Noche)');
        themeToggleIcon.className = 'fa-solid fa-moon';
        if (themeTooltip) themeTooltip.textContent = 'Modo Oscuro';
      } else {
        themeToggleBtn.setAttribute('aria-label', 'Cambiar a modo claro');
        themeToggleBtn.setAttribute('title', 'Cambiar a modo claro (Día)');
        themeToggleIcon.className = 'fa-solid fa-sun';
        if (themeTooltip) themeTooltip.textContent = 'Modo Claro';
      }
    }

    // Actualizar botón en el menú móvil
    if (mobileThemeToggleBtn) {
      if (isLight) {
        mobileThemeToggleBtn.setAttribute('aria-label', 'Cambiar a modo oscuro');
        if (mobileThemeIcon) mobileThemeIcon.className = 'fa-solid fa-moon';
        if (mobileThemeLabel) mobileThemeLabel.textContent = 'Cambiar a Modo Oscuro';
      } else {
        mobileThemeToggleBtn.setAttribute('aria-label', 'Cambiar a modo claro');
        if (mobileThemeIcon) mobileThemeIcon.className = 'fa-solid fa-sun';
        if (mobileThemeLabel) mobileThemeLabel.textContent = 'Cambiar a Modo Claro';
      }
    }

    if (notify) {
      showToast(isLight ? '☀️ Modo Claro activado' : '🌙 Modo Oscuro activado');
    }
  }

  function toggleTheme() {
    const current = getCurrentTheme();
    const nextTheme = (current === 'light') ? 'dark' : 'light';
    applyTheme(nextTheme, true);
  }

  // =========================================================================
  // 4.6. GALERÍA DE FOTOS Y LIGHTBOX INTERACTIVO
  // =========================================================================
  function initGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    const filterBtns = document.querySelectorAll('.gallery-filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    // Lightbox DOM
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
    const lightboxViewMenuBtn = document.getElementById('lightbox-view-menu-btn');

    if (!galleryGrid || galleryItems.length === 0) return;

    let currentItemIndex = 0;
    let visibleItems = Array.from(galleryItems);

    // Filtros de categoría de fotos
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filterVal = btn.getAttribute('data-filter');

        galleryItems.forEach(item => {
          const itemCat = item.getAttribute('data-category');
          if (filterVal === 'all' || itemCat === filterVal) {
            item.classList.remove('hidden-filter');
          } else {
            item.classList.add('hidden-filter');
          }
        });

        visibleItems = Array.from(galleryItems).filter(item => !item.classList.contains('hidden-filter'));
        visibleItems.forEach((item, idx) => {
          item.style.setProperty('--fade-idx', (idx % 6));
          item.classList.remove('is-visible');
        });
        if (typeof observeScrollElements === 'function') {
          observeScrollElements(galleryGrid);
        }
      });
    });

    // Abrir Lightbox
    function openLightbox(index) {
      if (visibleItems.length === 0) return;
      if (index < 0) index = visibleItems.length - 1;
      if (index >= visibleItems.length) index = 0;
      currentItemIndex = index;

      const item = visibleItems[currentItemIndex];
      if (!item) return;

      const img = item.querySelector('.gallery-img');
      const title = item.querySelector('.gallery-item-title');
      const desc = item.querySelector('.gallery-item-desc');
      const price = item.querySelector('.gallery-price');
      const category = item.querySelector('.gallery-category-pill');
      const productId = item.getAttribute('data-product-id');

      if (lightboxImg && img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || '';
      }
      if (lightboxTitle && title) lightboxTitle.textContent = title.textContent;
      if (lightboxDesc && desc) lightboxDesc.textContent = desc.textContent;
      if (lightboxPrice && price) lightboxPrice.textContent = price.textContent;
      if (lightboxCategory && category) lightboxCategory.textContent = category.textContent;

      if (lightboxOrderBtn) {
        lightboxOrderBtn.onclick = () => {
          closeLightbox();
          if (productId) {
            openCustomizeModal(productId);
          } else {
            const menuEl = document.getElementById('menu');
            if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth' });
          }
        };
      }

      if (lightboxViewMenuBtn) {
        lightboxViewMenuBtn.onclick = () => {
          closeLightbox();
          const menuEl = document.getElementById('menu');
          if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth' });
        };
      }

      if (lightbox) {
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeLightbox() {
      if (lightbox) {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    }

    // Click en cada tarjeta de galería
    galleryItems.forEach(item => {
      item.addEventListener('click', (e) => {
        visibleItems = Array.from(galleryItems).filter(el => !el.classList.contains('hidden-filter'));
        const idx = visibleItems.indexOf(item);
        if (idx !== -1) {
          openLightbox(idx);
        }
      });
    });

    // Controles del modal
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(currentItemIndex - 1);
      });
    }
    if (lightboxNext) {
      lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(currentItemIndex + 1);
      });
    }

    // Navegación con teclado
    window.addEventListener('keydown', (e) => {
      if (!lightbox || !lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openLightbox(currentItemIndex - 1);
      if (e.key === 'ArrowRight') openLightbox(currentItemIndex + 1);
    });
  }

  // =========================================================================
  // 4.7. EFECTOS SUAVES DE ENTRADA AL HACER SCROLL (FADE-IN INTERSECTION OBSERVER)
  // =========================================================================
  let scrollObserver = null;

  function initScrollAnimations() {
    const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion || !('IntersectionObserver' in window)) {
      document.querySelectorAll('.scroll-fade-item, .product-card, .gallery-item, .step-card').forEach(el => {
        el.classList.add('is-visible');
      });
      return;
    }

    if (scrollObserver) {
      scrollObserver.disconnect();
    }

    scrollObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.05
    });

    observeScrollElements(document);

    // Salvaguarda para asegurar que cualquier elemento visible en viewport quede activo
    setTimeout(() => {
      document.querySelectorAll('.scroll-fade-item:not(.is-visible), .product-card:not(.is-visible), .gallery-item:not(.is-visible), .step-card:not(.is-visible)').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100 && rect.bottom > -50) {
          el.classList.add('is-visible');
          if (scrollObserver) scrollObserver.unobserve(el);
        }
      });
    }, 450);
  }

  function observeScrollElements(container = document) {
    if (!scrollObserver) {
      container.querySelectorAll('.scroll-fade-item, .product-card, .gallery-item, .step-card').forEach(el => {
        el.classList.add('is-visible');
      });
      return;
    }

    const elements = container.querySelectorAll('.scroll-fade-item, .product-card, .gallery-item, .step-card');
    elements.forEach((el, index) => {
      if (!el.style.getPropertyValue('--fade-idx')) {
        el.style.setProperty('--fade-idx', (index % 6));
      }
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 30 && rect.bottom > 0) {
        // En viewport actual: pequeña pausa para el efecto escalonado inicial
        setTimeout(() => {
          el.classList.add('is-visible');
        }, (index % 6) * 55);
      } else {
        scrollObserver.observe(el);
      }
    });
  }

  // =========================================================================
  // 5. EVENT LISTENERS GENERALES
  // =========================================================================
  function setupEventListeners() {
    // Filtros de categoría del menú
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        selectCategory(cat);
      });
    });

    // Barra de búsqueda en tiempo real
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

    // Chips de sugerencias rápidas de búsqueda
    quickTagChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const queryTerm = chip.getAttribute('data-search') || '';
        if (normalizeSearchText(searchQuery) === normalizeSearchText(queryTerm)) {
          // Si ya está activo el término, limpiar búsqueda
          clearSearch();
        } else {
          // Activar término sugerido
          searchQuery = queryTerm;
          if (menuSearchInput) {
            menuSearchInput.value = queryTerm;
          }
          syncQuickChipsState();
          renderProducts();

          // Scroll sutil al menú si el usuario está muy desplazado
          const menuEl = document.getElementById('menu');
          if (menuEl) {
            const rect = menuEl.getBoundingClientRect();
            if (rect.top < -50 || rect.top > 400) {
              menuEl.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      });
    });

    // Abrir/Cerrar Carrito Drawer
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

    // Cerrar al hacer clic en el fondo oscuro
    cartBackdrop.addEventListener('click', (e) => {
      if (e.target === cartBackdrop) {
        cartBackdrop.classList.remove('active');
      }
    });

    // Selector de Tipo de Pedido (Domicilio vs Sucursal)
    typeDeliveryBtn.addEventListener('click', () => {
      orderType = 'delivery';
      typeDeliveryBtn.classList.add('active');
      typePickupBtn.classList.remove('active');
      document.getElementById('delivery-cost-row').style.display = 'flex';
      addressFieldGroup.style.display = 'block';
      customerAddressInput.required = true;
      updateWaitTimeUI();
    });

    typePickupBtn.addEventListener('click', () => {
      orderType = 'pickup';
      typePickupBtn.classList.add('active');
      typeDeliveryBtn.classList.remove('active');
      document.getElementById('delivery-cost-row').style.display = 'none';
      addressFieldGroup.style.display = 'none';
      customerAddressInput.required = false;
      updateWaitTimeUI();
    });

    // Toggle interactivo para simular carga en cocina
    if (waitModeToggleBtn) {
      waitModeToggleBtn.addEventListener('click', () => {
        currentSimIndex = (currentSimIndex + 1) % SIM_MODES.length;
        updateWaitTimeUI();
        showToast(`Carga de cocina: ${SIM_MODES[currentSimIndex].label}`);
      });
    }

    // Trigger de Checkout
    checkoutTriggerBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Agrega productos al carrito primero.');
        return;
      }
      checkoutModalBackdrop.classList.add('active');
    });

    checkoutModalClose.addEventListener('click', () => {
      checkoutModalBackdrop.classList.remove('active');
    });

    checkoutModalBackdrop.addEventListener('click', (e) => {
      if (e.target === checkoutModalBackdrop) {
        checkoutModalBackdrop.classList.remove('active');
      }
    });

    // Modales de personalización
    customizeModalClose.addEventListener('click', () => {
      customizeModalBackdrop.classList.remove('active');
    });

    customizeModalBackdrop.addEventListener('click', (e) => {
      if (e.target === customizeModalBackdrop) {
        customizeModalBackdrop.classList.remove('active');
      }
    });

    confirmCustomizeAddBtn.addEventListener('click', handleConfirmCustomize);

    // Formulario de Checkout
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);

    // Método de pago selector
    paymentMethodSelect.addEventListener('change', () => {
      if (paymentMethodSelect.value === 'Efectivo (Cambio)') {
        changeFieldGroup.style.display = 'block';
      } else {
        changeFieldGroup.style.display = 'none';
      }
    });

    // Botón directo de WhatsApp en el Hero
    if (heroWhatsappBtn) {
      heroWhatsappBtn.addEventListener('click', () => {
        const directMsg = `¡Hola! Me gustaría hacer un pedido en ${STORE_CONFIG.name}. ¿Me podrían compartir el menú o promociones del día? 🍔`;
        window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(directMsg)}`, '_blank');
      });
    }

    // Toggle de menú móvil
    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
      });

      // Cerrar al hacer clic en un link
      navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
        });
      });
    }

    // Scroll Navbar Effect
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // =========================================================================
    // EVENT LISTENERS DEL INTERRUPTOR DE TEMA (DARK / LIGHT MODE)
    // =========================================================================
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }

    if (mobileThemeToggleBtn) {
      mobileThemeToggleBtn.addEventListener('click', () => {
        toggleTheme();
        if (navLinks) {
          navLinks.classList.remove('open');
        }
      });
    }
  }

  // =========================================================================
  // 6. UTILIDADES
  // =========================================================================
  function showToast(message) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // Ejecutar inicialización
  init();
});
