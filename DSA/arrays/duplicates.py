# ➖ [Medium] 3. Remove Duplicates from Sorted Array
# Q: Return array with duplicates removed in-place.
# Input: [1,1,2,2,3,3,3,4]
# Output: [1,2,3,4]

def Duplicates(arr):
    unique=0
    
    for i in range(1,len(arr)):
        if arr[i]!=arr[unique]:
            unique+=1
            arr[unique]=arr[i]
        
    return arr[:unique+1]
print(Duplicates([1, 2, 3, 4,4,4,4, 5]))