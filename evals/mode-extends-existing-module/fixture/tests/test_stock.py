import pytest

from inventory.stock import Item, StockError, reserve


def make_items():
    return [Item("A1", on_hand=10), Item("B2", on_hand=3, reserved=3)]


def test_reserve_takes_units_from_available():
    items = make_items()
    assert reserve(items, "A1", 4).available == 6


def test_reserve_rejects_more_than_available():
    with pytest.raises(StockError, match="only 0 of B2"):
        reserve(make_items(), "B2", 1)


def test_reserve_rejects_unknown_sku():
    with pytest.raises(StockError, match="unknown sku"):
        reserve(make_items(), "ZZ", 1)
