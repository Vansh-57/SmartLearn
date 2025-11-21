# Use two-pointer approach in sorted array.
# Input: arr = [1, 2, 3, 4, 5], target = 6
# Output: Pairs: [(1, 5), (2, 4)]

def two_sum(arr,target):
    seen=set()
    left=0
    right=len(arr)-1
    while left<right:
        total=arr[left]+arr[right]
        if total==target:
            seen.add((arr[left],arr[right]))
            left+=1
            right-=1
        elif total<target:
            left+=1
        else:
            right-=1
    print(list(seen))
two_sum([1, 2, 3, 4, 5],6)


            