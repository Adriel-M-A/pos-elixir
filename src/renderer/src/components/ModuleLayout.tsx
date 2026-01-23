interface ModuleLayoutProps {
  title: string
  subtitle?: string
  onSearch?: (term: string) => void
  onCreate?: () => void
  children: React.ReactNode
}

export const ModuleLayout = ({
  title,
  subtitle,
  onSearch,
  onCreate,
  children
}: ModuleLayoutProps) => {
  return (
    <div>
      {/* Cabecera */}
      <header>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>

      {/* Barra de Herramientas */}
      <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
        <input type="text" placeholder="Buscar..." onChange={(e) => onSearch?.(e.target.value)} />
        <button onClick={onCreate}>Crear Nuevo</button>
      </div>

      {/* Contenido Principal (Tabla) */}
      <main>{children}</main>
    </div>
  )
}
