n=int(input())
nums=list(map(int , input().split()))
k=int(input())

window=sum(nums[:k])
aver=window/k

max_average=aver
for i in range(k,n):
    window=window - nums[i-k] +nums[i] 
    aver_next=window / k
    max_average=max(aver_next , max_average)
print(max_average)