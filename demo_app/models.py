from django.db import models
from django.contrib.auth.models import User
from datetime import date

# ============================================
# Search History - Stores all user searches
# ============================================
class SearchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='search_history')
    query = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    flashcard_count = models.IntegerField(default=0)
    mcq_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'search_history'
        ordering = ['-timestamp']
        verbose_name = 'Search History'
        verbose_name_plural = 'Search Histories'
    
    def __str__(self):
        return f"{self.user.username} - {self.query}"


# ============================================
# Bookmarks - Stores starred/favorite topics
# ============================================
class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    query = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'bookmarks'
        ordering = ['-timestamp']
        unique_together = ['user', 'query']  # Prevent duplicate bookmarks
        verbose_name = 'Bookmark'
        verbose_name_plural = 'Bookmarks'
    
    def __str__(self):
        return f"{self.user.username} - ⭐ {self.query}"


# ============================================
# Study Streaks - Daily login tracking
# ============================================

# ===============================
# Study Streak Model
# ===============================
class StudyStreak(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='study_streak')
    last_login_date = models.DateField(default=date.today)
    current_streak = models.IntegerField(default=1)
    longest_streak = models.IntegerField(default=1)
    total_logins = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'study_streaks'
        verbose_name = 'Study Streak'
        verbose_name_plural = 'Study Streaks'

    def __str__(self):
        return f"{self.user.username} - 🔥 {self.current_streak} days"


#==================STREKKKK
# ============================================
class StudyStreakLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='streak_logs')
    date = models.DateField()

    class Meta:
        db_table = 'study_streak_logs'
        ordering = ['date']
        unique_together = ['user', 'date']  # Prevent duplicate entries

    def __str__(self):
        return f"{self.user.username} - {self.date}"