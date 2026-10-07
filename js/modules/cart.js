/**
 * CART.JS - Lógica del Carrito de Compras
 */

import { STORE_CONFIG, MENU_DATA } from '../products.js';

let cart = JSON.parse(localStorage.getItem('restaurant_cart')) || [];

export function getCart() {
  return cart;
}

export function setCart(newCart) {
  cart = newCart;
  saveCart();
}

export function clearCart() {
  cart = [];
  saveCart();
}

export function quickAddToCart(productId) {
  const product = MENU_DATA.find(p => p.id === productId);
  if (!product) return { success: false, error: 'Product not found' };

  // Si es un hot dog, necesitamos abrir el modal de personalización (está en app.js/main.js)
  if (product.category === 'hotdogs') {
    return { success: false, needsCustomization: true };
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
  return { success: true, product };
}

export function saveCart() {
  localStorage.setItem('restaurant_cart', JSON.stringify(cart));
}

export function calculateCartTotals() {
  let subtotal = 0;
  let totalItems = 0;

  cart.forEach(item => {
    subtotal += item.totalPrice * item.quantity;
    totalItems += item.quantity;
  });

  return { subtotal, totalItems };
}

export function updateCartUI() {
  const { subtotal, totalItems } = calculateCartTotals();

  const cartBadgeCount = document.getElementById('cart-badge-count');
  const cartBtnTotal = document.getElementById('cart-btn-total');
  const cartItemCountLabel = document.getElementById('cart-item-count-label');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const summarySubtotal = document.getElementById('summary-subtotal');
  const summaryTotal = document.getElementById('summary-total');
  const checkoutTriggerBtn = document.getElementById('checkout-trigger-btn');
  const mobileCartCount = document.getElementById('mobile-cart-count');
  const mobileCartTotal = document.getElementById('mobile-cart-total');

  if (cartBadgeCount) cartBadgeCount.textContent = totalItems;
  if (cartBtnTotal) cartBtnTotal.textContent = `${STORE_CONFIG.currency}${subtotal}`;
  if (cartItemCountLabel) cartItemCountLabel.textContent = `(${totalItems} ${totalItems === 1 ? 'item' : 'items'})`;
  
  if (mobileCartCount) mobileCartCount.textContent = totalItems;
  if (mobileCartTotal) mobileCartTotal.textContent = `${STORE_CONFIG.currency}${subtotal}`;
  
  if (summarySubtotal) summarySubtotal.textContent = `${STORE_CONFIG.currency}${subtotal}`;
  if (summaryTotal) summaryTotal.textContent = `${STORE_CONFIG.currency}${subtotal}`;

  if (!cartItemsContainer) return;

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
    if (checkoutTriggerBtn) {
      checkoutTriggerBtn.disabled = true;
      checkoutTriggerBtn.style.opacity = '0.5';
      checkoutTriggerBtn.style.cursor = 'not-allowed';
    }
  } else {
    if (checkoutTriggerBtn) {
      checkoutTriggerBtn.disabled = false;
      checkoutTriggerBtn.style.opacity = '1';
      checkoutTriggerBtn.style.cursor = 'pointer';
    }

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

export function changeItemQty(cartItemId, delta) {
  const itemIndex = cart.findIndex(i => i.cartItemId === cartItemId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += delta;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
    saveCart();
    updateCartUI();
  }
}

export function removeItemFromCart(cartItemId) {
  cart = cart.filter(i => i.cartItemId !== cartItemId);
  saveCart();
  updateCartUI();
  if (typeof window.showToast === 'function') {
    window.showToast('Producto removido del pedido');
  }
}
