# arr = 
def reverse(arr):
    left=0
    n=len(arr)
    right=n-1
    while left<right:
        arr[left],arr[right]=arr[right],arr[left]
        left+=1
        right-=1
arr=[1, 2, 3, 4, 5]
reverse(arr)
print(arr)

###########################################
