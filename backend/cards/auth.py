from django.contrib.auth import get_user_model
from rest_framework.exceptions import NotAuthenticated

User = get_user_model()

def get_dev_user():
    user = User.objects.order_by("id").first()
    if not user:
        raise NotAuthenticated("Create a user first (python manage.py createsuperuser).")
    return user
