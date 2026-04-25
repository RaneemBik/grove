"""
seed_data.py — python manage.py seed_data

Categories : Makeup · Accessories · Skin Care · Sports
Seasonal kits, gift boxes, and new arrivals are all admin-manageable.
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from apps.products.models import (
    Category, Product, ProductImage,
    ProductVariantType, ProductVariantValue,
    ProductVariant, ProductVariantSKU,
    SeasonalKit, SeasonalKitItem,
)
from apps.gift_boxes.models import GiftBox

User = get_user_model()
MEDIA_ROOT = settings.MEDIA_ROOT


def _img(rel_path):
    full = os.path.join(MEDIA_ROOT, rel_path)
    return rel_path if os.path.exists(full) else None


# ── CATEGORIES ───────────────────────────────────────────────────────────────
CATEGORIES = [
    {'name': 'Makeup',       'slug': 'makeup',       'description': 'Luxury makeup and beauty essentials.',                   'image': _img('categories/dior-gloss.jfif')},
    {'name': 'Accessories',  'slug': 'accessories',  'description': 'Fine jewellery and premium accessories.',                'image': _img('categories/Cartier_Watch.jpg')},
    {'name': 'Skin Care',    'slug': 'skin-care',    'description': 'Korean and premium skin-care formulas.',                 'image': _img('categories/Eqqualberry_purple.png')},
    {'name': 'Sports',       'slug': 'sports',       'description': 'Premium gear for fitness, yoga, and active living.',    'image': _img('categories/pilates_board.webp')},
]

# ── PRODUCTS ─────────────────────────────────────────────────────────────────
# Each entry: (product_dict, [image_paths], is_new_arrival)
PRODUCTS = [
    # Skin Care
    ({'name':'Eqqualberry NAD+ Peptide Boosting Cream','slug':'eqqualberry-nad-peptide-cream','category_slug':'skin-care',
      'description':'A powerhouse anti-ageing cream infused with NAD+ technology and peptide complex. Firms, brightens and deeply hydrates.',
      'short_description':'NAD+ peptide anti-ageing powerhouse',
      'price':89.00,'compare_price':120.00,'sku':'SK-001','stock':40,'is_featured':True},
     ['products/eqqpurple_creammm.webp','products/cream_purple.webp','products/cream_purple_2.webp'], False),

    ({'name':'Eqqualberry Purple Glow Serum','slug':'eqqualberry-purple-glow-serum','category_slug':'skin-care',
      'description':'A silky serum delivering intense hydration and luminous glow with hyaluronic acid and niacinamide.',
      'short_description':'Intense hydration glow serum',
      'price':62.00,'compare_price':80.00,'sku':'SK-002','stock':55,'is_featured':False},
     ['products/purple_serum_1.webp','products/purple_serum_2.webp','products/purple_serum_3.webp'], True),

    ({'name':'Centella Calming Rescue Cream','slug':'centella-calming-rescue-cream','category_slug':'skin-care',
      'description':'Lightweight gel-cream powered by centella asiatica to soothe redness and strengthen the skin barrier.',
      'short_description':'Barrier-strengthening centella cream',
      'price':45.00,'compare_price':None,'sku':'SK-003','stock':70,'is_featured':False},
     ['products/centella_package.webp','products/cream2.webp','products/cream3.webp'], True),

    ({'name':'Medicube Pink Collagen Capsule Serum','slug':'medicube-pink-collagen-capsule-serum','category_slug':'skin-care',
      'description':'Award-winning collagen capsule serum that visibly reduces fine lines and boosts elasticity.',
      'short_description':'Collagen-boosting capsule serum',
      'price':72.00,'compare_price':95.00,'sku':'SK-004','stock':35,'is_featured':True},
     ['products/medicube_pink_collagen_capsule.webp','products/medicube_face.png','products/medicube_2.png'], False),

    ({'name':'Advanced Retinol Renewal Serum','slug':'advanced-retinol-renewal-serum','category_slug':'skin-care',
      'description':'A gentle retinol serum for overnight skin renewal. Smooths texture and minimises pores.',
      'short_description':'Overnight retinol skin renewal',
      'price':58.00,'compare_price':None,'sku':'SK-005','stock':28,'is_featured':False},
     ['products/serum.webp','products/pink_serum_1.jpg','products/pink_serum_2.webp'], False),

    ({'name':'SPF 50 Hydrating Sunscreen Mist','slug':'spf-50-hydrating-sunscreen-mist','category_slug':'skin-care',
      'description':'Lightweight SPF 50 mist that protects, hydrates and sets makeup. Perfect for on-the-go touch-ups.',
      'short_description':'SPF 50 setting and hydrating mist',
      'price':38.00,'compare_price':None,'sku':'SK-006','stock':60,'is_featured':False},
     ['products/serum.webp'], True),

    ({'name':'Heavy-Duty Winter Moisturiser','slug':'heavy-duty-winter-moisturiser','category_slug':'skin-care',
      'description':'Rich, intensely nourishing cream designed for cold-weather skin. Repairs the barrier overnight.',
      'short_description':'Intensive barrier-repair winter cream',
      'price':52.00,'compare_price':70.00,'sku':'SK-007','stock':45,'is_featured':False},
     ['products/cream_purple.webp'], False),

    ({'name':'Repair Serum Concentrate','slug':'repair-serum-concentrate','category_slug':'skin-care',
      'description':'Concentrated repair serum with ceramides, peptides, and vitamin B5 for stressed or damaged skin.',
      'short_description':'Ceramide and peptide repair concentrate',
      'price':68.00,'compare_price':None,'sku':'SK-008','stock':30,'is_featured':False},
     ['products/purple_serum_1.webp'], False),

    # Makeup
    ({'name':'Dior Backstage Rosy Glow Blush','slug':'dior-rosy-glow-blush','category_slug':'makeup',
      'description':'The iconic Dior blush that adapts to your skin tone for a naturally flushed, healthy radiance.',
      'short_description':'Iconic skin-adaptive Dior blush',
      'price':58.00,'compare_price':75.00,'sku':'MK-001','stock':60,'is_featured':True},
     ['products/dior-blush.webp','products/dior_blush_2.jfif','products/dior-glow-blush.webp'], False),

    ({'name':'Dior Blush Bronze Sculpting Duo','slug':'dior-blush-bronze-sculpting-duo','category_slug':'makeup',
      'description':'A versatile blush and bronzer duo for sculpted, sun-kissed definition.',
      'short_description':'Blush and bronzer sculpting duo',
      'price':72.00,'compare_price':None,'sku':'MK-002','stock':45,'is_featured':False},
     ['products/dior-blush-bronzer.jpg','products/dior_faces_2.jpg'], False),

    ({'name':'Dior Addict Lip Maximizer Gloss','slug':'dior-addict-lip-gloss','category_slug':'makeup',
      'description':'Instantly plumping lip gloss with mirror-shine finish. Infused with hyaluronic acid.',
      'short_description':'Plumping mirror-shine lip gloss',
      'price':44.00,'compare_price':None,'sku':'MK-003','stock':80,'is_featured':True},
     ['products/dior-gloss.jfif','products/dior_glow_faces.jfif'], True),

    ({'name':'Dior Glow Stick Blush On-the-Go','slug':'dior-glow-stick-blush','category_slug':'makeup',
      'description':'A creamy, blendable blush stick for an effortless glow. Melts into skin for a natural flush.',
      'short_description':'Creamy on-the-go blush stick',
      'price':52.00,'compare_price':65.00,'sku':'MK-004','stock':50,'is_featured':False},
     ['products/dior_glow_stick_blush.webp','products/dior_glow_blush.webp'], False),

    ({'name':'Long-Lasting Matte Foundation','slug':'long-lasting-matte-foundation','category_slug':'makeup',
      'description':'Full-coverage, transfer-proof foundation that lasts 24 hours. Buildable finish from natural to full glam.',
      'short_description':'24-hour full-coverage matte finish',
      'price':49.00,'compare_price':None,'sku':'MK-005','stock':55,'is_featured':False},
     ['products/dior-blush.webp'], True),

    ({'name':'Waterproof Setting Spray','slug':'waterproof-setting-spray','category_slug':'makeup',
      'description':'Lock your makeup in place all day with this fine-mist setting spray. Sweat- and humidity-proof.',
      'short_description':'All-day makeup lock setting spray',
      'price':32.00,'compare_price':None,'sku':'MK-006','stock':90,'is_featured':False},
     ['products/dior_glow_stick_blush.webp'], False),

    ({'name':'Tinted Lip Balm SPF 15','slug':'tinted-lip-balm-spf15','category_slug':'makeup',
      'description':'Nourishing tinted lip balm with SPF 15 protection. Sheer colour with all-day moisture.',
      'short_description':'Tinted SPF lip balm',
      'price':22.00,'compare_price':None,'sku':'MK-007','stock':120,'is_featured':False},
     ['products/dior-gloss.jfif'], False),

    ({'name':'Repair Lip Balm Overnight','slug':'repair-lip-balm-overnight','category_slug':'makeup',
      'description':'Intensive overnight lip treatment with shea butter, vitamin E, and ceramides to restore dry lips.',
      'short_description':'Overnight intensive lip repair',
      'price':18.00,'compare_price':None,'sku':'MK-008','stock':100,'is_featured':False},
     ['products/dior_glow_blush.webp'], False),

    # Accessories
    ({'name':'Cartier Love Bracelet','slug':'cartier-love-bracelet','category_slug':'accessories',
      'description':'The iconic Cartier Love bracelet — a symbol of devotion in 18K gold.',
      'short_description':'Iconic 18K gold Cartier Love bracelet',
      'price':6750.00,'compare_price':None,'sku':'AC-001','stock':8,'is_featured':True},
     ['products/Cartier_Love_Necklace.webp','products/love_neck_2.avif','products/love_neck_3.avif'], False),

    ({'name':'Cartier Love Ring','slug':'cartier-love-ring','category_slug':'accessories',
      'description':'The emblematic Cartier Love ring — crafted in 18K gold.',
      'short_description':'18K gold signature Love ring',
      'price':1850.00,'compare_price':None,'sku':'AC-002','stock':12,'is_featured':True},
     ['products/Cartier_Ring.webp'], False),

    ({'name':'Cartier Love Necklace','slug':'cartier-love-necklace','category_slug':'accessories',
      'description':'Elegant pendant from the Cartier Love collection in 18K yellow gold.',
      'short_description':'18K yellow gold Love pendant',
      'price':3200.00,'compare_price':None,'sku':'AC-003','stock':6,'is_featured':False},
     ['products/Cartier_yellow_gold_love_necklace.webp','products/love_neck_2.avif'], True),

    # Sports
    ({'name':'Premium Non-Slip Yoga Mat','slug':'premium-non-slip-yoga-mat','category_slug':'sports',
      'description':'Eco-friendly TPE yoga mat with superior grip, 6mm cushioning, and alignment lines.',
      'short_description':'6mm eco-friendly grip yoga mat',
      'price':64.00,'compare_price':85.00,'sku':'SP-001','stock':50,'is_featured':True},
     ['products/yoga_mat_premim.webp'], False),

    ({'name':'Pilates Reformer Board','slug':'pilates-reformer-board','category_slug':'sports',
      'description':'Compact portable pilates reformer board for home workouts. Adjustable resistance.',
      'short_description':'Portable home pilates reformer',
      'price':189.00,'compare_price':240.00,'sku':'SP-002','stock':15,'is_featured':False},
     ['products/pilates_board.webp'], True),

    ({'name':'Indoor Tropical Plant Set','slug':'indoor-tropical-plant-set','category_slug':'sports',
      'description':'A curated collection of 3 low-maintenance tropical houseplants.',
      'short_description':'Set of 3 low-maintenance indoor plants',
      'price':49.00,'compare_price':None,'sku':'SP-003','stock':20,'is_featured':False},
     ['products/indoor_plant_set.webp'], False),
]

# ── SEASONAL KITS ─────────────────────────────────────────────────────────────
# Format: (kit_dict, [product_slugs_with_optional_note])
SEASONAL_KITS = [
    (
        {
            'name': 'Summer Glow Kit',
            'slug': 'summer-glow-kit',
            'badge': 'Summer Edition',
            'description': (
                'Everything you need for a radiant summer complexion — sun protection, '
                'a bronzed flush, hydrated lips, and a locked-in finish that lasts all day.'
            ),
            'is_active': True,
            'order': 1,
        },
        [
            ('spf-50-hydrating-sunscreen-mist', 'SPF 50 protection + hydration'),
            ('dior-blush-bronze-sculpting-duo', 'Sun-kissed bronzed finish'),
            ('tinted-lip-balm-spf15', 'Sheer tint with SPF protection'),
            ('waterproof-setting-spray', 'All-day makeup lock'),
        ],
    ),
    (
        {
            'name': 'Winter Repair Kit',
            'slug': 'winter-repair-kit',
            'badge': 'Winter Edition',
            'description': (
                'Combat cold-weather dryness with this intensive repair collection — '
                'a heavy moisturiser, restorative lip balm, and concentrated repair serum.'
            ),
            'is_active': True,
            'order': 2,
        },
        [
            ('heavy-duty-winter-moisturiser', 'Deep barrier repair'),
            ('repair-lip-balm-overnight', 'Overnight lip restoration'),
            ('repair-serum-concentrate', 'Ceramide and peptide concentrate'),
        ],
    ),
    (
        {
            'name': 'Eid Beauty Box',
            'slug': 'eid-beauty-box',
            'badge': 'Eid Special',
            'description': (
                'A luxurious Eid-ready beauty set featuring long-lasting full-coverage '
                'makeup and a setting spray to keep you flawless from Iftar to celebration.'
            ),
            'is_active': True,
            'order': 3,
        },
        [
            ('long-lasting-matte-foundation', 'Transfer-proof 24-hour coverage'),
            ('dior-rosy-glow-blush', 'Radiant skin-adaptive blush'),
            ('dior-addict-lip-gloss', 'Plumping mirror-shine gloss'),
            ('waterproof-setting-spray', 'Sweat-proof all-day setting'),
        ],
    ),
]

# ── GIFT BOXES ─────────────────────────────────────────────────────────────────
GIFT_BOXES = [
    {'name': 'Classic Gift Box',  'slug': 'classic-gift-box',  'description': 'A beautifully wrapped classic gift box. Add any products you like from our store.', 'price': 5.00,  'max_items': 5,  'image': _img('gift_boxes/classic_box.jpg')},
    {'name': 'Luxury Gift Box',   'slug': 'luxury-gift-box',   'description': 'Premium luxury gift box with satin ribbon and tissue paper. Perfect for special occasions.', 'price': 12.00, 'max_items': 10, 'image': _img('gift_boxes/luxury_box.jpg')},
    {'name': 'Mini Surprise Box', 'slug': 'mini-surprise-box', 'description': 'A cute compact gift box for a sweet surprise. Holds up to 3 items.', 'price': 3.00,  'max_items': 3,  'image': _img('gift_boxes/mini_box.jpg')},
]


class Command(BaseCommand):
    help = 'Seed Grove demo data — Makeup, Accessories, Skin Care, Sports, Seasonal Kits, Gift Boxes'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Grove demo data...\n')

        # Superuser
        if not User.objects.filter(email='admin@grove.com').exists():
            User.objects.create_superuser(username='admin', email='admin@grove.com', password='admin123', first_name='Grove', last_name='Admin')
            self.stdout.write(self.style.SUCCESS('  Created superuser: admin@grove.com / admin123'))

        # Demo customer
        if not User.objects.filter(email='demo@grove.com').exists():
            User.objects.create_user(username='demo', email='demo@grove.com', password='demo1234', first_name='Demo', last_name='Customer')
            self.stdout.write(self.style.SUCCESS('  Created demo user: demo@grove.com / demo1234'))

        # Categories
        cat_map = {}
        for cd in CATEGORIES:
            cat, created = Category.objects.get_or_create(slug=cd['slug'], defaults={k: v for k, v in cd.items() if k != 'slug'})
            cat_map[cd['slug']] = cat
            if created:
                self.stdout.write(f'  Created category: {cat.name}')

        # Products
        prod_map = {}
        for pdata, images, is_new in PRODUCTS:
            cat_slug = pdata.pop('category_slug')
            pdata['category'] = cat_map.get(cat_slug)
            pdata['is_active'] = True
            pdata['is_new_arrival'] = is_new
            pdata.setdefault('compare_price', None)
            product, created = Product.objects.get_or_create(slug=pdata['slug'], defaults=pdata)
            prod_map[product.slug] = product
            if created:
                self.stdout.write(f'  Created product: {product.name}{"  [NEW]" if is_new else ""}')
                for i, img_rel in enumerate(images):
                    if img_rel and _img(img_rel):
                        ProductImage.objects.create(product=product, image=img_rel, alt_text=product.name, is_primary=(i == 0), order=i)

        # Seasonal Kits
        for kit_data, item_slugs in SEASONAL_KITS:
            kit, created = SeasonalKit.objects.get_or_create(slug=kit_data['slug'], defaults=kit_data)
            if created:
                self.stdout.write(f'  Created seasonal kit: {kit.name}')
                for order_idx, (slug, note) in enumerate(item_slugs):
                    prod = prod_map.get(slug)
                    if prod:
                        SeasonalKitItem.objects.get_or_create(kit=kit, product=prod, defaults={'note': note, 'order': order_idx})
                    else:
                        self.stdout.write(self.style.WARNING(f'    Product not found: {slug}'))

        # Gift Boxes
        for gb_data in GIFT_BOXES:
            gb, created = GiftBox.objects.get_or_create(slug=gb_data['slug'], defaults={k: v for k, v in gb_data.items() if k != 'slug'})
            if created:
                self.stdout.write(f'  Created gift box: {gb.name}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
        self.stdout.write('  Admin : admin@grove.com / admin123')
        self.stdout.write('  Demo  : demo@grove.com  / demo1234')
