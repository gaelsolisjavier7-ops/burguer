/**
 * APP.JS - LÓGICA PRINCIPAL DEL SITIO DE COMERCIO ELECTRÓNICO
 * Funcionalidad: Renderizado de menú, Carrito interactivo,
 * Personalización de platillos y Generador de pedidos a WhatsApp.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado del Carrito y Aplicación
  let cart = JSON.parse(localStorage.getItem('restaurant_cart')) || [];
  let currentFilter = 'all';
  let orderType = 'delivery'; // 'delivery' o 'pickup'
  let currentProductToCustomize = null;

  // Elementos DOM Principales
  const productsGrid = document.getElementById('products-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
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

  // =========================================================================
  // 1. INICIALIZACIÓN Y RENDERIZADO DEL MENÚ
  // =========================================================================
  function init() {
    renderProducts();
    updateCartUI();
    setupEventListeners();
  }

  function renderProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    const filtered = currentFilter === 'all' 
      ? MENU_DATA 
      : MENU_DATA.filter(item => item.category === currentFilter);

    if (filtered.length === 0) {
      productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No hay productos disponibles en esta categoría.</p>`;
      return;
    }

    filtered.forEach(product => {
      const card = document.createElement('article');
      card.className = 'product-card';
      
      card.innerHTML = `
        <div class="product-img-wrap">
          <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy" onerror="this.src='assets/images/hero_burger.jpg'">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
        </div>
        <div class="product-card-body">
          <div class="product-header">
            <h3 class="product-title">${product.name}</h3>
            <span class="product-price">${STORE_CONFIG.currency}${product.price}</span>
          </div>
          <p class="product-desc">${product.description}</p>
          ${product.includes ? `
            <div class="product-includes">
              <i class="fa-solid fa-sparkles"></i> ${product.includes}
            </div>
          ` : ''}
          <div class="product-actions">
            <button class="btn-add-cart" data-id="${product.id}">
              <i class="fa-solid fa-plus"></i> Añadir
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
  }

  // =========================================================================
  // 2. GESTIÓN DEL CARRITO DE COMPRAS
  // =========================================================================
  function quickAddToCart(productId) {
    const product = MENU_DATA.find(p => p.id === productId);
    if (!product) return;

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
                            item.note;

        let customsHtml = '';
        if (hasCustoms) {
          const exclusionsTxt = item.exclusions.length > 0 ? `⛔ ${item.exclusions.join(', ')}` : '';
          const extrasTxt = item.extras.length > 0 ? `✨ Extras: ${item.extras.map(e => e.label).join(', ')}` : '';
          const noteTxt = item.note ? `📝 "${item.note}"` : '';
          customsHtml = `<div class="cart-item-notes">${[exclusionsTxt, extrasTxt, noteTxt].filter(Boolean).join('<br>')}</div>`;
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
  // 3. MODAL DE PERSONALIZACIÓN DE PLATILLOS
  // =========================================================================
  function openCustomizeModal(productId) {
    const product = MENU_DATA.find(p => p.id === productId);
    if (!product) return;

    currentProductToCustomize = product;
    modalProductTitle.textContent = `Personalizar: ${product.name}`;

    customizeProductDetails.innerHTML = `
      <div style="display: flex; gap: 14px; align-items: center; background: var(--bg-surface); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
        <img src="${product.image}" style="width: 60px; height: 60px; border-radius: var(--radius-sm); object-fit: cover;" onerror="this.src='assets/images/hero_burger.jpg'">
        <div>
          <h4 style="font-size: 1rem; font-weight: 700;">${product.name}</h4>
          <span style="color: var(--secondary); font-weight: 800;">${STORE_CONFIG.currency}${product.price}</span>
        </div>
      </div>
    `;

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
    const checkedExtras = customizeModalBackdrop.querySelectorAll('.custom-extra-chk:checked');
    
    checkedExtras.forEach(chk => {
      base += parseFloat(chk.getAttribute('data-price') || 0);
    });

    modalCalculatedPrice.textContent = `${STORE_CONFIG.currency}${base}`;
  }

  function handleConfirmCustomize() {
    if (!currentProductToCustomize) return;

    const exclusions = Array.from(customizeModalBackdrop.querySelectorAll('.custom-exclusion-chk:checked')).map(c => c.value);
    const extras = Array.from(customizeModalBackdrop.querySelectorAll('.custom-extra-chk:checked')).map(c => ({
      label: c.value,
      price: parseFloat(c.getAttribute('data-price') || 0)
    }));
    const note = customItemNoteInput.value.trim();

    let extraPriceTotal = extras.reduce((sum, e) => sum + e.price, 0);
    let finalItemUnitPrice = currentProductToCustomize.price + extraPriceTotal;

    cart.push({
      cartItemId: Date.now() + Math.random().toString(36).substring(2, 6),
      id: currentProductToCustomize.id,
      name: currentProductToCustomize.name,
      unitPrice: currentProductToCustomize.price,
      totalPrice: finalItemUnitPrice,
      quantity: 1,
      image: currentProductToCustomize.image,
      exclusions: exclusions,
      extras: extras,
      note: note
    });

    saveCart();
    updateCartUI();
    customizeModalBackdrop.classList.remove('active');
    showToast(`✓ ¡${currentProductToCustomize.name} personalizado agregado!`);
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
    
    showToast('🚀 ¡Redirigiendo a WhatsApp para completar pedido!');
  }

  // =========================================================================
  // 5. EVENT LISTENERS GENERALES
  // =========================================================================
  function setupEventListeners() {
    // Filtros de categoría del menú
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-category');
        renderProducts();
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
    });

    typePickupBtn.addEventListener('click', () => {
      orderType = 'pickup';
      typePickupBtn.classList.add('active');
      typeDeliveryBtn.classList.remove('active');
      document.getElementById('delivery-cost-row').style.display = 'none';
      addressFieldGroup.style.display = 'none';
      customerAddressInput.required = false;
    });

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
