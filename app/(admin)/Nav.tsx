'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/orders', label: 'Órdenes' },
  { href: '/payments/pending', label: 'Pagos a devolver' },
  { href: '/categories', label: 'Categorías' },
  { href: '/products', label: 'Productos' },
  { href: '/combos', label: 'Combos' },
  { href: '/taxes', label: 'Impuestos' },
  { href: '/discounts', label: 'Descuentos' },
  { href: '/coupons', label: 'Cupones' },
  { href: '/stock', label: 'Stock' },
  { href: '/users', label: 'Usuarios' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded px-3 py-2 text-sm ${
              isActive ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
