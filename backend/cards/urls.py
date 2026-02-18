from django.urls import path
from .views import TagListCreateView, TagDetailView, CardListCreateView, CardDetailView, RelatedCardsView

urlpatterns = [
    path("tags/", TagListCreateView.as_view()),
    path("tags/<int:pk>/", TagDetailView.as_view()),   # <-- add
    path("cards/", CardListCreateView.as_view()),
    path("cards/<int:pk>/", CardDetailView.as_view()),
    path("cards/<int:card_id>/related/", RelatedCardsView.as_view()),
    path("cards/<int:card_id>/related/<int:relation_id>/", RelatedCardsView.as_view()),
]
