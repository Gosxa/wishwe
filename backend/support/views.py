import logging

from django.conf import settings
from django.core.mail import EmailMessage, get_connection
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from support.models import SupportRequest
from support.serializers import SupportRequestSerializer
from support.throttles import SupportRequestRateThrottle


logger = logging.getLogger(__name__)


class SupportRequestCreateView(generics.CreateAPIView):
    serializer_class = SupportRequestSerializer
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (SupportRequestRateThrottle,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        support_request = serializer.save(user=request.user)
        support_email = settings.SUPPORT_EMAIL
        email_sent = False

        if support_email:
            subject = (
                "[WishWe Support] "
                f"[{support_request.get_category_display()}] "
                f"{support_request.id}"
            )
            body = "\n".join(
                (
                    "New WishWe support request",
                    f"Request ID: {support_request.id}",
                    f"Topic: {support_request.get_category_display()}",
                    f"Name: {support_request.display_name or 'Not provided'}",
                    f"Email: {support_request.email}",
                    f"User ID: {request.user.pk}",
                    f"Received: {support_request.created_at.isoformat()}",
                    "",
                    "Message:",
                    support_request.message,
                )
            )

            try:
                email = EmailMessage(
                    subject=subject,
                    body=body,
                    from_email=(
                        settings.EMAIL_HOST_USER
                        or settings.DEFAULT_FROM_EMAIL
                    ),
                    to=[support_email],
                    reply_to=[support_request.email],
                    connection=get_connection(
                        backend=settings.SUPPORT_EMAIL_BACKEND,
                    ),
                )
                email_sent = email.send(fail_silently=False) == 1
            except Exception:
                logger.exception(
                    "Could not send support request %s",
                    support_request.id,
                )

        support_request.delivery_status = (
            SupportRequest.DeliveryStatus.SENT
            if email_sent
            else SupportRequest.DeliveryStatus.FAILED
        )
        if email_sent:
            support_request.email_sent_at = timezone.now()
            support_request.save(
                update_fields=("delivery_status", "email_sent_at")
            )
        else:
            support_request.save(update_fields=("delivery_status",))
            logger.error(
                "Support request %s was saved but not emailed",
                support_request.id,
            )

        return Response(
            {
                "id": str(support_request.id),
                "delivery_status": support_request.delivery_status,
                "support_email": support_email or "",
            },
            status=status.HTTP_201_CREATED,
        )
