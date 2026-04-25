from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Address


class AddressInline(admin.TabularInline):
    model = Address
    extra = 0
    readonly_fields = ('created_at',)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'full_name', 'is_staff', 'is_active', 'is_subscriber', 'subscription_plan', 'loyalty_points', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'is_subscriber', 'subscription_plan', 'date_joined')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    inlines = [AddressInline]
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone', 'avatar', 'date_of_birth')}),
        ('Membership', {'fields': ('is_subscriber', 'subscription_plan', 'subscription_started_at', 'subscription_expires_at', 'loyalty_points', 'last_loyalty_daily_at', 'stripe_customer_id', 'stripe_subscription_id')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('email', 'first_name', 'last_name', 'phone')}),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'city', 'country', 'is_default', 'address_type')
    list_filter = ('country', 'address_type', 'is_default')
    search_fields = ('full_name', 'user__email', 'city', 'country')
