import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import ResortMap from './map'

vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      isAxiosError: (error: unknown) => {
        return Boolean(error) && typeof error === 'object' && 'response' in (error as Record<string, unknown>)
      },
    },
  }
})

const mockedAxios = vi.mocked(axios)

const baseMapResponse = {
  data: {
    ascii: '...\n.W.\n...',
    cabanas: [
      {
        id: 'W1',
        row: 1,
        col: 1,
        booked: false,
        booking: null,
      },
    ],
  },
}

afterEach(() => {
  cleanup()
  mockedAxios.get.mockReset()
  mockedAxios.post.mockReset()
})

describe('ResortMap', () => {
  it('shows the one-step booking popup for an available cabana and confirms success', async () => {
    mockedAxios.get.mockResolvedValue(baseMapResponse)
    mockedAxios.post.mockResolvedValue({
      data: {
        cabana: {
          id: 'W1',
          row: 1,
          col: 1,
          booked: true,
          booking: {
            roomNumber: '101',
            guestName: 'Alice Smith',
          },
        },
      },
    })

    render(<ResortMap />)

    const cabanaButton = await screen.findByRole('button', { name: /cabana 1 available/i })
    await userEvent.click(cabanaButton)

    expect(screen.getByText(/this cabana is available/i)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/room number/i), '101')
    await userEvent.type(screen.getByLabelText(/guest name/i), 'Alice Smith')
    await userEvent.click(screen.getByRole('button', { name: /confirm booking/i }))

    await screen.findByText(/booking confirmed/i)

    expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/api/book', {
      cabanaId: 'W1',
      roomNumber: '101',
      guestName: 'Alice Smith',
    })
    expect(screen.getByText(/has been reserved for Alice Smith/i)).toBeInTheDocument()
    expect(screen.getByText(/room 101/i)).toBeInTheDocument()
  })

  it('shows an unavailable message for a cabana that the API marks as booked', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ascii: '...\n.W.\n...',
        cabanas: [
          {
            id: 'W1',
            row: 1,
            col: 1,
            booked: true,
            booking: {
              roomNumber: '101',
              guestName: 'Alice Smith',
            },
          },
        ],
      },
    })

    render(<ResortMap />)

    const cabanaButton = await screen.findByRole('button', { name: /cabana 1 booked/i })
    await userEvent.click(cabanaButton)

    expect(screen.getByText(/this cabana is not available right now/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/room number/i)).not.toBeInTheDocument()
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  it('shows a rejection popup when the guest is not allowed to book', async () => {
    mockedAxios.get.mockResolvedValue(baseMapResponse)
    mockedAxios.post.mockRejectedValue({
      response: {
        data: {
          error: 'Room number and guest name do not match our guest list.',
        },
      },
    })

    render(<ResortMap />)

    const cabanaButton = await screen.findByRole('button', { name: /cabana 1 available/i })
    await userEvent.click(cabanaButton)

    await userEvent.type(screen.getByLabelText(/room number/i), '999')
    await userEvent.type(screen.getByLabelText(/guest name/i), 'Wrong Guest')
    await userEvent.click(screen.getByRole('button', { name: /confirm booking/i }))

    await screen.findByText(/booking not allowed/i)
    expect(screen.getAllByText(/room number and guest name do not match our guest list/i)).toHaveLength(2)
    expect(screen.getByRole('button', { name: /back to booking/i })).toBeInTheDocument()
  })

  it('treats API cabana data as the source of truth for interactive cabanas', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ascii: '...\n.W.\n...',
        cabanas: [],
      },
    })

    render(<ResortMap />)

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    expect(screen.queryByRole('button', { name: /cabana 1 available/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cabana 1 booked/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/this cabana is available/i)).not.toBeInTheDocument()
  })
})
