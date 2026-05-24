# Lamstone Healthcare — Shopify Checkout branding

Checkout styling is **not** controlled by theme Liquid. Use one of the options below so logo, colors, typography, and form spacing match the Horizon storefront (`scheme-golden` / Lamstone brand).

## Option A — Checkout editor (recommended)

1. **Shopify Admin** → **Settings** → **Checkout** → **Customize**.
2. **Logo**: upload `Lamstone-HEalthCare-Wide` (same asset as theme logo). Set max width ~180px, centered in header.
3. **Colors**:
   - Page background: `#F8F5EE` (brand cream)
   - Accent / primary button: `#C9971F` (gold)
   - Text: `#141414`
   - Form fields: white background, border `#D4AF37` at ~35% opacity
4. **Typography**: match storefront — **Belleza** (body/UI), **Cormorant Garamond** (headings) if available in checkout font list; otherwise closest serif + sans pairing.
5. **Buttons**: pill/large radius (~14px), primary gold gradient feel, uppercase label.
6. **Forms**: labels on top, generous vertical spacing between fields.

## Option B — GraphQL `checkoutBrandingUpsert`

1. Get your checkout profile ID (Admin API or GraphiQL):

```graphql
query {
  checkoutProfiles(first: 5) {
    nodes { id name }
  }
}
```

2. Upload logo via `fileCreate` if needed (non-SVG). Use the returned CDN URL in `lamstone-checkout-branding.json` → replace `LOGO_IMAGE_URL` and `CHECKOUT_PROFILE_ID`.

3. Run mutation with variables from `lamstone-checkout-branding.json` (requires `write_checkout_branding_settings` scope).

Reference: [checkoutBrandingUpsert](https://shopify.dev/docs/api/admin-graphql/latest/mutations/checkoutBrandingUpsert)

## Theme cart (already wired)

- `snippets/lame-cart-checkout-assets.liquid` — loads cart/drawer CSS
- `snippets/lame-cart-trust.liquid` — trust badges in cart summary
- `assets/lame-cart-checkout.css` — Lamstone cart page + drawer styling

Cart drawer color scheme: set **Drawers → Color scheme** to **Golden** (`scheme-golden`) in theme settings for best match.
