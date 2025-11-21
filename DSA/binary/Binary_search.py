# arr = [2, 5, 7, 9, 12], target = 9 → Output: 3
def binary_search(arr,target):
    low=0
    high=len(arr)-1
    while low<=high:
        mid=(low+high)//2 
        if arr[mid]==target:
            print(f"Found {mid} position")
            break
        elif arr[mid]<target:
            low=mid+1
            
        else:
            high=mid-1
    return -1
binary_search([1,2,3,4,5,6,7,8,9],90) 
