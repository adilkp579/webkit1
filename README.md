# WebKit store

A static storefront and admin panel powered by [Supabase](https://supabase.com).
No build step, no framework: upload the folder to any static host.

```
webkit-project/
├── index.html              Storefront page (markup only)
├── robots.txt              Keeps /admin/ out of search engines
├── assets/
│   ├── css/styles.css      Storefront styles
│   └── js/
│       ├── config.js       ← YOUR Supabase URL + anon key go here
│       ├── content.js      Editable reviews and FAQ text
│       └── app.js          Storefront logic (catalogue, cart, OTP checkout, profile)
├── admin/
│   ├── index.html          Admin panel (open /admin/)
│   ├── admin.css
│   └── admin.js            Products, categories, orders, customers
└── supabase/
    └── schema.sql          Database tables, security rules, image storage (no demo data)
```

The store starts **empty**. Only products you add in the admin appear on the site.

## Setup (once)

1. **Create a Supabase project** at supabase.com.
2. **Database:** Supabase → *SQL Editor* → paste all of `supabase/schema.sql` → *Run*.
3. **Admin user:** *Authentication → Users → Add user*. Use the email from `ADMIN_EMAIL`
   in `assets/js/config.js` (default `admin@webkit.store`), choose a strong password and tick
   *Auto Confirm User*. Then run the last statement of `schema.sql` again (it makes that user an admin).
   You log in at `/admin/` with username `admin` and that password.
4. **Customer OTP login:** *Authentication → Providers → Phone* → enable it and connect an SMS
   provider (for example Twilio). In India, SMS providers require DLT registration.
   While building, use *Test phone numbers* with fixed OTPs.
5. **Disable public email sign-ups:** *Authentication → Providers → Email → turn off "Allow new users to sign up"*
   (the admin user already exists).
6. **Keys:** *Project Settings → API*. Put the *Project URL* and *anon public* key into
   `assets/js/config.js`. Never put the `service_role` key in any file here.
7. **Deploy:** upload the folder to Netlify, Vercel, Cloudflare Pages or GitHub Pages
   (drag and drop works). Open `/admin/`, add categories and products. They appear on the store instantly.

## Day to day

| Task | Where |
| --- | --- |
| Add / edit / hide / delete products (up to 3 photos each), mark Featured or Best seller | Admin → Products |
| Add categories, choose which show as home page cards | Admin → Categories |
| Accept or reject new orders, update tracking | Admin → Dashboard / Orders |
| Rename, add or delete the Explore Our Products tabs (Boys / Girls / Adults …) | Admin → Explore Tabs |
| Choose which products appear in Explore Our Products (tick "Show in Explore Our Products", or tap the Explore chip in the list) | Admin → Products |
| Change the order of Featured Picks, Shop by Category, Explore Our Products, Best Sellers and the Shop Now page (type position numbers) | Admin → Positions |
| Message a customer (they see it under the message icon in the header) | Admin → Messages |
| See subscribed mobile numbers, download as CSV | Admin → Subscribers |
| Edit reviews and FAQ text | `assets/js/content.js` |
| Footer contact details, About text | `index.html` |
| Home page hero photo (transparent PNG cut-out of a person; empty = built-in silhouette) | `HERO_IMAGE` in `assets/js/config.js` |

## How it works

- Visitors read products and categories (only visible ones) directly from Supabase. Admin changes reach open pages live.
- Customers log in with a mobile OTP. Their profile and orders are tied to that account, so they see
  the same orders on any device.
- Order totals are calculated by the database from your current prices, not by the browser.
  New orders wait as *pending* until you accept them; tracking starts on acceptance.
- Row Level Security lets only the admin change products, categories and order status.
- The browser keeps only the cart and a cached copy of the last product list.

## Before going live

- Replace the placeholder reviews in `content.js` with real ones, or empty the list.
- Update the statistics shown on the page (hero badge, About numbers, product page trust strip),
  the footer contact details, and your return / delivery policy wording so they match reality.
- Add real Privacy Policy, Terms and Returns pages and link them in the footer.
