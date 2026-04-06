import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const userId = ref(null)

const initUserId = () => {
  if (!userId.value) {
    const stored = localStorage.getItem('userId')
    if (stored) {
      userId.value = stored
    } else {
      userId.value = uuidv4()
      localStorage.setItem('userId', userId.value)
    }
  }
  return userId.value
}

export const useUserId = () => {
  if (!userId.value) {
    initUserId()
  }
  return userId.value
}
