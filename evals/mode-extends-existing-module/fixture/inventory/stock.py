"""Stock levels for the warehouse. Quantities are whole units; SKUs are upper-case strings."""
from dataclasses import dataclass


class StockError(Exception):
    """Raised when a stock operation cannot be applied."""


@dataclass
class Item:
    sku: str
    on_hand: int
    reserved: int = 0

    @property
    def available(self) -> int:
        return self.on_hand - self.reserved


def find_item(items: list[Item], sku: str) -> Item:
    """Return the item with this SKU, or raise StockError."""
    for item in items:
        if item.sku == sku:
            return item
    raise StockError(f"unknown sku {sku!r}")


def reserve(items: list[Item], sku: str, qty: int) -> Item:
    """Reserve qty units of sku for an order."""
    if qty <= 0:
        raise StockError(f"qty must be positive, got {qty}")
    item = find_item(items, sku)
    if qty > item.available:
        raise StockError(f"only {item.available} of {sku} available, asked for {qty}")
    item.reserved += qty
    return item
