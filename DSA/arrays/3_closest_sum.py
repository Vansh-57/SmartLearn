n=int(input())
nums=list(map(int , input().split()))
target=int(input())
closest_sum=nums[0] + nums[1] +nums[2]
for i in range(n-2):
    l,r=i+1,n-1
    
    while l < r:
        total = nums[i] + nums[l] + nums[r]
        if abs(total-target) < abs(closest_sum-target):
            closest_sum=total
            
        if total < target:
            l+=1
        elif total > target:
            r+=1
        else:
            print(total)
print(closest_sum)