/* ========================================
   MAISON CLOTH — Lógica de la tienda
   app.js
   ======================================== */

// ─── Estado global ───────────────────────
let allProducts = [];   // todos los productos cargados desde la API
let cart = [];          // productos en el carrito

// ─── Etiquetas de categoría en español ───
const CAT_LABELS = {
  'all':              'Toda la Colección',
  "women's clothing": 'Colección Mujer',
  "men's clothing":   'Colección Hombre',
  'jewelery':         'Joyería & Accesorios',
  'electronics':      'Accesorios Tech',
};

// ─── Referencias al DOM ──────────────────
const navEl        = document.getElementById('nav');
const productArea  = document.getElementById('product-area');
const sectionTitle = document.getElementById('section-title');
const countEl      = document.getElementById('count');
const cartInfo     = document.getElementById('cart-info');
const cartBtn      = document.getElementById('cart-btn');
const modalArea    = document.getElementById('modal-area');
const toastArea    = document.getElementById('toast-area');

// ========================================
// CARGA DE PRODUCTOS (FakeStoreAPI)
// ========================================

async function loadProducts() {
  showLoading();
  try {
    const response = await fetch('https://fakestoreapi.com/products');
    if (!response.ok) throw new Error('Error de red: ' + response.status);
    allProducts = await response.json();
    renderProducts(allProducts);
  } catch (error) {
    console.error('Error cargando productos:', error);
    showError();
  }
}

// ========================================
// RENDERIZADO DE PRODUCTOS
// ========================================

function renderProducts(products) {
  countEl.textContent = products.length + ' piezas';

  if (products.length === 0) {
    productArea.innerHTML = `
      <div class="loading">
        <div class="loading-text">Sin productos en esta categoría</div>
      </div>`;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'grid';

  products.forEach(product => {
    const card = createCard(product);
    grid.appendChild(card);
  });

  productArea.innerHTML = '';
  productArea.appendChild(grid);
}

function createCard(product) {
  const card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', product.title);

  card.innerHTML = `
    <img
      class="card-img"
      src="${product.image}"
      alt="${escapeHtml(product.title)}"
      loading="lazy"
    />
    <div class="card-body">
      <div class="card-name">${escapeHtml(product.title)}</div>
      <div class="card-meta">
        <div class="card-price">$${product.price.toFixed(2)}</div>
        <div class="card-rating">
          <span class="stars">★</span>${product.rating.rate}
          <span style="opacity:.5">(${product.rating.count})</span>
        </div>
      </div>
    </div>
  `;

  card.addEventListener('click', () => openModal(product));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') openModal(product);
  });

  return card;
}

// ========================================
// ESTADOS ALTERNATIVOS (loading / error)
// ========================================

function showLoading() {
  productArea.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <div class="loading-text">Cargando colección</div>
    </div>`;
}

function showError() {
  productArea.innerHTML = `
    <div class="loading">
      <div class="loading-text">Error al cargar. Recargá la página.</div>
    </div>`;
}

// ========================================
// MODAL DE DETALLE DEL PRODUCTO
// ========================================

function openModal(product) {
  const catLabel = CAT_LABELS[product.category] || product.category;
  const starsHtml = renderStars(product.rating.rate);

  modalArea.innerHTML = `
    <div class="modal-bg" id="modal-bg" role="dialog" aria-modal="true" aria-label="${escapeHtml(product.title)}">
      <div class="modal">
        <img
          class="modal-img"
          src="${product.image}"
          alt="${escapeHtml(product.title)}"
        />
        <div class="modal-body">
          <div class="badge">${escapeHtml(catLabel)}</div>
          <div class="modal-name">${escapeHtml(product.title)}</div>
          <div class="modal-price">$${product.price.toFixed(2)}</div>
          <div class="modal-rating">
            ${starsHtml}
            &nbsp;${product.rating.rate} · ${product.rating.count} reseñas
          </div>
          <div class="modal-desc">${escapeHtml(product.description)}</div>
          <div class="modal-actions">
            <button class="btn-primary" id="btn-add-cart">Agregar al carrito</button>
            <button class="btn-close" id="btn-close-modal" aria-label="Cerrar">✕</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Eventos del modal
  document.getElementById('btn-add-cart').addEventListener('click', () => addToCart(product));
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('modal-bg').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Cerrar con Escape
  document.addEventListener('keydown', handleEscapeKey);
}

function closeModal() {
  modalArea.innerHTML = '';
  document.removeEventListener('keydown', handleEscapeKey);
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') closeModal();
}

// Genera estrellas según el rating
function renderStars(rating) {
  const full  = Math.round(rating);
  const empty = 5 - full;
  return (
    '<span class="stars">' +
    '★'.repeat(full) +
    '<span style="opacity:.3">' + '★'.repeat(empty) + '</span>' +
    '</span>'
  );
}

// ========================================
// CARRITO
// ========================================

function addToCart(product) {
  cart.push(product);
  updateCartBar();
  closeModal();
  showToast(`"${product.title.slice(0, 28)}…" agregado`);
}

function updateCartBar() {
  if (cart.length === 0) {
    cartInfo.textContent = 'Carrito vacío';
    return;
  }
  const total = cart.reduce((sum, p) => sum + p.price, 0);
  const qty   = cart.length;
  cartInfo.textContent = `${qty} ${qty === 1 ? 'pieza' : 'piezas'} · $${total.toFixed(2)}`;
}

// Botón "Ver carrito" → muestra resumen en consola / alert simple
cartBtn.addEventListener('click', () => {
  if (cart.length === 0) {
    showToast('Tu carrito está vacío');
    return;
  }

  const lines = cart.map(p => `• ${p.title}  $${p.price.toFixed(2)}`);
  const total = cart.reduce((s, p) => s + p.price, 0);
  lines.push('', `TOTAL: $${total.toFixed(2)}`);

  alert('🛍 Mi carrito:\n\n' + lines.join('\n'));
});

// ========================================
// TOAST / NOTIFICACIÓN
// ========================================

let toastTimeout = null;

function showToast(message) {
  // Eliminar toast anterior si existe
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastArea.innerHTML = '';
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastArea.appendChild(toast);

  // Forzar reflow para que la transición funcione
  void toast.offsetWidth;
  toast.classList.add('visible');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => {
      toastArea.innerHTML = '';
      toastTimeout = null;
    }, 300);
  }, 2200);
}

// ========================================
// FILTRO POR CATEGORÍA (nav)
// ========================================

navEl.addEventListener('click', e => {
  const btn = e.target.closest('.nav-btn');
  if (!btn) return;

  // Actualizar botón activo
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const cat = btn.dataset.cat;
  sectionTitle.textContent = CAT_LABELS[cat] || cat;

  const filtered = cat === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === cat);

  renderProducts(filtered);
});

// ========================================
// UTILIDADES
// ========================================

// Previene inyección de HTML en datos de la API
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ========================================
// INICIO
// ========================================

loadProducts();