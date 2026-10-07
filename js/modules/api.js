/**
 * API.JS - Integración con Servicios Externos (WhatsApp)
 */

import { STORE_CONFIG } from '../products.js';
import { getCart, calculateCartTotals, clearCart, updateCartUI } from './cart.js';

export function handleCheckoutSubmit(e) {
  e.preventDefault();

  const cart = getCart();
  if (cart.length === 0) {
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ Tu carrito está vacío.');
    }
    return;
  }

  const name = document.getElementById('customer-name').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  const deliveryBtn = document.getElementById('type-delivery-btn');
  const orderType = (deliveryBtn && deliveryBtn.classList.contains('active')) ? 'delivery' : 'pickup';
  const address = orderType === 'delivery' ? document.getElementById('customer-address').value.trim() : 'Recoger en Sucursal / Para Llevar';
  const payment = document.getElementById('payment-method').value;
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
  message += `📍 *Entrega:* ${orderType === 'delivery' ? 'A Domicilio 🛵' : 'Para Recoger en Sucursal 🥡'}\n`;
  message += `───────────────────────\n`;
  
  if (notes) {
    message += `📌 *Instrucción Especial:* ${notes}\n\n`;
  }

  message += `¡Hola! Me gustaría confirmar este pedido. Quedo atento a su confirmación. 🙌`;

  // Enviar a la API de WhatsApp
  const whatsappUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  
  window.open(whatsappUrl, '_blank');

  // Cerrar modal de checkout y drawer del carrito
  const checkoutBackdrop = document.getElementById('checkout-modal-backdrop');
  const cartBackdrop = document.getElementById('cart-backdrop');
  if (checkoutBackdrop) checkoutBackdrop.classList.remove('active');
  if (cartBackdrop) cartBackdrop.classList.remove('active');

  // Vaciar el carrito (en memoria y en localStorage) y refrescar la interfaz
  clearCart();
  updateCartUI();

  if (typeof window.showToast === 'function') {
    window.showToast('🚀 ¡Pedido listo! Abriendo WhatsApp de ENTRE 3...');
  }
}
