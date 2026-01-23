import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Scale, Calculator } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'

interface WeightSelectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    productName: string
    productPrice: number
    onConfirm: (weight: number) => void
    initialWeight?: number
}

export function WeightSelectionDialog({
    open,
    onOpenChange,
    productName,
    productPrice,
    onConfirm,
    initialWeight = 0
}: WeightSelectionDialogProps) {
    const [weight, setWeight] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            setWeight(initialWeight > 0 ? initialWeight.toString() : '')
            // Focus input after a short delay to ensure dialog is rendered
            setTimeout(() => {
                inputRef.current?.focus()
                inputRef.current?.select()
            }, 100)
        }
    }, [open, initialWeight])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const value = parseFloat(weight)
        if (value > 0) {
            onConfirm(value)
            onOpenChange(false)
        }
    }

    const currentWeight = parseFloat(weight) || 0
    const calculatedPrice = (currentWeight / 1000) * productPrice
    const isValid = currentWeight > 0

    const quickWeights = [100, 250, 500, 1000]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Scale className="h-5 w-5" />
                        Ingresar Peso
                    </DialogTitle>
                    <DialogDescription>
                        {productName}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                    {/* Price Context Block */}
                    <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border text-center">
                        <span className="text-sm text-muted-foreground uppercase font-semibold">Precio por Kg</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(productPrice)}</span>
                    </div>

                    {/* Weight Input */}
                    <div className="grid gap-2">
                        <Label htmlFor="weight-input" className="text-base">Peso (Gramos)</Label>
                        <div className="relative">
                            <Input
                                id="weight-input"
                                ref={inputRef}
                                type="number"
                                step="any"
                                min="0"
                                placeholder="0"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="pr-12 text-lg h-12 font-bold"
                                autoComplete="off"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                g
                            </span>
                        </div>
                        {/* Quick Weight Buttons */}
                        <div className="flex gap-2 justify-between mt-1">
                            {quickWeights.map((w) => (
                                <Button
                                    key={w}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs"
                                    onClick={() => setWeight(w.toString())}
                                >
                                    {w >= 1000 ? `${w / 1000}kg` : `${w}g`}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Calculated Price Result */}
                    <div className={`flex flex-col gap-1 p-4 rounded-lg border transition-colors ${isValid ? 'bg-green-500/10 border-green-500/20' : 'bg-muted border-border'}`}>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold uppercase flex items-center gap-2">
                                <Calculator className="h-4 w-4" />
                                Precio Final
                            </span>
                            <span className={`text-3xl font-bold ${isValid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                {formatCurrency(calculatedPrice)}
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="mt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!isValid} size="lg" className="w-full sm:w-auto">
                            Confirmar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
