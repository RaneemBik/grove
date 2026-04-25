from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('products', '0005_productvariantsku_description_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='GiftBox',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('slug', models.SlugField(max_length=200, unique=True)),
                ('description', models.TextField(blank=True)),
                ('price', models.DecimalField(decimal_places=2, default=5.0, max_digits=10)),
                ('image', models.ImageField(blank=True, null=True, upload_to='gift_boxes/')),
                ('max_items', models.PositiveIntegerField(default=10)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Gift Box',
                'verbose_name_plural': 'Gift Boxes',
                'ordering': ['price'],
            },
        ),
        migrations.CreateModel(
            name='GiftBoxOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_key', models.CharField(blank=True, max_length=100, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('checked_out', models.BooleanField(default=False)),
                ('gift_box', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='orders', to='gift_boxes.giftbox')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='gift_box_orders', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Gift Box Order',
                'verbose_name_plural': 'Gift Box Orders',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='GiftBoxItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('gift_box_order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='gift_boxes.giftboxorder')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='products.product')),
            ],
            options={
                'verbose_name': 'Gift Box Item',
                'verbose_name_plural': 'Gift Box Items',
                'unique_together': {('gift_box_order', 'product')},
            },
        ),
    ]
