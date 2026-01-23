import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'

export interface TabDef {
  value: string
  label: React.ReactNode
  content: React.ReactNode
}

function TabsSection({ tabs, defaultValue, className = '' }) {
  const defaultTab = defaultValue || tabs[0]?.value

  if (!defaultTab) {
    return (
      <div
        className={`h-full flex flex-col items-center justify-center text-muted-foreground p-8 ${className}`}
      >
        <h2 className="text-xl font-bold">Acceso restringido</h2>
        <p>No tienes permisos para ver esta sección.</p>
      </div>
    )
  }

  return (
    <section className={`h-full flex flex-col bg-background ${className}`}>

      <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col">
        <TabsList variant="underline" className="px-8 ">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              variant="underline"
              className="after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:bg-primary after:transition-transform data-[state=active]:after:scale-x-100"
            >
              <span className="flex items-center gap-2">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="m-0">
              {tab.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </section>
  )
}

export default TabsSection
