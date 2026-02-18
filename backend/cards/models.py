from django.conf import settings
from django.db import models


class Tag(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tags")
    name = models.CharField(max_length=64)

    class Meta:
        unique_together = [("owner", "name")]

    def __str__(self):
        return self.name


class Card(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cards")

    front_image = models.ImageField(upload_to="cards/front/", null=True, blank=True)
    back_image = models.ImageField(upload_to="cards/back/", null=True, blank=True)

    # Optional text fields (helpful even if you mostly use images)
    front_text = models.CharField(max_length=255, blank=True, default="")
    back_text = models.CharField(max_length=255, blank=True, default="")

    tags = models.ManyToManyField(Tag, blank=True, related_name="cards")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Card {self.id}"


class CardRelation(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="card_relations")
    from_card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name="outgoing_relations")
    to_card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name="incoming_relations")
    note = models.CharField(max_length=140, blank=True, default="")

    class Meta:
        unique_together = [("owner", "from_card", "to_card")]

