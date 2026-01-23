import { ReactNode, useState, useEffect, Children } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface DataTableProps {
  title?: string
  columns: {
    key: string
    label: string
    className?: string
  }[]
  data: any[]
  loading?: boolean
  emptyMessage?: string
  children?: ReactNode
  maxHeight?: string
  stickyHeader?: boolean
  action?: ReactNode
  className?: string
  pageSize?: number
  renderRow?: (item: any, index: number) => ReactNode
  hidePagination?: boolean
}

export function DataTable({
  title,
  columns,
  data,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  children,
  action,
  className,
  pageSize = 100,
  renderRow,
  hidePagination = false
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // Reset page when data length changes (new filter/search)
  useEffect(() => {
    setCurrentPage(1)
  }, [data.length])

  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentData = data.slice(startIndex, endIndex)

  // if (loading) { ... } -> Removed early return to show structure while loading

  return (
    <Card className={cn('border rounded-md bg-card overflow-hidden flex flex-col', className)}>
      {(title || action) && (
        <CardHeader className="py-4 flex flex-row items-center justify-between shrink-0 border-b">
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {action}
        </CardHeader>
      )}

      {/* Contenedor con scroll para la tabla */}
      <ScrollArea className="flex-1 whitespace-nowrap min-h-0">
        <CardContent className="p-0">
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm border-b">
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className || ''}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex} className={column.className}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : children ? (
                Children.toArray(children).slice(startIndex, endIndex)
              ) : (
                currentData.map((row, rowIndex) =>
                  renderRow ? (
                    renderRow(row, rowIndex)
                  ) : (
                    <TableRow key={rowIndex}>
                      {columns.map((column) => (
                        <TableCell key={`${rowIndex}-${column.key}`} className={column.className}>
                          {row[column.key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </table>
        </CardContent>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {!hidePagination && (
        <div className="flex items-center justify-between px-4 py-4 border-t shrink-0">
          <div className="text-sm text-muted-foreground">
            Mostrando {data.length > 0 ? startIndex + 1 : 0} a {Math.min(endIndex, data.length)} de {data.length} resultados
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <div className="text-sm font-medium">
              Página {currentPage} de {Math.max(1, totalPages)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
