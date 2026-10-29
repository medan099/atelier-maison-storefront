import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: 'index.html',
        shop: 'shop.html',
        product: 'product.html',
        about: 'about.html',
        bag: 'bag.html',
        checkout: 'checkout.html',
        confirmation: 'confirmation.html',
      },
    },
  },
});
