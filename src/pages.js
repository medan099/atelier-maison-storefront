import { products, imageUrl, money } from './products.js';

const cartKey = 'atelier-maison-cart';
const favoritesKey = 'atelier-maison-favorites';
const page = document.body.dataset.page;
const main = document.querySelector('#page-content');
const storedCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
const cart = new Map(storedCart.map(function (row) {
  return [row.id, { product: products.find(function (item) { return item.id === row.id; }), quantity: row.quantity }];
}).filter(function (entry) { return entry[1].product; }));
const favorites = new Set(JSON.parse(localStorage.getItem(favoritesKey) || '[]'));
let toastTimer;
let checkoutState = {
  step: 1,
  contact: { name: '', email: '', phone: '', address: '', city: '', postal: '', country: '' },
  delivery: 'standard',
  payment: 'card-demo'
};

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function renderChrome() {
  document.querySelector('#site-header').innerHTML =
    '<div class="announcement"><span>Complimentary delivery on orders over $150</span><span class="announcement-note">Thoughtfully made. Made to stay.</span></div>' +
    '<header class="site-header"><button class="icon-button menu-button" id="menu-toggle" aria-label="Open menu"><span class="menu-lines"></span></button>' +
    '<a class="brand" href="/index.html#top" aria-label="Atelier Maison home"><span class="brand-mark">a<span>.</span></span><span class="brand-name">atelier maison</span></a>' +
    '<nav class="main-nav" id="main-nav" aria-label="Main navigation"><a href="/shop.html">Shop</a><a href="/shop.html?category=Storage">Kitchen &amp; storage</a><a href="/shop.html?category=Seating">Dining</a><a href="/about.html">Our approach</a></nav>' +
    '<div class="header-actions"><button class="icon-button search-button" id="search-toggle" aria-label="Search products"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg></button><button class="icon-button account-button" id="account-button" aria-label="Your account"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M4.5 21c.5-4 3.1-6.2 7.5-6.2s7 2.2 7.5 6.2"></path></svg></button><a class="bag-button" href="/bag.html" aria-label="Open shopping bag">Bag <span id="cart-count">0</span></a></div></header>' +
    '<div class="search-panel" id="search-panel" aria-hidden="true"><label for="search-input">Find something lovely</label><form class="search-field" id="search-form"><input id="search-input" type="search" name="q" placeholder="Try oak or stools" autocomplete="off"><button type="submit" aria-label="Search">↗</button><button class="search-close" id="search-close" type="button" aria-label="Close search">×</button></form><span class="search-hint">Search the collection</span></div>';
  document.querySelector('#site-footer').innerHTML =
    '<footer class="site-footer"><div class="footer-top"><a class="brand footer-brand" href="/index.html#top"><span class="brand-mark">a<span>.</span></span><span class="brand-name">atelier maison</span></a><p>Objects for the everyday.<br>Made to be lived with.</p><div class="footer-links"><a href="/shop.html">Shop all</a><a href="/about.html">Our approach</a><a href="mailto:bonjour@ateliermaison.example">Get in touch</a></div><div class="footer-links"><a href="/about.html#shipping">Shipping &amp; returns</a><a href="/about.html#care">Care guide</a></div></div><div class="footer-bottom"><span>© ' + new Date().getFullYear() + ' Atelier Maison</span><span>Designed to feel like home.</span><span>Demo storefront</span></div></footer>';
  document.body.insertAdjacentHTML('beforeend', '<div class="toast" id="toast" role="status" aria-live="polite"></div>');
  document.querySelector('#menu-toggle').addEventListener('click', function () { document.querySelector('#main-nav').classList.toggle('mobile-open'); });
  document.querySelector('#search-toggle').addEventListener('click', function () {
    const panel = document.querySelector('#search-panel');
    panel.classList.toggle('open');
    panel.setAttribute('aria-hidden', String(!panel.classList.contains('open')));
    if (panel.classList.contains('open')) document.querySelector('#search-input').focus();
  });
  document.querySelector('#search-close').addEventListener('click', function () {
    const panel = document.querySelector('#search-panel');
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  });
  document.querySelector('#search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const query = document.querySelector('#search-input').value.trim();
    window.location.href = '/shop.html' + (query ? '?q=' + encodeURIComponent(query) : '');
  });
  document.querySelector('#account-button').addEventListener('click', function () { showToast('Account sign-in is not part of this storefront demo.'); });
  updateBadge();
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.classList.remove('visible'); }, 2400);
}

function updateBadge() {
  const badge = document.querySelector('#cart-count');
  if (badge) badge.textContent = String(Array.from(cart.values()).reduce(function (sum, row) { return sum + row.quantity; }, 0));
}

function subtotal() {
  return Array.from(cart.values()).reduce(function (sum, row) { return sum + row.product.price * row.quantity; }, 0);
}

function persistCart() {
  localStorage.setItem(cartKey, JSON.stringify(Array.from(cart.values()).map(function (row) { return { id: row.product.id, quantity: row.quantity }; })));
  updateBadge();
}

function addToCart(id) {
  const product = products.find(function (item) { return item.id === id; });
  if (!product) return;
  const row = cart.get(id);
  cart.set(id, { product: product, quantity: (row ? row.quantity : 0) + 1 });
  persistCart();
  showToast(product.name + ' added to your bag');
  if (page === 'bag') renderBag();
}

function productCard(product, index) {
  return '<article class="product-card" style="--card-index:' + index + '"><div class="product-image-wrap">' +
    '<a class="product-image-button" href="/product.html?id=' + encodeURIComponent(product.id) + '" aria-label="View ' + escapeHtml(product.name) + '"><img src="' + imageUrl(product.image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy"><span class="quick-view">View piece <span>↗</span></span></a>' +
    (product.badge ? '<span class="product-badge ' + product.badgeTone + '">' + escapeHtml(product.badge) + '</span>' : '') +
    '<button class="favorite-button ' + (favorites.has(product.id) ? 'is-saved' : '') + '" data-favorite="' + product.id + '" aria-label="' + (favorites.has(product.id) ? 'Remove from' : 'Add to') + ' wishlist">' + (favorites.has(product.id) ? '♥' : '♡') + '</button>' +
    '<button class="quick-add" data-add="' + product.id + '" aria-label="Add ' + escapeHtml(product.name) + ' to bag">+</button></div>' +
    '<div class="product-info"><div><p class="product-category">' + escapeHtml(product.type) + '</p><h3><a href="/product.html?id=' + encodeURIComponent(product.id) + '">' + escapeHtml(product.name) + '</a></h3></div><p class="product-price">' + money(product.price) + '</p></div></article>';
}

function renderShop() {
  const params = new URLSearchParams(window.location.search);
  const state = {
    category: params.get('category') || 'All pieces',
    query: params.get('q') || '',
    sort: 'featured'
  };
  if (!['All pieces', 'Storage', 'Seating', 'Lighting', 'Accessories'].includes(state.category)) state.category = 'All pieces';
  document.querySelector('#search-input').value = state.query;
  main.innerHTML =
    '<section class="shop-section inner-page"><div class="section-heading"><div><p class="eyebrow">Considered, collected, loved</p><h1>Find your <em>everyday.</em></h1><p class="page-intro">Furniture and useful things made to feel at home.</p></div></div>' +
    '<div class="shop-toolbar"><div class="category-tabs" role="tablist" aria-label="Filter products by category">' +
    ['All pieces', 'Storage', 'Seating', 'Lighting', 'Accessories'].map(function (category) {
      const label = category === 'Storage' ? 'Kitchen & storage' : category === 'Accessories' ? 'Small things' : category;
      return '<button class="category-tab ' + (state.category === category ? 'active' : '') + '" data-category="' + category + '" role="tab" aria-selected="' + String(state.category === category) + '">' + label + (category === 'All pieces' ? ' <span>08</span>' : '') + '</button>';
    }).join('') +
    '</div><label class="sort-control">Sort by <select id="sort-select" aria-label="Sort products"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select><span class="select-chevron">⌄</span></label></div>' +
    '<p class="active-filter" id="active-filter" ' + (state.query ? '' : 'hidden') + '></p><div class="product-grid" id="product-grid"></div><p class="empty-state" id="empty-state" hidden>No pieces found. Try another search or category.</p></section>';
  const grid = document.querySelector('#product-grid');
  function paint() {
    let list = products.filter(function (product) {
      return (state.category === 'All pieces' || product.category === state.category) &&
        (product.name + ' ' + product.category + ' ' + product.type + ' ' + product.color).toLowerCase().includes(state.query.toLowerCase());
    });
    if (state.sort === 'price-low') list.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === 'price-high') list.sort(function (a, b) { return b.price - a.price; });
    if (state.sort === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    grid.innerHTML = list.map(productCard).join('');
    document.querySelector('#empty-state').hidden = list.length > 0;
    const active = document.querySelector('#active-filter');
    active.innerHTML = state.query ? 'Showing results for <strong>“' + escapeHtml(state.query) + '”</strong> <button type="button" id="clear-search">Clear ×</button>' : '';
    document.querySelectorAll('[data-category]').forEach(function (button) {
      const selected = button.dataset.category === state.category;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
  }
  document.querySelectorAll('[data-category]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.category = button.dataset.category;
      const query = new URLSearchParams();
      if (state.category !== 'All pieces') query.set('category', state.category);
      if (state.query) query.set('q', state.query);
      history.replaceState({}, '', '/shop.html' + (query.size ? '?' + query.toString() : ''));
      paint();
    });
  });
  document.querySelector('#sort-select').addEventListener('change', function (event) { state.sort = event.target.value; paint(); });
  document.querySelector('#active-filter').addEventListener('click', function (event) {
    if (event.target.closest('#clear-search')) {
      state.query = '';
      history.replaceState({}, '', '/shop.html' + (state.category === 'All pieces' ? '' : '?category=' + encodeURIComponent(state.category)));
      paint();
    }
  });
  paint();
}

function renderProduct() {
  const id = new URLSearchParams(window.location.search).get('id');
  const product = products.find(function (item) { return item.id === id; });
  if (!product) {
    main.innerHTML = '<section class="inner-page message-page"><p class="eyebrow">We couldn’t find that piece</p><h1>Something is missing.</h1><a class="button" href="/shop.html">Back to the collection <span>↗</span></a></section>';
    return;
  }
  const related = products.filter(function (item) { return item.category === product.category && item.id !== product.id; }).slice(0, 3);
  main.innerHTML =
    '<section class="product-page inner-page"><p class="breadcrumbs"><a href="/index.html">Home</a> / <a href="/shop.html">Shop</a> / ' + escapeHtml(product.name) + '</p>' +
    '<div class="product-detail"><div class="product-detail-image"><img src="' + imageUrl(product.image, 1400) + '" alt="' + escapeHtml(product.name) + '"></div>' +
    '<div class="product-detail-copy"><p class="eyebrow">' + escapeHtml(product.category) + ' · ' + escapeHtml(product.type) + '</p><h1>' + escapeHtml(product.name) + '</h1><p class="detail-price">' + money(product.price) + '</p><p class="modal-description">' + escapeHtml(product.description) + '</p><p class="modal-color">Colour · <strong>' + escapeHtml(product.color) + '</strong></p><button class="button" data-add="' + product.id + '">Add to bag <span>↗</span></button><p class="modal-delivery">✳ Complimentary delivery over $150</p><div class="modal-details-list"><span>Thoughtfully made</span><span>Easy returns within 30 days</span><span>Made to order with care</span></div></div></div>' +
    '<div class="detail-story"><p class="eyebrow">Made for the moments in between</p><h2>A piece to live with.</h2><p>Honest materials, considered forms and makers who care about the details. Built for the everyday, and made to be kept.</p></div>' +
    (related.length ? '<section class="related-products"><div class="section-heading"><div><p class="eyebrow">More to love</p><h2>Pairs well with <em>home.</em></h2></div></div><div class="product-grid">' + related.map(productCard).join('') + '</div></section>' : '') + '</section>';
}

function cartRows() {
  return Array.from(cart.values()).map(function (row) {
    const product = row.product;
    return '<article class="cart-line"><a href="/product.html?id=' + encodeURIComponent(product.id) + '"><img src="' + imageUrl(product.image, 320) + '" alt="' + escapeHtml(product.name) + '"></a><div class="cart-line-copy"><p class="product-category">' + escapeHtml(product.type) + '</p><h2><a href="/product.html?id=' + encodeURIComponent(product.id) + '">' + escapeHtml(product.name) + '</a></h2><p>' + money(product.price) + '</p><div class="quantity-control"><button data-qty="' + product.id + '" data-change="-1" aria-label="Remove one">−</button><span>' + row.quantity + '</span><button data-qty="' + product.id + '" data-change="1" aria-label="Add one">+</button></div></div><button class="remove-item" data-remove="' + product.id + '" aria-label="Remove ' + escapeHtml(product.name) + '">×</button></article>';
  }).join('');
}

function summaryBox(showCheckout) {
  const total = subtotal();
  const delivery = page === 'checkout' ? shippingCost() : (total >= 150 ? 0 : 18);
  const deliveryLabel = page === 'checkout' && checkoutState.delivery === 'white-glove' ? 'Room of choice' : 'Standard delivery';
  return '<aside class="order-summary"><p class="eyebrow">Your order</p><h2>Thoughtful things, <em>on the way.</em></h2><div class="summary-row"><span>Subtotal</span><strong>' + money(total) + '</strong></div><div class="summary-row"><span>' + deliveryLabel + '</span><strong>' + (delivery ? money(delivery) : 'Complimentary') + '</strong></div><p class="summary-note">No tax is calculated in this demo. Delivery is an estimate only.</p><div class="summary-row summary-total"><span>Estimated total</span><strong>' + money(total + delivery) + '</strong></div>' + (showCheckout ? '<a class="button checkout-button" href="/checkout.html">Continue to checkout <span>↗</span></a><a class="continue-shopping" href="/shop.html">Continue shopping</a>' : '') + '</aside>';
}

function renderBag() {
  const count = Array.from(cart.values()).reduce(function (sum, row) { return sum + row.quantity; }, 0);
  if (!count) {
    main.innerHTML = '<section class="inner-page bag-page"><p class="eyebrow">Your good things</p><h1>Your bag is taking <em>a little rest.</em></h1><p class="page-intro">Find something lovely for the everyday.</p><a class="button" href="/shop.html">Explore the collection <span>↗</span></a></section>';
    return;
  }
  main.innerHTML = '<section class="inner-page bag-page"><p class="eyebrow">Your good things</p><h1>Your <em>bag.</em> <span class="bag-count">(' + count + ')</span></h1><div class="bag-layout"><div class="bag-lines">' + cartRows() + '</div>' + summaryBox(true) + '</div></section>';
}

function shippingCost() {
  if (checkoutState.delivery === 'white-glove') return 89;
  return subtotal() >= 150 ? 0 : 18;
}

function checkoutSteps() {
  return '<ol class="checkout-steps">' + ['Your details', 'Delivery', 'Payment', 'Review'].map(function (label, index) {
    return '<li class="' + (checkoutState.step === index + 1 ? 'active' : checkoutState.step > index + 1 ? 'complete' : '') + '"><span>' + (index + 1) + '</span>' + label + '</li>';
  }).join('') + '</ol>';
}

function renderCheckout() {
  if (!cart.size) {
    main.innerHTML = '<section class="inner-page bag-page"><p class="eyebrow">Checkout</p><h1>Your bag is <em>empty.</em></h1><a class="button" href="/shop.html">Shop the collection <span>↗</span></a></section>';
    return;
  }
  const contact = checkoutState.contact;
  let formContent = '';
  if (checkoutState.step === 1) {
    formContent = '<p class="eyebrow">Step 1 of 4</p><h2>Where should we send it?</h2><p class="checkout-copy">Your details stay in this browser for this demo only.</p><form id="checkout-form" class="checkout-form"><label>Full name<input name="name" autocomplete="name" required value="' + escapeHtml(contact.name) + '"></label><label>Email address<input name="email" type="email" autocomplete="email" required value="' + escapeHtml(contact.email) + '"></label><label>Phone number <span>(optional)</span><input name="phone" type="tel" autocomplete="tel" value="' + escapeHtml(contact.phone) + '"></label><label class="field-wide">Street address<input name="address" autocomplete="street-address" required value="' + escapeHtml(contact.address) + '"></label><label>City<input name="city" autocomplete="address-level2" required value="' + escapeHtml(contact.city) + '"></label><label>Postal code<input name="postal" autocomplete="postal-code" required value="' + escapeHtml(contact.postal) + '"></label><label class="field-wide">Country<select name="country" autocomplete="country-name" required><option value="">Choose a country</option>' + ['United States', 'United Kingdom', 'France', 'Canada', 'Australia'].map(function (country) { return '<option' + (contact.country === country ? ' selected' : '') + '>' + country + '</option>'; }).join('') + '</select></label><div class="checkout-actions"><a class="continue-shopping" href="/bag.html">← Back to bag</a><button class="button" type="submit">Continue to delivery <span>↗</span></button></div></form>';
  } else if (checkoutState.step === 2) {
    formContent = '<p class="eyebrow">Step 2 of 4</p><h2>Choose your delivery.</h2><p class="checkout-copy">A delivery estimate is part of this demo. No shipment will be arranged.</p><div class="choice-list"><label class="choice-card"><input type="radio" name="delivery" value="standard" ' + (checkoutState.delivery === 'standard' ? 'checked' : '') + '><span><strong>Standard delivery</strong><small>5–7 business days · ' + (subtotal() >= 150 ? 'Complimentary' : money(18)) + '</small></span></label><label class="choice-card"><input type="radio" name="delivery" value="white-glove" ' + (checkoutState.delivery === 'white-glove' ? 'checked' : '') + '><span><strong>Room of choice</strong><small>White-glove delivery estimate · ' + money(89) + '</small></span></label></div><div class="checkout-actions"><button class="text-link" data-back type="button">← Back to details</button><button class="button" data-next type="button">Continue to payment <span>↗</span></button></div>';
  } else if (checkoutState.step === 3) {
    formContent = '<p class="eyebrow">Step 3 of 4</p><h2>Choose a demo payment.</h2><p class="checkout-copy">This is a prototype: no card details are requested, no payment is processed, and no order is sent to a shop.</p><div class="choice-list"><label class="choice-card"><input type="radio" name="payment" value="card-demo" ' + (checkoutState.payment === 'card-demo' ? 'checked' : '') + '><span><strong>Card payment</strong><small>Simulation only — no card information collected</small></span></label><label class="choice-card"><input type="radio" name="payment" value="cash-demo" ' + (checkoutState.payment === 'cash-demo' ? 'checked' : '') + '><span><strong>Pay on delivery</strong><small>Simulation only — no payment will be collected</small></span></label></div><div class="checkout-actions"><button class="text-link" data-back type="button">← Back to delivery</button><button class="button" data-next type="button">Review your order <span>↗</span></button></div>';
  } else {
    const method = checkoutState.payment === 'cash-demo' ? 'Pay on delivery · demo' : 'Card payment · demo';
    const rows = Array.from(cart.values()).map(function (row) { return '<li><span>' + escapeHtml(row.product.name) + ' × ' + row.quantity + '</span><strong>' + money(row.product.price * row.quantity) + '</strong></li>'; }).join('');
    formContent = '<p class="eyebrow">Step 4 of 4</p><h2>One last look.</h2><p class="checkout-copy">Review the demo summary before creating a local confirmation.</p><div class="review-card"><p><strong>' + escapeHtml(contact.name) + '</strong><br>' + escapeHtml(contact.email) + '<br>' + escapeHtml(contact.address) + ', ' + escapeHtml(contact.city) + ' ' + escapeHtml(contact.postal) + '<br>' + escapeHtml(contact.country) + '</p><p>Delivery: ' + (checkoutState.delivery === 'white-glove' ? 'Room of choice' : 'Standard') + '<br>Payment: ' + method + '</p><ul>' + rows + '</ul><div class="summary-row"><span>Items</span><strong>' + money(subtotal()) + '</strong></div><div class="summary-row"><span>Delivery</span><strong>' + (shippingCost() ? money(shippingCost()) : 'Complimentary') + '</strong></div><div class="summary-row summary-total"><span>Demo total</span><strong>' + money(subtotal() + shippingCost()) + '</strong></div></div><div class="demo-notice">No payment will be taken and no real order will be placed.</div><div class="checkout-actions"><button class="text-link" data-back type="button">← Back to payment</button><button class="button" id="place-order" type="button">Place demo order <span>↗</span></button></div>';
  }
  main.innerHTML = '<section class="inner-page checkout-page"><p class="eyebrow">A few details, then you’re all set</p><h1>Checkout.</h1>' + checkoutSteps() + '<div class="checkout-layout"><section class="checkout-panel">' + formContent + '</section>' + summaryBox(false) + '</div></section>';
  const form = document.querySelector('#checkout-form');
  if (form) form.addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(form);
    checkoutState.contact = {
      name: formData.get('name'), email: formData.get('email'), phone: formData.get('phone'),
      address: formData.get('address'), city: formData.get('city'), postal: formData.get('postal'), country: formData.get('country')
    };
    checkoutState.step = 2;
    renderCheckout();
  });
  document.querySelectorAll('input[name="delivery"]').forEach(function (input) {
    input.addEventListener('change', function () { checkoutState.delivery = input.value; renderCheckout(); });
  });
  document.querySelectorAll('input[name="payment"]').forEach(function (input) {
    input.addEventListener('change', function () { checkoutState.payment = input.value; renderCheckout(); });
  });
  document.querySelectorAll('[data-next]').forEach(function (button) { button.addEventListener('click', function () { checkoutState.step += 1; renderCheckout(); }); });
  document.querySelectorAll('[data-back]').forEach(function (button) { button.addEventListener('click', function () { checkoutState.step -= 1; renderCheckout(); }); });
  const place = document.querySelector('#place-order');
  if (place) place.addEventListener('click', function () {
    const reference = 'AM-' + Date.now().toString(36).toUpperCase();
    const receipt = {
      reference: reference,
      items: Array.from(cart.values()).map(function (row) { return { name: row.product.name, quantity: row.quantity, price: row.product.price }; }),
      subtotal: subtotal(), delivery: shippingCost(), total: subtotal() + shippingCost()
    };
    sessionStorage.setItem('atelier-last-order', JSON.stringify(receipt));
    cart.clear();
    persistCart();
    window.location.href = '/confirmation.html?ref=' + encodeURIComponent(reference);
  });
}

function renderConfirmation() {
  const reference = new URLSearchParams(window.location.search).get('ref');
  const receipt = JSON.parse(sessionStorage.getItem('atelier-last-order') || 'null');
  if (!receipt || receipt.reference !== reference) {
    main.innerHTML = '<section class="inner-page confirmation-page"><p class="eyebrow">Demo storefront</p><h1>Thank you for visiting.</h1><p class="page-intro">Orders can be completed here as a local checkout demo.</p><a class="button" href="/shop.html">Back to the collection <span>↗</span></a></section>';
    return;
  }
  main.innerHTML = '<section class="inner-page confirmation-page"><span class="confirmation-mark">✓</span><p class="eyebrow">Demo order complete</p><h1>Thank you, <em>for now.</em></h1><p class="page-intro">Your checkout flow reached its confirmation step.</p><div class="demo-notice">This is only a frontend demo. No payment was charged and no order or address was sent to a store.</div><div class="receipt-card"><p>Demo reference <strong>' + escapeHtml(receipt.reference) + '</strong></p><ul>' + receipt.items.map(function (item) { return '<li><span>' + escapeHtml(item.name) + ' × ' + item.quantity + '</span><strong>' + money(item.price * item.quantity) + '</strong></li>'; }).join('') + '</ul><div class="summary-row"><span>Items</span><strong>' + money(receipt.subtotal) + '</strong></div><div class="summary-row"><span>Delivery estimate</span><strong>' + (receipt.delivery ? money(receipt.delivery) : 'Complimentary') + '</strong></div><div class="summary-row summary-total"><span>Demo total</span><strong>' + money(receipt.total) + '</strong></div></div><a class="button" href="/shop.html">Continue shopping <span>↗</span></a></section>';
}

function renderAbout() {
  main.innerHTML = '<section class="about-hero inner-page"><p class="eyebrow">A little less, a little better</p><h1>Good things take<br><em>their time.</em></h1><p class="page-intro">We make room for the small, everyday moments that make a home feel like yours.</p></section><section class="editorial about-story"><div class="editorial-image"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&amp;fit=crop&amp;w=1300&amp;q=85" alt="Natural materials and warm details in a calm home interior"></div><div class="editorial-copy"><p class="eyebrow">Our approach</p><h2>Made to be<br><em>lived with.</em></h2><p>We believe a home comes together slowly. With a table that gathers everyone, a shelf that grows with you and the everyday pieces you reach for without thinking.</p><p>So we choose honest materials, considered forms and makers who care about the details. These are useful things, made to stay.</p><a class="text-link" href="/shop.html">Find your everyday <span>↗</span></a></div></section><section class="about-notes inner-page" id="shipping"><div><p class="eyebrow">Shipping &amp; returns</p><h2>Thoughtful delivery.</h2><p>This demo shows a complimentary standard delivery threshold of $150 and an estimated $18 fee below it. Actual delivery terms would be set by a connected store platform.</p><p>We show a 30-day return promise in product details. Returns are informational only in this prototype.</p></div><div id="care"><p class="eyebrow">Care guide</p><h2>Keep the good things.</h2><p>Use gentle cleaners, dry natural wood after spills, and keep ceramic pieces away from sudden temperature changes. Always follow the care notes included with a real product.</p></div></section>';
}

function renderHomeFallback() {
  main.innerHTML = '<section class="inner-page message-page"><p class="eyebrow">Atelier Maison</p><h1>Make room for living.</h1><p class="page-intro">Thoughtful pieces for the heart of your home.</p><a class="button" href="/shop.html">Explore the collection <span>↗</span></a></section>';
}

function renderPage() {
  if (page === 'shop') renderShop();
  else if (page === 'product') renderProduct();
  else if (page === 'bag') renderBag();
  else if (page === 'checkout') renderCheckout();
  else if (page === 'confirmation') renderConfirmation();
  else if (page === 'about') renderAbout();
  else renderHomeFallback();
}

document.addEventListener('click', function (event) {
  const add = event.target.closest('[data-add]');
  const remove = event.target.closest('[data-remove]');
  const quantity = event.target.closest('[data-qty]');
  const favorite = event.target.closest('[data-favorite]');
  if (add) addToCart(add.dataset.add);
  if (remove) {
    cart.delete(remove.dataset.remove);
    persistCart();
    if (page === 'bag') renderBag();
    if (page === 'checkout') renderCheckout();
  }
  if (quantity) {
    const row = cart.get(quantity.dataset.qty);
    if (row) {
      row.quantity += Number(quantity.dataset.change);
      if (row.quantity <= 0) cart.delete(quantity.dataset.qty);
      persistCart();
      if (page === 'bag') renderBag();
      if (page === 'checkout') renderCheckout();
    }
  }
  if (favorite) {
    const id = favorite.dataset.favorite;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    localStorage.setItem(favoritesKey, JSON.stringify(Array.from(favorites)));
    if (page === 'shop') renderShop();
    showToast(favorites.has(id) ? 'Saved to your wishlist' : 'Removed from your wishlist');
  }
});

renderChrome();
renderPage();
