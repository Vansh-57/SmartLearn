def remove_space(s):
    s=list(s)
    left=0
    right=0
    n=len(s)
    while right < n:
        if s[right] !=' ':
            s[left]=s[right]
            left+=1
        right+=1
    return ''.join(s[:left])
print(remove_space("a  b  c  v   nfj"))