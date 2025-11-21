# 🎯 [Medium] 9. Count Subarrays of Size K with Target Sum
# Q: Count how many windows of size k have sum == target
# Input: arr=[1,2,3,1,1,1], k=3, target=5
# Output: 2 → [1,2,3], [1,1,1]
def count_subs(arr,k,target):
    k = k % len(arr)
    window_sum=(sum(arr[:k]))
    count=0
    if window_sum == target:
        count += 1
    for i in range(k,len(arr)):
        window_sum=window_sum - arr[i-k] + arr[i]
        if window_sum==target:
            count+=1
    print(count)
count_subs([1,2,3,1,1,1],3,6)
    