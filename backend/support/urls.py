from django.urls import path

from support.views import SupportRequestCreateView


app_name = "support"

urlpatterns = [
    path(
        "requests/",
        SupportRequestCreateView.as_view(),
        name="request-create",
    ),
]
