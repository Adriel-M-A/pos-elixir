import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog'

interface DeleteConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title?: string
    description?: React.ReactNode
    confirmText?: string
    cancelText?: string
    isDeleting?: boolean
}

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title = '¿Estás seguro?',
    description = 'Esta acción no se puede deshacer.',
    confirmText = 'Eliminar',
    cancelText = 'Cancelar',
    isDeleting = false
}: DeleteConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        className="bg-red-500 hover:bg-red-600"
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Eliminando...' : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
