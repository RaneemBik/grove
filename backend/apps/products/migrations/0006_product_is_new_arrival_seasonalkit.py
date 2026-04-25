from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0005_productvariantsku_description_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='is_new_arrival',
            field=models.BooleanField(default=False, help_text='Show this product in the New Arrivals section'),
        ),
        migrations.CreateModel(
            name='SeasonalKit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('slug', models.SlugField(max_length=200, unique=True)),
                ('description', models.TextField(blank=True)),
                ('image', models.ImageField(blank=True, null=True, upload_to='seasonal_kits/')),
                ('badge', models.CharField(blank=True, help_text='Short badge label, e.g. "Summer Edition"', max_length=80)),
                ('is_active', models.BooleanField(default=True, help_text='Show this kit on the website')),
                ('order', models.PositiveIntegerField(default=0, help_text='Display order (lower = first)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Seasonal Kit',
                'verbose_name_plural': 'Seasonal Kits',
                'ordering': ['order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='SeasonalKitItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('note', models.CharField(blank=True, help_text='Optional display note, e.g. "SPF 50+"', max_length=200)),
                ('order', models.PositiveIntegerField(default=0)),
                ('kit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='products.seasonalkit')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='seasonal_kit_items', to='products.product')),
            ],
            options={
                'verbose_name': 'Kit Item',
                'verbose_name_plural': 'Kit Items',
                'ordering': ['order', 'id'],
                'unique_together': {('kit', 'product')},
            },
        ),
    ]
