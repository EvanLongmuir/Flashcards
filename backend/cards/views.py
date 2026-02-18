from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import get_dev_user
from .models import Card, Tag, CardRelation
from .serializers import CardSerializer, TagSerializer, CardRelationSerializer


class TagListCreateView(generics.ListCreateAPIView):
    serializer_class = TagSerializer

    def get_queryset(self):
        user = get_dev_user()
        return Tag.objects.filter(owner=user).order_by("name")

    def perform_create(self, serializer):
        user = get_dev_user()
        serializer.save(owner=user)


class TagDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = TagSerializer

    def get_queryset(self):
        user = get_dev_user()
        return Tag.objects.filter(owner=user)


class CardListCreateView(generics.ListCreateAPIView):
    serializer_class = CardSerializer

    def get_queryset(self):
        user = get_dev_user()
        qs = Card.objects.filter(owner=user).order_by("-created_at")

        tag = self.request.query_params.get("tag")
        if tag:
            # tag can be numeric id or name
            if tag.isdigit():
                qs = qs.filter(tags__id=int(tag))
            else:
                qs = qs.filter(tags__name=tag)
        return qs.distinct()

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        user = get_dev_user()
        serializer.save(owner=user)


class CardDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CardSerializer

    def get_queryset(self):
        user = get_dev_user()
        return Card.objects.filter(owner=user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class RelatedCardsView(APIView):
    """
    GET /api/cards/<id>/related  -> list outgoing related
    POST /api/cards/<id>/related -> create relation to another card { "to_card": 123, "note": "" }
    DELETE /api/cards/<id>/related/<related_id> -> delete relation by relation id
    """

    def get(self, request, card_id):
        user = get_dev_user()
        relations = CardRelation.objects.filter(owner=user, from_card_id=card_id).order_by("id")
        return Response(CardRelationSerializer(relations, many=True).data)

    def post(self, request, card_id):
        user = get_dev_user()
        data = request.data.copy()
        data["from_card"] = card_id

        serializer = CardRelationSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        # ensure cards belong to the user
        from_ok = Card.objects.filter(id=serializer.validated_data["from_card"].id, owner=user).exists()
        to_ok = Card.objects.filter(id=serializer.validated_data["to_card"].id, owner=user).exists()
        if not (from_ok and to_ok):
            return Response({"detail": "Card not found."}, status=status.HTTP_404_NOT_FOUND)

        rel = CardRelation.objects.create(
            owner=user,
            from_card_id=card_id,
            to_card_id=serializer.validated_data["to_card"].id,
            note=serializer.validated_data.get("note", ""),
        )
        return Response(CardRelationSerializer(rel).data, status=status.HTTP_201_CREATED)

    def delete(self, request, card_id, relation_id):
        user = get_dev_user()
        deleted, _ = CardRelation.objects.filter(owner=user, from_card_id=card_id, id=relation_id).delete()
        if deleted == 0:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

