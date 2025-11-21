n=int(input())
nums=list(map(int , input().split()))
k=int(input())
window=nums[:k]
res=[]
res.append(max(window))
for i in range(k,n):
    window=nums[i-k + 1 : i+1]
    res.append(max(window))
print(res)