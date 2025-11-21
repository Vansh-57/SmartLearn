s=input().strip()

count=1
compressed=[]

for i in range(1 , len(s)):
    if s[i]==s[i-1]:
        count+=1
    else:
        compressed.append(s[i-1])
        if count > 1:
            compressed.append(str(count))
compressed.append(s[-1])
if count > 1:
    compressed.append(str(count))
print(''.join(compressed))
