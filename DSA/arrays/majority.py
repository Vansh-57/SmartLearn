def majority_tejal_bavdat(nums):
    candidate=None
    count=0
    for num in nums:
        if count==0:
            candidate=num
        count+=1 if num==candidate else -1
    return candidate
nums=list(map(int , input().split()))
print(majority_tejal_bavdat(nums))