"use client"

import { Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TopProductsTableProps {
  products: Array<{
    name: string
    unitsSold: number
    revenue: number
    margin?: number | null
  }>
}

export function TopProductsTable({ products }: TopProductsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-5 w-5" />
          Destaques de produtos
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 text-xs md:text-sm">Produto</TableHead>
                <TableHead className="text-xs md:text-sm">Unidades</TableHead>
                <TableHead className="text-xs md:text-sm">Receita</TableHead>
                <TableHead className="text-xs md:text-sm">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum produto se destacou neste período.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.name} className="text-xs md:text-sm">
                    <TableCell className="pl-6 font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {product.unitsSold}
                      </Badge>
                    </TableCell>
                    <TableCell>R$ {product.revenue.toFixed(2)}</TableCell>
                    <TableCell>
                      {typeof product.margin === "number" ? (
                        <span className={product.margin >= 0 ? "text-emerald-600" : "text-red-600"}>
                          {product.margin >= 0 ? "+" : ""}
                          {product.margin.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
