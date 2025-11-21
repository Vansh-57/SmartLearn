n=int(input())
nums=list(map(int,input().split()))
left=0
right=len(nums)-1
max_area=0
while left < right:
    height=min(nums[left] , nums[right])
    width=right-left
    area=height*width
    max_area=max(max_area,area)
    if nums[left] < nums[right]:
        left+=1
    else:
        right-=1
print(max_area)