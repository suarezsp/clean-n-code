from billing.invoice import calc, fmt


def test_plain_order_is_taxed():
    assert calc([{'p': 10, 'q': 2}], {'tier': 'none'}) == 24.2


def test_gold_gets_ten_percent_off():
    assert calc([{'p': 100, 'q': 1}], {'tier': 'gold'}) == 108.9


def test_fmt_pads_the_number():
    assert fmt(42, 7.5) == 'INV-000042: 7.50 EUR'
