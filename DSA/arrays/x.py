s=input()
left=0
right=len(s)-1
vowels=set('aeiouAEIOU')
while left < right :
    if s[left]and s[right] in vowels:
        s=list(s)
        s[left],s[right]=s[right],s[left]
        left+=1
        right-=1
print(s)