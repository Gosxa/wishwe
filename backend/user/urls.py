from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from user.views import (
    google_auth,
    request_code,
    verify_code,
    set_password
)


urlpatterns = [
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/google/", google_auth, name="google"),
    path("auth/request-code/", request_code, name="request_code"),
    path("auth/verify-code/", verify_code, name="verify_code"),
    path("auth/set-password/", set_password, name="set_password"),
]

app_name = "user"
