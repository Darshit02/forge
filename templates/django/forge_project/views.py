from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers, status
from drf_spectacular.utils import extend_schema

class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()

USERS_DB = [
    {"id": 1, "name": "Alice", "email": "alice@example.com"},
    {"id": 2, "name": "Bob", "email": "bob@example.com"},
]

@extend_schema(summary="System health check", responses={200: dict})
@api_view(['GET'])
def health_check(request):
    return Response({"status": "ok", "service": "django-backend"})

class UserListCreateAPIView(APIView):
    @extend_schema(summary="List all users", responses=UserSerializer(many=True))
    def get(self, request):
        return Response(USERS_DB)

    @extend_schema(summary="Create a user", request=UserSerializer, responses={201: UserSerializer})
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            new_user = {"id": len(USERS_DB) + 1, **serializer.validated_data}
            USERS_DB.append(new_user)
            return Response(new_user, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
