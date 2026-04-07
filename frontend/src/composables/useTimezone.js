/**
 * Утилита для работы с часовыми поясами
 * 
 * Проблема: datetime-local input в браузере работает с локальным временем пользователя,
 * но API хранит дату в UTC ISO формате.
 * 
 * Решение:
 * - При отправке: преобразуем локальное время пользователя в UTC
 * - При получении: преобразуем UTC в локальное время пользователя
 */

/**
 * Преобразует локальное время (из datetime-local input) в UTC ISO строку
 * @param {string} localDatetimeString - Формат "2024-01-01T15:00" (без Z, без смещения)
 * @returns {string|null} UTC ISO строка "2024-01-01T12:00:00.000Z" или null если пусто
 */
export const localToUTC = (localDatetimeString) => {
  if (!localDatetimeString) return null
  
  // Интерпретируем строку как локальное время (не UTC)
  const localDate = new Date(localDatetimeString)
  
  // Преобразуем в UTC, учитывая локальный смещение
  const utcDate = new Date(localDate.getTime())
  
  return utcDate.toISOString()
}

/**
 * Преобразует UTC ISO строку в локальное время (для datetime-local input)
 * @param {string} utcDatetimeString - UTC ISO строка "2024-01-01T12:00:00Z" или "2024-01-01T12:00:00.000Z"
 * @returns {string} Локальное время в формате "2024-01-01T15:00" для datetime-local input
 */
export const utcToLocal = (utcDatetimeString) => {
  if (!utcDatetimeString) return ''
  
  // Парсим UTC дату
  const utcDate = new Date(utcDatetimeString)
  
  if (isNaN(utcDate.getTime())) {
    console.warn('Invalid date string:', utcDatetimeString)
    return ''
  }
  
  // Преобразуем в локальное время
  const localYear = utcDate.getFullYear()
  const localMonth = String(utcDate.getMonth() + 1).padStart(2, '0')
  const localDay = String(utcDate.getDate()).padStart(2, '0')
  const localHours = String(utcDate.getHours()).padStart(2, '0')
  const localMinutes = String(utcDate.getMinutes()).padStart(2, '0')
  
  return `${localYear}-${localMonth}-${localDay}T${localHours}:${localMinutes}`
}

/**
 * Форматирует UTC дату для отображения пользователю
 * @param {string} utcDatetimeString - UTC ISO строка
 * @param {boolean} includeTime - Включать ли время (по умолчанию true)
 * @returns {string} Отформатированная строка в локальном времени
 */
export const formatLocalDate = (utcDatetimeString, includeTime = true) => {
  if (!utcDatetimeString) return ''
  
  const date = new Date(utcDatetimeString)
  
  if (isNaN(date.getTime())) {
    return ''
  }
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }
  
  return date.toLocaleString('ru-RU', options)
}

/**
 * Проверяет, прошло ли время (с учётом локального часового пояса)
 * @param {string} utcDatetimeString - UTC ISO строка
 * @returns {boolean} true если время прошло, false если ещё впереди
 */
export const isPassed = (utcDatetimeString) => {
  if (!utcDatetimeString) return false
  
  return new Date() > new Date(utcDatetimeString)
}

/**
 * Проверяет, наступит ли время в будущем
 * @param {string} utcDatetimeString - UTC ISO строка
 * @returns {boolean} true если время в будущем, false если уже прошло или сейчас
 */
export const isFuture = (utcDatetimeString) => {
  if (!utcDatetimeString) return false
  
  return new Date() < new Date(utcDatetimeString)
}
