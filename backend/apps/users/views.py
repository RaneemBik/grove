import logging
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from datetime import timedelta, datetime, timezone as dt_timezone
from .serializers import (
    RegisterSerializer, UserSerializer, UpdateProfileSerializer,
    ChangePasswordSerializer, AddressSerializer, AdminUserSerializer
    , PasswordResetRequestSerializer, PasswordResetConfirmSerializer, SubscribeSerializer
)
from .models import Address

User = get_user_model()
logger = logging.getLogger(__name__)


def _revoke_all_refresh_tokens(user):
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)


def _deactivate_subscription(user):
    user.is_subscriber = False
    user.subscription_plan = 'none'
    user.subscription_started_at = None
    user.subscription_expires_at = None
    user.stripe_subscription_id = ''
    user.save(update_fields=['is_subscriber', 'subscription_plan', 'subscription_started_at', 'subscription_expires_at', 'stripe_subscription_id'])


def _grant_daily_loyalty_point(user):
    if not getattr(user, 'is_subscriber', False):
        return
    today = timezone.localdate()
    if user.last_loyalty_daily_at == today:
        return
    user.loyalty_points = (user.loyalty_points or 0) + 1
    user.last_loyalty_daily_at = today
    user.save(update_fields=['loyalty_points', 'last_loyalty_daily_at'])


def _sync_subscription_status(user):
    now = timezone.now()
    if user.subscription_expires_at and user.subscription_expires_at <= now and not user.stripe_subscription_id:
        _deactivate_subscription(user)
        return

    if not settings.STRIPE_SECRET_KEY or not user.stripe_subscription_id:
        return

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        sub = stripe.Subscription.retrieve(user.stripe_subscription_id)
    except Exception:
        return

    status = getattr(sub, 'status', '')
    period_end_ts = getattr(sub, 'current_period_end', None)
    period_end = datetime.fromtimestamp(period_end_ts, tz=dt_timezone.utc) if period_end_ts else user.subscription_expires_at

    if status in ['active', 'trialing', 'past_due']:
        interval = 'month'
        try:
            interval = sub['items']['data'][0]['price']['recurring']['interval']
        except Exception:
            pass
        user.is_subscriber = True
        user.subscription_plan = 'yearly' if interval == 'year' else 'monthly'
        if not user.subscription_started_at:
            user.subscription_started_at = now
        user.subscription_expires_at = period_end
        user.save(update_fields=['is_subscriber', 'subscription_plan', 'subscription_started_at', 'subscription_expires_at'])
        return

    if status in ['canceled', 'unpaid', 'incomplete_expired']:
        _deactivate_subscription(user)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'message': 'Registration successful.',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({'success': False, 'message': 'Refresh token required.'}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'success': True, 'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except TokenError:
            return Response({'success': False, 'message': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        _sync_subscription_status(self.request.user)
        _grant_daily_loyalty_point(self.request.user)
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Profile updated.',
            'user': UserSerializer(request.user).data
        })


class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'success': False, 'message': 'Old password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        _revoke_all_refresh_tokens(user)
        return Response({'success': True, 'message': 'Password changed successfully.'})


class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class SetDefaultAddressView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            address = Address.objects.get(pk=pk, user=request.user)
            address.is_default = True
            address.save()
            return Response({'success': True, 'message': 'Default address set.'})
        except Address.DoesNotExist:
            return Response({'success': False, 'message': 'Address not found.'}, status=status.HTTP_404_NOT_FOUND)


# Admin Views
class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = (permissions.IsAdminUser,)
    search_fields = ('email', 'username', 'first_name', 'last_name')
    filterset_fields = ('is_staff', 'is_active')


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = (permissions.IsAdminUser,)


class PasswordResetRequestView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.filter(email=email, is_active=True).first()

        email_sent = False
        email_error = ''

        # Do not reveal whether the email exists.
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/auth/reset-password?uid={uid}&token={token}"
            try:
                send_mail(
                    subject='Reset your password',
                    message=(
                        'We received a request to reset your password.\n\n'
                        f'Reset link: {reset_url}\n\n'
                        'If you did not request this, you can ignore this email.'
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as exc:
                email_error = str(exc)
                logger.exception('Failed to send password reset email.')
                return Response(
                    {
                        'success': False,
                        'message': 'Could not send reset email right now. Please try again later.',
                        'email_sent': False,
                        'email_error': email_error if settings.DEBUG else '',
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response({'success': True, 'message': 'If the email exists, a reset link has been sent.', 'email_sent': email_sent})


class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']

        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id, is_active=True)
        except Exception:
            return Response({'success': False, 'message': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'success': False, 'message': 'Reset token is invalid or expired.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        _revoke_all_refresh_tokens(user)
        return Response({'success': True, 'message': 'Password reset successful.'})


class ResetPasswordProfileView(APIView):
    """Allow authenticated users to reset password directly from profile"""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data['old_password']

        # Verify old password is correct
        if not user.check_password(old_password):
            return Response(
                {'success': False, 'message': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        _revoke_all_refresh_tokens(user)

        return Response({
            'success': True,
            'message': 'Password reset successful. Please log in with your new password.'
        })


class SubscribeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = serializer.validated_data['plan']
        user = request.user

        self._activate_subscription(user, plan)
        return Response({'success': True, 'message': 'Subscription activated.', 'plan': plan})

    @staticmethod
    def _activate_subscription(user, plan, stripe_subscription_id='', period_end=None):
        now = timezone.now()
        if period_end is None:
            period_end = now + (timedelta(days=365) if plan == 'yearly' else timedelta(days=30))
        user.is_subscriber = True
        user.subscription_plan = plan
        user.subscription_started_at = now
        user.subscription_expires_at = period_end
        if stripe_subscription_id:
            user.stripe_subscription_id = stripe_subscription_id
        user.save(update_fields=['is_subscriber', 'subscription_plan', 'subscription_started_at', 'subscription_expires_at', 'stripe_subscription_id'])


class ConfirmSubscriptionView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'success': False, 'message': 'session_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.STRIPE_SECRET_KEY:
            return Response({'success': False, 'message': 'Stripe is not configured.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.retrieve(session_id, expand=['subscription'])

            metadata = session.metadata or {}
            if metadata.get('user_id') and str(metadata.get('user_id')) != str(request.user.id):
                return Response({'success': False, 'message': 'Session does not belong to this user.'}, status=status.HTTP_400_BAD_REQUEST)

            if session.mode != 'subscription' or session.status != 'complete':
                return Response({'success': False, 'message': 'Subscription checkout is not complete yet.'}, status=status.HTTP_400_BAD_REQUEST)

            stripe_subscription_id = session.subscription.id if hasattr(session.subscription, 'id') else session.subscription
            if not stripe_subscription_id:
                return Response({'success': False, 'message': 'Subscription was not created by Stripe.'}, status=status.HTTP_400_BAD_REQUEST)

            sub = session.subscription if hasattr(session.subscription, 'status') else stripe.Subscription.retrieve(stripe_subscription_id)
            if sub.status not in ['active', 'trialing', 'past_due']:
                return Response({'success': False, 'message': f'Subscription status is {sub.status}.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                interval = sub['items']['data'][0]['price']['recurring']['interval']
            except Exception:
                interval = 'month'
            plan = 'yearly' if interval == 'year' else 'monthly'
            period_end = datetime.fromtimestamp(sub.current_period_end, tz=dt_timezone.utc)

            user = request.user
            if getattr(session, 'customer', None) and user.stripe_customer_id != session.customer:
                user.stripe_customer_id = session.customer
                user.save(update_fields=['stripe_customer_id'])

            SubscribeView._activate_subscription(user, plan, stripe_subscription_id=stripe_subscription_id, period_end=period_end)
            return Response({'success': True, 'message': 'Subscription activated.', 'plan': plan, 'subscription_expires_at': period_end})
        except Exception as e:
            return Response({'success': False, 'message': f'Unable to confirm subscription: {e}'}, status=status.HTTP_400_BAD_REQUEST)


class CancelSubscriptionView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        if settings.STRIPE_SECRET_KEY and user.stripe_subscription_id:
            try:
                import stripe
                stripe.api_key = settings.STRIPE_SECRET_KEY
                sub = stripe.Subscription.retrieve(user.stripe_subscription_id)
                if sub.status in ['canceled', 'incomplete_expired', 'unpaid']:
                    _deactivate_subscription(user)
                    return Response({'success': True, 'message': 'Subscription already inactive.'})

                stripe.Subscription.delete(user.stripe_subscription_id)
            except Exception as e:
                return Response({'success': False, 'message': f'Unable to cancel subscription: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        _deactivate_subscription(user)
        return Response({'success': True, 'message': 'Subscription cancelled.'})
