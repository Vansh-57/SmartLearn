# Reverse only the first half.
# Input: arr = [1, 2, 3, 4, 5, 6]
# Output: Partial reverse: [3, 2, 1, 4, 5, 6]

def tejal(arr):
    left=0
    right=len(arr)//2-1
    while left<right:
        arr[left],arr[right]=arr[right],arr[left]
        left+=1
        right-=1
arr=[1, 2, 3, 4, 5, 6]
tejal(arr)
print(arr)
        
