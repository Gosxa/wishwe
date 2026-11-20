from rest_framework.throttling import SimpleRateThrottle


class SupportRequestRateThrottle(SimpleRateThrottle):
    rate = "5/hour"
    scope = "support_request"

    def get_cache_key(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return None

        return self.cache_format % {
            "scope": self.scope,
            "ident": request.user.pk,
        }
