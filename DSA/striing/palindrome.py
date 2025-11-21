def palindrome(s):
    s=list(s)
    left=0
    right=len(s)-1
    found=True
    
    while left < right :
        if s[left]!=s[right]:
            found=False
        left+=1
        right-=1
    return found
print(palindrome("madam"))