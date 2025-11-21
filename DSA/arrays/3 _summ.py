n=int(input())
nums=list(map(int,input().split()))
nums.sort()
res=[]
for i in range(n-2):
    if i > 0 and nums[i]==nums[i-1]:
        continue
    
    a=nums[i]
    
    l,r=i+1 , n-1
    while l < r :
        total=a + nums[l] + nums[r]
        if total < 0:
            l+=1
        elif total > 0:
            r-=1
        else:
            res.append([a,nums[l] , nums[r]])
            l+=1
            r-=1
            
            while l < r and nums[l]==nums[l-1]:
                l+=1
            while r > l and nums[r]==nums[r+1]:
                r-=1
print(res)