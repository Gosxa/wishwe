from django.urls import path, include
from rest_framework.routers import DefaultRouter

from user.views import (
    google_auth,
    email_start,
    verify_code,
    resend_code,
    set_password,
    reset_password,
    set_new_password,
    ProfileViewSet,
    FriendshipViewSet,
    UserViewSet,
    InviteViewSet,
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    logout_user,
)


router = DefaultRouter()

router.register("profile", ProfileViewSet, basename="profile")
router.register("friendship", FriendshipViewSet, basename="friendship")
router.register("users", UserViewSet, basename="user")
router.register("invite", InviteViewSet, basename="invite")

urlpatterns = [
    path("auth/token/", CookieTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", logout_user, name="logout"),
    path("auth/google/", google_auth, name="google"),
    path("auth/email-start/", email_start, name="email_start"),
    path("auth/verify-code/", verify_code, name="verify_code"),
    path("auth/resend-code/", resend_code, name="resend_code"),
    path("auth/set-password/", set_password, name="set_password"),
    path("auth/reset-password/", reset_password, name="reset_password"),
    path("auth/set-new-password/", set_new_password, name="set_new_password"),
    path("", include(router.urls)),
]

app_name = "user"
