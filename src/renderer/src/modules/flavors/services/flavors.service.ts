import type { Flavor } from '@shared/types'

export async function fetchFlavors(): Promise<Flavor[]> {
    return await window.api.invoke('flavors:list')
}

export async function createFlavor(data: Omit<Flavor, 'id'>): Promise<Flavor> {
    return await window.api.invoke('flavors:create', data)
}

export async function updateFlavor(id: number, data: Partial<Omit<Flavor, 'id'>>): Promise<void> {
    return await window.api.invoke('flavors:update', id, data)
}

export async function updateFlavorStock(id: number, stock: number): Promise<void> {
    return await window.api.invoke('flavors:update-stock', id, stock)
}

export async function deleteFlavor(id: number): Promise<void> {
    return await window.api.invoke('flavors:delete', id)
}
