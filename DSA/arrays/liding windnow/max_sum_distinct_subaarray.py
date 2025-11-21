n=int(input())
num=list(map(int ,input().split()))
k=int(input())
window=num[:k]
if len(set(window))==len(window):
    sum_window=sum(window)
    max_value=sum_window

for i in range(k,n):
    window = num[i -k + 1 : i+1]
    if len(set(window))==len(window):
        pickle=sum(window)
        max_value=max(max_value ,pickle )
print(max_value)