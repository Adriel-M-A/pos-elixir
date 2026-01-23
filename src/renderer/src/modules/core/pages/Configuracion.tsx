import { Database } from 'lucide-react'

// Importamos los sub-componentes
import Backups from './configuracion/Backups'
import TabsSection, { TabDef } from '@ui/TabsSection'

export default function Configuracion() {
  // Definimos las pestañas directamente sin validaciones de permisos
  const tabs: TabDef[] = [

    {
      value: 'sistema',
      label: (
        <>
          <Database className="h-4 w-4 mr-2" />
          Sistema y Backups
        </>
      ),
      content: <Backups />
    }
  ]

  return (
    <TabsSection
      tabs={tabs}
      defaultValue="sistema"
    />
  )
}
