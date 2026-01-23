export const PERMISSIONS = {
    // Ventas
    POS_ACCESS: 'pos:access',       // Puede entrar al POS
    POS_DISCOUNT: 'pos:discount',   // Puede aplicar descuentos manuales

    SALES_VIEW: 'sales:view',
    SALES_CANCEL: 'sales:cancel',

    // Productos
    PRODUCTS_VIEW: 'products:view',
    PRODUCTS_CREATE: 'products:create',
    PRODUCTS_EDIT: 'products:edit',
    PRODUCTS_DELETE: 'products:delete',
    PRODUCTS_STATUS: 'products:status',

    // Categorías
    CATEGORIES_VIEW: 'categories:view',
    CATEGORIES_CREATE: 'categories:create',
    CATEGORIES_EDIT: 'categories:edit',
    CATEGORIES_DELETE: 'categories:delete',
    CATEGORIES_STATUS: 'categories:status',

    // Promociones
    PROMOTIONS_VIEW: 'promotions:view',
    PROMOTIONS_CREATE: 'promotions:create',
    PROMOTIONS_EDIT: 'promotions:edit',
    PROMOTIONS_DELETE: 'promotions:delete',
    PROMOTIONS_STATUS: 'promotions:status',

    // Reportes
    REPORTS_VIEW: 'reports:view',

    // Configuración y Usuarios
    SETTINGS_MANAGE: 'settings:manage',
    USERS_MANAGE: 'users:manage'    // Crear/Editar otros usuarios
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export type Role = 'ADMIN' | 'CASHIER'

export interface User {
    id: number
    username: string
    password_hash: string
    role: Role
    name: string
    is_active: boolean
    last_login?: string
    created_at: string
    updated_at: string
    permissions?: string[]
}

export interface AppConfig {
    ENABLE_USER_MANAGEMENT: boolean
}
