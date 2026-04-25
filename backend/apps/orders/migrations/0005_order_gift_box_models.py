from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0004_order_gift_box_total'),
        ('products', '0005_productvariantsku_description_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='OrderGiftBox',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('gift_box_name', models.CharField(max_length=200)),
                ('gift_box_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gift_boxes', to='orders.order')),
            ],
            options={
                'verbose_name': 'Order Gift Box',
                'verbose_name_plural': 'Order Gift Boxes',
                'ordering': ['id'],
            },
        ),
        migrations.CreateModel(
            name='OrderGiftBoxItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('product_name', models.CharField(max_length=255)),
                ('product_sku', models.CharField(blank=True, max_length=100)),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('order_gift_box', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='orders.ordergiftbox')),
                ('product', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='gift_box_order_items', to='products.product')),
            ],
            options={
                'verbose_name': 'Order Gift Box Item',
                'verbose_name_plural': 'Order Gift Box Items',
                'ordering': ['id'],
            },
        ),
    ]
