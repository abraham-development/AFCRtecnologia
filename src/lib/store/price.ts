const currency = new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',minimumFractionDigits:2});
export function formatPrice(value:number) { return currency.format(value); }
export function cartTotal(items: {product:{price:number};quantity:number}[]) { return items.reduce((sum,item)=>sum+Math.round(item.product.price*100)*item.quantity,0)/100; }
