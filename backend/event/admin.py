from django.contrib import admin
from .models import Event, Category, EventParticipant


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_type', 'creator', 'status', 'created_at')
    list_filter = ('event_type', 'status', 'event_visibility')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at', 'participants_count', 'interested_count')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)


@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'status', 'joined_at')
