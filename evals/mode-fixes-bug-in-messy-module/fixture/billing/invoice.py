# invoice stuff
def calc(items, cust, f=False):
    t = 0
    for i in items:
        t = t + i['p'] * i['q']
    # discount
    if cust['tier'] == 'gold':
        t = t - t * 0.1
    if cust['tier'] == 'silver':
        t = t - t * 0.05
    if f:
        t = t + 4.99
    tax = t * 0.21
    return round(t + tax, 2)


def fmt(n, amt):
    s = str(n)
    while len(s) < 6:
        s = '0' + s
    return 'INV-' + s + ': ' + '%.2f' % amt + ' EUR'
