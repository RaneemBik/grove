from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_orderitem_variant_description_orderitem_variant_sku'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='gift_box_total',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
    ]
