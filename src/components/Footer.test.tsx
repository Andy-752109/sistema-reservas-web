import { afterEach, expect, test } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import Footer from './Footer'

afterEach(() => {
  cleanup()
  delete window.__CONFIG__
})

test('muestra el ambiente y la versión de config.js', () => {
  window.__CONFIG__ = { ambiente: 'DEV', version: 'abc1234' }

  render(<Footer />)

  expect(screen.getByText('DEV')).toBeTruthy()
  expect(screen.getByText('abc1234')).toBeTruthy()
})
