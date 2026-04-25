from django.urls import path
from .views import CartView, AddToCartView, CartItemUpdateView, AddKitToCartView

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('add/', AddToCartView.as_view(), name='cart_add'),
    path('add-kit/', AddKitToCartView.as_view(), name='cart_add_kit'),
    path('items/<int:item_id>/', CartItemUpdateView.as_view(), name='cart_item'),
]
