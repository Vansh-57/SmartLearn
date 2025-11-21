# 2. LeetCode 345. Reverse Vowels of a String

# Two pointers from both ends.

# Slightly tricky but very common.
def rev_vowels(s):
    s=list(s)
    vowels=set('aeiouAEIOU')
    left,right=0,len(s)-1
    while left < right :
        if s[left] not in vowels:
            left+=1
        elif s[right] not in vowels:
            right-=1
        else:
            s[left],s[right]=s[right],s[left]
            left+=1
            right-=1
    return "".join(s)
print(rev_vowels("IceCreAm"))