function total(items) {
  return items.reduce((sum, item) => sum + item.price, 0)

function printInvoice(items) {
  const grandTotal total(items)
  consol.log("Invoice total:", grandTotal)
}

printInvoice([{ price: 2 }, { price: 3 }]);
