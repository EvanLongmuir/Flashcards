from rest_framework import serializers
from .models import Card, Tag, CardRelation


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class CardSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    #tag_ids = serializers.ListField(
    #    child=serializers.IntegerField(),
    #    write_only=True,
    #    required=False,
    #)
    tag_ids = serializers.CharField(write_only=True, required=False)

    front_image_url = serializers.SerializerMethodField()
    back_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Card
        fields = [
            "id",
            "front_text",
            "back_text",
            "front_image",
            "back_image",
            "front_image_url",
            "back_image_url",
            "tags",
            "tag_ids",
            "created_at",
        ]
        extra_kwargs = {
            "front_image": {"write_only": True, "required": False},
            "back_image": {"write_only": True, "required": False},
        }

    def get_front_image_url(self, obj):
        request = self.context.get("request")
        if obj.front_image and request:
            return request.build_absolute_uri(obj.front_image.url)
        return None

    def get_back_image_url(self, obj):
        request = self.context.get("request")
        if obj.back_image and request:
            return request.build_absolute_uri(obj.back_image.url)
        return None

    #def create(self, validated_data):
    #    tag_ids = validated_data.pop("tag_ids", [])
    #    card = Card.objects.create(**validated_data)

    #    if tag_ids:
    #        tags = Tag.objects.filter(id__in=tag_ids, owner=card.owner)
    #        card.tags.set(tags)
    #    return card

    #def update(self, instance, validated_data):
    #    tag_ids = validated_data.pop("tag_ids", None)

    #    for k, v in validated_data.items():
    #        setattr(instance, k, v)
    #    instance.save()

    #    if tag_ids is not None:
    #        tags = Tag.objects.filter(id__in=tag_ids, owner=instance.owner)
    #        instance.tags.set(tags)
    #    return instance

    def _parse_tag_ids(self, raw):
        if raw is None or raw == "":
            return []
        if isinstance(raw, str):
            return [int(x) for x in raw.split(",") if x.strip().isdigit()]
        return []

    def create(self, validated_data):
        raw_tag_ids = validated_data.pop("tag_ids", "")
        card = Card.objects.create(**validated_data)
        tag_ids = self._parse_tag_ids(raw_tag_ids)
        if tag_ids:
            tags = Tag.objects.filter(id__in=tag_ids, owner=card.owner)
            card.tags.set(tags)
        return card

    def update(self, instance, validated_data):
        raw_tag_ids = validated_data.pop("tag_ids", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        if raw_tag_ids is not None:
            tag_ids = self._parse_tag_ids(raw_tag_ids)
            tags = Tag.objects.filter(id__in=tag_ids, owner=instance.owner)
            instance.tags.set(tags)
        return instance


class CardRelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardRelation
        fields = ["id", "from_card", "to_card", "note"]

