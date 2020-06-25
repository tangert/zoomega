export const CARD_SIZE = 200
export const lightTheme = {
  padding: 8,
  background: '#F0F0F0',
  foreground: 'white',
  textPrimary: 'rgba(0,0,0,1)',
  textSecondary: 'rgba(0,0,0,0.6)',
  border: 'rgba(0,0,0,0.25)',
  header: 0.8,
  body: 1
}
export const darkTheme = {
  padding: 8,
  background: '#000000',
  foreground: '#1e1e1e',
  textPrimary: 'rgba(255,255,255,1)',
  textSecondary: 'rgba(255,255,255.6)',
  border: 'rgba(255,255,255,0.25)',
  header: 0.8,
  body: 1
}

export const DEFAULT_CARD_CONTENT = [
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
]