'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import type { CartItem, Product } from './types';
interface CartState { items:CartItem[]; add:(product:Product)=>void; setQuantity:(id:string,quantity:number)=>void; remove:(id:string)=>void; clearCart:()=>void; }
export const CART_KEY = 'afcr-store-cart-v1';
function clean(items:unknown):CartItem[] { if (!Array.isArray(items)) return []; return items.filter(item=>item && typeof item.product?.id==='string' && typeof item.product.name==='string' && Number.isFinite(item.product.price) && item.product.price>=0 && Number.isInteger(item.product.stock) && item.product.stock>=0 && Number.isInteger(item.quantity) && item.quantity>0 && item.quantity<=99).slice(0,50); }
export const useCart = create<CartState>()(persist((set)=>({items:[],
 add:product=>set(state=>({items:state.items.some(item=>item.product.id===product.id) ? state.items.map(item=>item.product.id===product.id ? {product,quantity:Math.min(item.quantity+1,product.stock,99)} : item) : [...state.items,{product,quantity:1}]})),
 setQuantity:(id,quantity)=>set(state=>({items:state.items.map(item=>item.product.id===id ? {...item,quantity:Math.max(1,Math.min(Math.floor(quantity),item.product.stock,99))}:item)})),
 remove:id=>set(state=>({items:state.items.filter(item=>item.product.id!==id)})),clearCart:()=>set({items:[]}),
}),{name:CART_KEY,version:1,storage:createJSONStorage(()=>localStorage),skipHydration:true,partialize:state=>({items:state.items}),merge:(saved,current)=>({...current,items:clean((saved as {items?:unknown})?.items)})}));
export function useCartReady() { const [ready,setReady]=useState(false); useEffect(()=>{let mounted=true; Promise.resolve(useCart.persist.rehydrate()).finally(()=>{if(mounted)setReady(true);});return()=>{mounted=false;};},[]);return ready; }
