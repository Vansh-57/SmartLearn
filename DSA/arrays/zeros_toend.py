def Demo(arr):
    left=0
    for i in range(len(arr)):
        if arr[i]!=0:
            arr[left],arr[i]=arr[i],arr[left]
            left+=1
arr=[0, 1, 0, 3, 12]
Demo(arr)
print(arr)