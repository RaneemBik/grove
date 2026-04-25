from django.urls import path
from .views import (
    CheckoutView, OrderListView, OrderDetailView, CancelOrderView,
    AdminOrderListView, AdminOrderDetailView,
    AdminUpdateOrderStatusView, AdminAnalyticsView,
    ConfirmStripePaymentView, StripeWebhookView,
    CalculateTotalView,
)

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('calculate-total/', CalculateTotalView.as_view(), name='calculate_total'),
    path('stripe/webhook/', StripeWebhookView.as_view(), name='stripe_webhook'),
    path('', OrderListView.as_view(), name='order_list'),
    path('<str:order_number>/', OrderDetailView.as_view(), name='order_detail'),
    path('<str:order_number>/cancel/', CancelOrderView.as_view(), name='order_cancel'),
    path('<str:order_number>/confirm-payment/', ConfirmStripePaymentView.as_view(), name='order_confirm_payment'),
    # Admin
    path('admin/orders/', AdminOrderListView.as_view(), name='admin_order_list'),
    path('admin/orders/<str:order_number>/', AdminOrderDetailView.as_view(), name='admin_order_detail'),
    path('admin/orders/<str:order_number>/status/', AdminUpdateOrderStatusView.as_view(), name='admin_order_status'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin_analytics'),
]
