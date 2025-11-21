# arr = [1, 2, 4, 7, 11, 15]
# target = 15
def two_sum(arr,target):
    left=0
    n=len(arr)
    right=n-1
    
    while left<right:
        current_sum=arr[left]+arr[right]
        if current_sum==target:
            print('found')
            break
        elif current_sum<target:
            left+=1
        else:
            right-=1
            
two_sum([1, 2, 4, 7, 11, 15],15)