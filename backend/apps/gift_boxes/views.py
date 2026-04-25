from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import GiftBox, GiftBoxOrder, GiftBoxItem
from .serializers import GiftBoxSerializer, GiftBoxOrderSerializer, GiftBoxItemSerializer
from apps.products.models import Product


@api_view(['GET'])
@permission_classes([AllowAny])
def gift_box_list(request):
    """List all active gift boxes."""
    boxes = GiftBox.objects.filter(is_active=True)
    serializer = GiftBoxSerializer(boxes, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def gift_box_detail(request, slug):
    """Get a single gift box by slug."""
    box = get_object_or_404(GiftBox, slug=slug, is_active=True)
    serializer = GiftBoxSerializer(box, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_gift_box_order(request):
    """Create a new gift box order for the authenticated user."""
    gift_box_id = request.data.get('gift_box_id')
    if not gift_box_id:
        return Response({'error': 'gift_box_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    gift_box = get_object_or_404(GiftBox, id=gift_box_id, is_active=True)

    # Check if there's already an active (not checked out) order for this user+box
    existing = GiftBoxOrder.objects.filter(
        user=request.user, gift_box=gift_box, checked_out=False
    ).first()
    if existing:
        serializer = GiftBoxOrderSerializer(existing, context={'request': request})
        return Response(serializer.data)

    order = GiftBoxOrder.objects.create(user=request.user, gift_box=gift_box)
    serializer = GiftBoxOrderSerializer(order, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_gift_box_orders(request):
    """Get user's active (not checked out) gift box orders."""
    orders = GiftBoxOrder.objects.filter(user=request.user, checked_out=False).prefetch_related('items__product__images', 'gift_box')
    serializer = GiftBoxOrderSerializer(orders, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gift_box_order_detail(request, order_id):
    """Get a specific gift box order."""
    order = get_object_or_404(GiftBoxOrder, id=order_id, user=request.user)
    serializer = GiftBoxOrderSerializer(order, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_item_to_gift_box(request, order_id):
    """Add a product to a gift box order."""
    order = get_object_or_404(GiftBoxOrder, id=order_id, user=request.user, checked_out=False)
    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity', 1))

    if not product_id:
        return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    product = get_object_or_404(Product, id=product_id, is_active=True)

    # Check max items
    current_count = order.items.count()
    if current_count >= order.gift_box.max_items:
        return Response(
            {'error': f'This box can hold a maximum of {order.gift_box.max_items} products.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    item, created = GiftBoxItem.objects.get_or_create(
        gift_box_order=order,
        product=product,
        defaults={'quantity': quantity}
    )
    if not created:
        item.quantity += quantity
        item.save()

    serializer = GiftBoxOrderSerializer(order, context={'request': request})
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_item_from_gift_box(request, order_id, item_id):
    """Remove a product from a gift box order."""
    order = get_object_or_404(GiftBoxOrder, id=order_id, user=request.user, checked_out=False)
    item = get_object_or_404(GiftBoxItem, id=item_id, gift_box_order=order)
    item.delete()
    serializer = GiftBoxOrderSerializer(order, context={'request': request})
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_gift_box_order(request, order_id):
    """Clear all items from a gift box order."""
    order = get_object_or_404(GiftBoxOrder, id=order_id, user=request.user, checked_out=False)
    order.items.all().delete()
    serializer = GiftBoxOrderSerializer(order, context={'request': request})
    return Response(serializer.data)
