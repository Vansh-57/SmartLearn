def remove_duplicate(s):
    i=0
    n=len(s)
    result=[]
    while i < len(s):
        result.append(s[i])
        j=i
        while j <len(s) and s[j]==s[i]:
            j+=1
        i=j
    return "".join(result)
print(remove_duplicate("aaaaaabbbbbbbbbbcccc"))