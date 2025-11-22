from datetime import date
from .models import StudyStreak

def update_study_streak_on_search(user):
    """
    Update user's study streak when they perform a search
    """
    today = date.today()
    
    try:
        streak = StudyStreak.objects.get(user=user)
        
        # Check if user already logged in today
        if streak.last_login_date == today:
            # Already logged in today, no update needed
            return streak.current_streak
        
        # Check if streak continues (logged in yesterday)
        yesterday = date.fromordinal(today.toordinal() - 1)
        
        if streak.last_login_date == yesterday:
            # Streak continues
            streak.current_streak += 1
        elif streak.last_login_date < yesterday:
            # Streak broken, reset to 1
            streak.current_streak = 1
        
        # Update longest streak if current is higher
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak
        
        # Update last login date and total logins
        streak.last_login_date = today
        streak.total_logins += 1
        streak.save()
        
        return streak.current_streak
        
    except StudyStreak.DoesNotExist:
        # Create new streak record
        streak = StudyStreak.objects.create(
            user=user,
            last_login_date=today,
            current_streak=1,
            longest_streak=1,
            total_logins=1
        )
        return 1