import { products, imageUrl, money } from './products.js';

const grid = document.querySelector('#product-grid');
const cartStorageKey = 'atelier-maison-cart';
const storedCart = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
const cart = new Map(storedCart.map(({ id, quantity }) => [id, { product: products.find(item => item.id === id), quantity }]).filter(([, entry]) => entry.product));
const favorites = new Set();
let activeCategory = 'All pieces';
let searchTerm = '';
let toastTimer;

function visibleProducts() {
  let list = products.filter(product => (activeCategory === 'All pieces' || product.category === activeCategory) && `${product.name} ${product.category} ${product.type} ${product.color}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const sort = document.querySelector('#sort-select').value;
  if (sort === 'price-low') list = list.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') list = list.sort((a, b) => b.price - a.price);
  if (sort === 'name') list = list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function renderProducts() {
  const list = visibleProducts();
  grid.innerHTML = list.map((product, index) => `
    <article class="product-card" style="--card-index:${index}">
      <div class="product-image-wrap">
        <button class="product-image-button" data-view="${product.id}" aria-label="View ${product.name}"><img src="${imageUrl(product.image)}" alt="${product.name}" loading="lazy"><span class="quick-view">Quick view <span>↗</span></span></button>
        ${product.badge ? `<span class="product-badge ${product.badgeTone}">${product.badge}</span>` : ''}
        <button class="favorite-button ${favorites.has(product.id) ? 'is-saved' : ''}" data-favorite="${product.id}" aria-label="${favorites.has(product.id) ? 'Remove from' : 'Add to'} wishlist">${favorites.has(product.id) ? '♥' : '♡'}</button>
        <button class="quick-add" data-add="${product.id}" aria-label="Add ${product.name} to bag">+</button>
      </div>
      <div class="product-info"><div><p class="product-category">${product.type}</p><h3><button data-view="${product.id}">${product.name}</button></h3></div><p class="product-price">${money(product.price)}</p></div>
    </article>`).join('');
  document.querySelector('#empty-state').hidden = list.length > 0;
  document.querySelector('#active-filter').hidden = !searchTerm;
  document.querySelector('#active-filter').innerHTML = searchTerm ? `Showing results for <strong>“${escapeHtml(searchTerm)}”</strong><button id="clear-search">Clear ×</button>` : '';
  document.querySelector('[data-category="All pieces"] span').textContent = products.length.toString().padStart(2, '0');
  const hint = document.querySelector('#search-hint');
  hint.textContent = searchTerm ? `${list.length} ${list.length === 1 ? 'piece' : 'pieces'} found · press Enter to view` : 'Search the collection';
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function setCategory(category) {
  activeCategory = category;
  document.querySelectorAll('.category-tab').forEach(tab => {
    const active = tab.dataset.category === category;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  renderProducts();
}

function addToCart(id, amount = 1) {
  const product = products.find(item => item.id === id);
  const existing = cart.get(id);
  cart.set(id, { product, quantity: (existing?.quantity ?? 0) + amount });
  updateCart();
  showToast(`${product.name} added to your bag`);
}

function updateCart() {
  localStorage.setItem(cartStorageKey, JSON.stringify([...cart.values()].map(({ product, quantity }) => ({ id: product.id, quantity }))));
  const count = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = [...cart.values()].reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  document.querySelector('#cart-count').textContent = count;
  document.querySelector('#drawer-count').textContent = `(${count})`;
  document.querySelector('#subtotal').textContent = money(subtotal);
  document.querySelector('#cart-empty').hidden = count > 0;
  document.querySelector('#cart-footer').hidden = count === 0;
  document.querySelector('#cart-items').innerHTML = [...cart.values()].map(({ product, quantity }) => `
    <article class="cart-item"><img src="${imageUrl(product.image, 300)}" alt=""><div class="cart-item-copy"><p class="product-category">${product.type}</p><h3>${product.name}</h3><span>${money(product.price)}</span><div class="quantity-control"><button data-quantity="${product.id}" data-change="-1" aria-label="Remove one ${product.name}">−</button><span>${quantity}</span><button data-quantity="${product.id}" data-change="1" aria-label="Add one ${product.name}">+</button></div></div><button class="remove-item" data-remove="${product.id}" aria-label="Remove ${product.name}">×</button></article>`).join('');
  const remaining = Math.max(0, 150 - subtotal);
  document.querySelector('#delivery-copy').textContent = remaining ? `${money(remaining)} away from complimentary delivery.` : 'You have complimentary delivery.';
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function openCart() {
  document.querySelector('#overlay').classList.add('visible');
  document.querySelector('#cart-drawer').classList.add('open');
  document.querySelector('#cart-drawer').setAttribute('aria-hidden', 'false');
  document.body.classList.add('locked');
}

function closePanels() {
  document.querySelector('#overlay').classList.remove('visible');
  document.querySelector('#cart-drawer').classList.remove('open');
  document.querySelector('#cart-drawer').setAttribute('aria-hidden', 'true');
  document.querySelector('#product-modal').classList.remove('open');
  document.querySelector('#product-modal').setAttribute('aria-hidden', 'true');
  document.body.classList.remove('locked');
}

function openProduct(id) {
  window.location.href = `/product.html?id=${encodeURIComponent(id)}`;
}

grid.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  const view = event.target.closest('[data-view]');
  const favorite = event.target.closest('[data-favorite]');
  if (add) addToCart(add.dataset.add);
  if (view) openProduct(view.dataset.view);
  if (favorite) {
    const id = favorite.dataset.favorite;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    renderProducts();
    showToast(favorites.has(id) ? 'Saved to your wishlist' : 'Removed from your wishlist');
  }
});

document.querySelector('#modal-content').addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  if (add) { addToCart(add.dataset.add); closePanels(); }
});
document.querySelectorAll('.category-tab').forEach(tab => tab.addEventListener('click', () => setCategory(tab.dataset.category)));
document.querySelectorAll('[data-nav-category]').forEach(link => link.addEventListener('click', () => setCategory(link.dataset.navCategory)));
document.querySelector('#sort-select').addEventListener('change', renderProducts);
document.querySelector('#search-toggle').addEventListener('click', () => {
  const panel = document.querySelector('#search-panel');
  panel.classList.toggle('open');
  panel.setAttribute('aria-hidden', String(!panel.classList.contains('open')));
  if (panel.classList.contains('open')) document.querySelector('#search-input').focus();
});
document.querySelector('#search-close').addEventListener('click', () => {
  const panel = document.querySelector('#search-panel'); panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true');
});
document.querySelector('#search-input').addEventListener('input', event => { searchTerm = event.target.value.trim(); renderProducts(); });
document.querySelector('#search-form').addEventListener('submit', event => {
  event.preventDefault();
  const panel = document.querySelector('#search-panel');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  document.querySelector('#shop').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.querySelector('#active-filter').addEventListener('click', event => {
  if (event.target.closest('#clear-search')) { searchTerm = ''; document.querySelector('#search-input').value = ''; renderProducts(); }
});
document.querySelector('#view-all').addEventListener('click', () => setCategory('All pieces'));
document.querySelector('#mobile-view-all').addEventListener('click', () => setCategory('All pieces'));
document.querySelector('#cart-open').addEventListener('click', openCart);
document.querySelector('#cart-close').addEventListener('click', closePanels);
document.querySelector('#modal-close').addEventListener('click', closePanels);
document.querySelector('#overlay').addEventListener('click', closePanels);
document.querySelector('#keep-browsing').addEventListener('click', closePanels);
document.querySelector('#cart-items').addEventListener('click', event => {
  const quantity = event.target.closest('[data-quantity]');
  const remove = event.target.closest('[data-remove]');
  if (quantity) {
    const entry = cart.get(quantity.dataset.quantity);
    const next = entry.quantity + Number(quantity.dataset.change);
    next > 0 ? cart.set(quantity.dataset.quantity, { ...entry, quantity: next }) : cart.delete(quantity.dataset.quantity);
    updateCart();
  }
  if (remove) { cart.delete(remove.dataset.remove); updateCart(); }
});
document.querySelector('#checkout-button').addEventListener('click', () => { window.location.href = '/checkout.html'; });
document.querySelector('#account-button').addEventListener('click', () => showToast('Your account area is ready to connect.'));
document.querySelector('#menu-toggle').addEventListener('click', () => document.querySelector('#main-nav').classList.toggle('mobile-open'));
document.querySelector('#main-nav').addEventListener('click', event => { if (event.target.closest('a')) document.querySelector('#main-nav').classList.remove('mobile-open'); });
document.querySelector('#newsletter-form').addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#newsletter-message').textContent = 'You’re on the list. Look out for a little note from us soon.';
  document.querySelector('#newsletter-email').value = '';
});
document.querySelector('#copyright-year').textContent = new Date().getFullYear();
document.addEventListener('keydown', event => { if (event.key === 'Escape') closePanels(); });

renderProducts();
updateCart();
