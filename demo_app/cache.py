"""
Cache system for AI responses
Stores responses to avoid redundant API calls
"""

import os
import json
import hashlib
from pathlib import Path
from datetime import datetime, timedelta

CACHE_DIR = Path(__file__).parent / 'ai_cache'
CACHE_DIR.mkdir(exist_ok=True)

def get_cache_key(topic, content_hash=None):
    """Generate cache key from topic"""
    # Use topic as primary cache key
    clean_topic = topic.lower().strip()
    # Add hash if content provided
    if content_hash:
        return f"{clean_topic}_{content_hash}"
    return clean_topic

def get_content_hash(content):
    """Get MD5 hash of content"""
    return hashlib.md5(content.encode()).hexdigest()[:8]

def get_cache_file(cache_key):
    """Get cache file path"""
    return CACHE_DIR / f"{cache_key}.json"

def save_to_cache(cache_key, data, ttl_hours=24):
    """Save data to cache with TTL"""
    cache_file = get_cache_file(cache_key)
    
    cache_data = {
        'timestamp': datetime.now().isoformat(),
        'ttl_hours': ttl_hours,
        'data': data
    }
    
    try:
        with open(cache_file, 'w') as f:
            json.dump(cache_data, f, indent=2)
        print(f"💾 Cached: {cache_key}")
        return True
    except Exception as e:
        print(f"❌ Cache save error: {e}")
        return False

def load_from_cache(cache_key):
    """Load data from cache if valid"""
    cache_file = get_cache_file(cache_key)
    
    if not cache_file.exists():
        return None
    
    try:
        with open(cache_file, 'r') as f:
            cache_data = json.load(f)
        
        # Check TTL
        timestamp = datetime.fromisoformat(cache_data['timestamp'])
        ttl_hours = cache_data.get('ttl_hours', 24)
        expiry = timestamp + timedelta(hours=ttl_hours)
        
        if datetime.now() < expiry:
            print(f"✅ Cache hit: {cache_key}")
            return cache_data['data']
        else:
            print(f"⏰ Cache expired: {cache_key}")
            cache_file.unlink()
            return None
            
    except Exception as e:
        print(f"❌ Cache load error: {e}")
        return None

def clear_cache():
    """Clear all cache"""
    try:
        for cache_file in CACHE_DIR.glob('*.json'):
            cache_file.unlink()
        print("🗑️ Cache cleared")
        return True
    except Exception as e:
        print(f"❌ Cache clear error: {e}")
        return False

def cache_stats():
    """Get cache statistics"""
    cache_files = list(CACHE_DIR.glob('*.json'))
    total_size = sum(f.stat().st_size for f in cache_files)
    return {
        'count': len(cache_files),
        'size_mb': round(total_size / 1024 / 1024, 2)
    }
