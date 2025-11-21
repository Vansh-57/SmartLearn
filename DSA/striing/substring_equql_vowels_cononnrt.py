s=input()
k=int(input())
vowels='aeiouAEIOU'
vowels_count=0
cons_count=0
count=0
for i in range(k):
    if s[i] in vowels:
        vowels_count+=1
    else:
        cons_count+=1
    if vowels_count==cons_count:
        count+=1
for i in range(k,len(s)):
    if s[i-k] in vowels:
        vowels_count-=1
    else:
        cons_count-=1
        
    if s[i] in vowels:
        vowels_count+=1
    else:
        cons_count+=1
    if vowels_count==cons_count:
        count+=1
print(count)