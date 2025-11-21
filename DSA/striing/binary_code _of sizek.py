s=input().strip()
k=int(input())
needed=2**k
seen=set()
for i in range(len(s)-k+1):
    substring=s[i:i+k]
    seen.add(substring)
    if len(seen)==needed:
        break
if len(seen)==needed:
    print('YES')
else:
    print("NO")