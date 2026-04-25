from django.urls import path
from . import views

urlpatterns = [
    path('', views.gift_box_list, name='gift-box-list'),
    path('<slug:slug>/', views.gift_box_detail, name='gift-box-detail'),
    path('orders/my/', views.my_gift_box_orders, name='my-gift-box-orders'),
    path('orders/create/', views.create_gift_box_order, name='create-gift-box-order'),
    path('orders/<int:order_id>/', views.gift_box_order_detail, name='gift-box-order-detail'),
    path('orders/<int:order_id>/add/', views.add_item_to_gift_box, name='add-item-to-gift-box'),
    path('orders/<int:order_id>/clear/', views.clear_gift_box_order, name='clear-gift-box-order'),
    path('orders/<int:order_id>/items/<int:item_id>/remove/', views.remove_item_from_gift_box, name='remove-item-from-gift-box'),
]
