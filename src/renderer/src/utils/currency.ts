/**
 * Formatea un número como moneda en formato argentino
 * @param amount - Monto a formatear
 * @returns String formateado como moneda argentina
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$0,00'
  }

  // Formatear con separador de miles con punto y decimal con coma
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)

  return formatted
}

/**
 * Formatea un número como moneda en formato argentino (versión simplificada)
 * @param amount - Monto a formatear
 * @returns String formateado como moneda argentina
 */
export function formatAR$(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$0,00'
  }

  // Convertir a string y manejar decimales
  const parts = amount.toFixed(2).split('.')

  // Formatear la parte entera con separador de miles
  const integerPart = parseInt(parts[0]).toLocaleString('es-AR')

  // Unir con la parte decimal
  return `$${integerPart},${parts[1]}`
}
