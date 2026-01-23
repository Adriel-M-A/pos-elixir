import { useState } from 'react'
import logo from '@/assets/estadisticas.png'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

const loginSchema = z.object({
    username: z.string().min(1, 'El usuario es requerido'),
    password: z.string().min(1, 'La contraseña es requerida')
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const { login } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: ''
        }
    })

    async function onSubmit(data: LoginFormValues) {
        setIsSubmitting(true)

        try {
            await login(data)
        } catch (err: any) {
            console.error('Login error captured in UI:', err)

            // Extracción robusta del mensaje de error
            let message = 'La contraseña es incorrecta o error de conexión.'
            let errorType: 'inactive' | 'notfound' | 'invalid' = 'invalid'

            if (typeof err === 'string') {
                message = err
            } else if (err.message) {
                const rawMessage = err.message.replace(/^Error invoking remote method '[^']+': Error: /, '')

                if (rawMessage.includes('Usuario inactivo')) {
                    message = 'Tu cuenta ha sido desactivada. Por favor contacta al administrador.'
                    errorType = 'inactive'
                } else if (rawMessage.includes('Usuario no encontrado')) {
                    message = 'El usuario ingresado no existe.'
                    errorType = 'notfound'
                } else if (rawMessage.includes('Credenciales inválidas')) {
                    message = 'La contraseña es incorrecta.'
                } else {
                    message = rawMessage
                }
            }



            if (errorType === 'inactive') {
                toast.error('Acceso Denegado', {
                    description: 'Tu usuario se encuentra inactivo. No puedes iniciar sesión.'
                })
            } else if (errorType === 'notfound') {
                toast.error('Usuario no encontrado', {
                    description: 'Verifica el nombre de usuario escrito.'
                })
            } else {
                toast.error('Error de Inicio de Sesión', {
                    description: message
                })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex h-full w-full items-center justify-center bg-white text-black p-8">
            <div className="w-full max-w-[320px] space-y-8">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Control POS</h1>
                    <p className="text-sm text-gray-500">
                        Sistema de Punto de Venta
                    </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-gray-700">Usuario</Label>
                            <Input
                                id="username"
                                placeholder="Ej. admin"
                                autoComplete="username"
                                maxLength={100}
                                {...form.register('username')}
                                className="bg-gray-50 border-gray-200 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                            />
                            {form.formState.errors.username && (
                                <p className="text-sm font-medium text-red-600">
                                    {form.formState.errors.username.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
                            <PasswordInput
                                id="password"
                                placeholder="••••"
                                autoComplete="current-password"
                                maxLength={50}
                                {...form.register('password')}
                                className="bg-gray-50 border-gray-200 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                            />
                            {form.formState.errors.password && (
                                <p className="text-sm font-medium text-red-600">
                                    {form.formState.errors.password.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-black text-white hover:bg-gray-800 h-10 rounded-md"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Ingresando...
                            </>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
