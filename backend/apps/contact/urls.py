from django.urls import path
from .views import ContactMessageCreateView, AdminContactListView, AdminContactDetailView

urlpatterns = [
    path('', ContactMessageCreateView.as_view(), name='contact'),
    path('admin/messages/', AdminContactListView.as_view(), name='admin_contact_list'),
    path('admin/messages/<int:pk>/', AdminContactDetailView.as_view(), name='admin_contact_detail'),
]
