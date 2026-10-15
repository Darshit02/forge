from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from .views import health_check, UserListCreateAPIView

urlpatterns = [
    # OpenAPI spec json for Forge
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema.json', SpectacularAPIView.as_view(), name='schema-json'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Routes
    path('health', health_check, name='health'),
    path('users', UserListCreateAPIView.as_view(), name='users'),
]
