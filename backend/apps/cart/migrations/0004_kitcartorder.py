from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('cart', '0003_alter_cartitem_unique_together_cartitem_variant_sku'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='KitCartOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('kit_slug', models.CharField(max_length=200)),
                ('kit_name', models.CharField(max_length=200)),
                ('added_at', models.DateTimeField(auto_now_add=True)),
                ('product_names', models.TextField(help_text='Comma-separated list of product names added from the kit')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='kit_cart_orders', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Kit Cart Order',
                'verbose_name_plural': 'Kit Cart Orders',
                'ordering': ['-added_at'],
            },
        ),
    ]
