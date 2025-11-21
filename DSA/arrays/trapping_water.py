n=int(input())
height=list(map(int ,input().split()))
l,r=0,n-1
water=0
left_max=right_max=0

while l < r:
    if height[l] < height[r]:
        if height[l] > left_max:
            left_max=height[l]
        else:
            water+=left_max - height[l]
        l+=1
    else:
        if height[r] > right_max:
            right_max=height[r]
        else:
            water+=right_max - height[r]
        r-=1
print(water)