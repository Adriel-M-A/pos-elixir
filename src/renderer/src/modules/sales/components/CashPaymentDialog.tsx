import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/utils/currency'

interface CashPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    totalAmount: number
    onConfirm: () => void
}

export function CashPaymentDialog({
    open,
    onOpenChange,
    totalAmount,
    onConfirm
}: CashPaymentDialogProps) {
    const [tenderedAmount, setTenderedAmount] = useState<string>('')
    const [change, setChange] = useState<number>(0)

    useEffect(() => {
        if (open) {
            setTenderedAmount('')
            setChange(0)
        }
    }, [open])

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        // Allow only numbers and one decimal point
        if (!/^\d*\.?\d*$/.test(value)) return

        setTenderedAmount(value)
        const amount = parseFloat(value) || 0
        setChange(amount - totalAmount)
    }

    const handleConfirm = () => {
        onConfirm()
        onOpenChange(false)
    }

    const parsedAmount = parseFloat(tenderedAmount) || 0
    const isValid = parsedAmount >= totalAmount

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Pago en Efectivo</DialogTitle>
                    <DialogDescription>
                        Ingrese el monto entregado por el cliente para calcular el vuelto.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border text-center">
                        <span className="text-sm text-muted-foreground uppercase font-semibold">Total a Pagar</span>
                        <span className="text-4xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="tendered" className="text-base">Monto Recibido</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">$</span>
                            <Input
                                id="tendered"
                                value={tenderedAmount}
                                onChange={handleAmountChange}
                                className="pl-8 text-lg h-12 font-semibold"
                                placeholder="0.00"
                                maxLength={20}
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <div className={`flex flex-col gap-1 p-4 rounded-lg border transition-colors ${isValid ? 'bg-green-500/10 border-green-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold uppercase">{isValid ? 'Vuelto' : 'Faltante'}</span>
                            <span className={`text-2xl font-bold ${isValid ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                                {isValid ? formatCurrency(change) : formatCurrency(Math.abs(change))}
                            </span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={!isValid} size="lg" className="w-full sm:w-auto">
                        Confirmar Cobro
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
