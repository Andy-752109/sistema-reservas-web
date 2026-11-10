import { test, expect } from 'vitest'
import { render } from '@testing-library/react'
import App from './App'

test('la aplicación se renderiza', () => {
  const { container } = render(<App />)
  expect(container.firstChild).toBeTruthy()
})