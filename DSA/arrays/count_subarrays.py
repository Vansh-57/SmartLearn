# Q2: Count the number of subarrays of size k with sum less than x.
# Input:
# arr = [2, 3, 4, 2, 1, 5, 6]
# k = 3, x = 8
# Output:
# 3
def count_arr(arr,k,target):
    window=sum(arr[:k])
    count=0
    
    if window > target:
        count+=1
    for i in range(k,len(arr)):
        window=window - arr[i-k] + arr[i]
        if window > target :
            count+=1
    return count
print(count_arr([2, 3, 4, 2, 1, 5, 6],3,8))
    