# Atelier Maison

A responsive, frontend-only ecommerce storefront for kitchen furniture and considered home pieces. Built with Vite and plain JavaScript, HTML, and CSS; no backend or account setup is required.

## Run locally

```sh
npm install
npm run dev
```

For a production bundle:

```sh
npm run build
npm run preview
```

## Storefront features

- Separate home, shop, product, about, bag, checkout, and order confirmation pages
- Product collection with category filters, search, and sorting
- Product quick views and wishlist toggles
- Shopping bag drawer with quantity controls, subtotal, and delivery threshold
- Responsive navigation, newsletter interaction, and a four-step demo checkout

Product photography is loaded from Unsplash. The cart and wishlist are saved in this browser. Checkout collects no card information, charges no payment, and sends no real order; the confirmation is a local demo. Connect a store backend and payment provider before accepting real orders.
