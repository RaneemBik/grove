import logging
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from .models import ContactMessage
from .serializers import ContactMessageSerializer

logger = logging.getLogger(__name__)


class ContactMessageCreateView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ip = self.request.META.get('REMOTE_ADDR')
        msg = serializer.save(ip_address=ip)

        recipient = (
            getattr(settings, 'CONTACT_RECIPIENT_EMAIL', '').strip()
            or getattr(settings, 'EMAIL_HOST_USER', '').strip()
            or getattr(settings, 'DEFAULT_FROM_EMAIL', '').strip()
        )

        email_sent = False
        email_error = ''
        if recipient:
            try:
                send_mail(
                    subject=f"New Contact: {msg.subject}",
                    message=(
                        f"From: {msg.name}\n\n"
                        f"Subject: {msg.subject}\n\n"
                        f"{msg.message}"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as exc:
                email_error = str(exc)
                logger.exception('Failed to send contact email notification.')
                return Response(
                    {
                        'success': False,
                        'message': 'Message saved, but email delivery failed. Please try again later.',
                        'email_sent': False,
                        'email_error': email_error if settings.DEBUG else '',
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            return Response(
                {
                    'success': False,
                    'message': 'Contact email recipient is not configured on server.',
                    'email_sent': False,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        payload = {
            'success': True,
            'message': 'Your message has been received. We will get back to you soon.',
            'email_sent': email_sent,
        }
        return Response(payload, status=status.HTTP_201_CREATED)


class AdminContactListView(generics.ListAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = (permissions.IsAdminUser,)
    filterset_fields = ('status',)
    search_fields = ('name', 'email', 'subject')


class AdminContactDetailView(generics.RetrieveUpdateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = (permissions.IsAdminUser,)
