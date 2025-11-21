# Q4. Search for an element in a matrix
# Input:
# matrix = [[1, 3, 5],
#           [7, 9, 11],
#           [13, 15, 17]]
# target = 9r
# Output: Found
def search_target(matrix,target):
    rows=len(matrix)
    cols=len(matrix[0])
    r,c=0,cols-1
    
    while r < len(matrix) and c >= 0:
        if matrix[r][c] == target:
            return 'Found'
        elif matrix[r][c] > target:
            c-=1
        else:
            r+=1
    return 'Not Found'
print(search_target(  [[1, 3, 5],
         [7, 9, 11],
        [13, 15, 17]] , 677667))
    
    