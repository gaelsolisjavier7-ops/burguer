/**
 * API.JS - Integración con Servicios Externos (WhatsApp)
 */

import { STORE_CONFIG } from '../products.js';
import { getCart, calculateCartTotals, clearCart, updateCartUI } from './cart.js';

/**
 * Guarda el pedido en Firestore para el panel de finanzas.
 * Se invoca en segundo plano (sin await) desde el checkout, para no retrasar
 * ni bloquear la apertura de WhatsApp.
 */
async function guardarPedidoEnFirestore({ name, phone, address, orderType, payment, changeAmount, notes, cart, subtotal }) {
  const { initializeApp, getApps, getApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
  const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

  const firebaseConfig = {
    apiKey: "AIzaSyCYmj4iaPU-Ku6edzajvJXJtnX0qSSqTO4",
    authDomain: "entre3-finanzas.firebaseapp.com",
    projectId: "entre3-finanzas",
    storageBucket: "entre3-finanzas.firebasestorage.app",
    messagingSenderId: "352611680426",
    appId: "1:352611680426:web:1c3e851d14f2d542da10d3"
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app);

  await addDoc(collection(db, 'pedidos'), {
    fecha: serverTimestamp(),
    cliente: { nombre: name, telefono: phone, direccion: address },
    modalidad: orderType,
    metodo_pago: payment,
    cambio: changeAmount || null,
    notas: notes || null,
    productos: cart.map(i => ({
      nombre: i.name,
      cantidad: i.quantity,
      precio_unitario: i.totalPrice,
      subtotal: i.totalPrice * i.quantity,
      extras: i.extras || [],
      exclusiones: i.exclusions || [],
      nota: i.note || null
    })),
    subtotal: subtotal,
    total: subtotal,
    estado: 'Pendiente',
    origen: 'web'
  });
}

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
  
  // 1. Abrir WhatsApp INMEDIATAMENTE (síncrono, preserva user activation)
  window.open(whatsappUrl, '_blank');

  // 2. Guardar en Firestore en background (sin bloquear)
  //    Se pasa una COPIA PROFUNDA del carrito (tomada aquí, antes de clearCart())
  //    para que el guardado no dependa de la semántica de clearCart().
  guardarPedidoEnFirestore({
    name, phone, address, orderType, payment, changeAmount, notes,
    cart: JSON.parse(JSON.stringify(cart)),
    subtotal
  }).catch(err => console.warn('⚠️ No se pudo guardar el pedido en Firestore:', err));

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
