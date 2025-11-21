s=input()
k=int(input())
count=0
for i in range(len(s)-k+1):
    substring=s[i:i+k]
    if substring==substring[::-1]:
        count+=1
print(count)