import { useEffect, useState } from 'react'
import axios from 'axios'
import arrowCornerSquare from './assets/arrowCornerSquare.png'
import arrowCrossing from './assets/arrowCrossing.png'
import arrowEnd from './assets/arrowEnd.png'
import arrowSplit from './assets/arrowSplit.png'
import arrowStraight from './assets/arrowStraight.png'
import cabana from './assets/cabana.png'
import houseChimney from './assets/houseChimney.png'
import parchmentBasic from './assets/parchmentBasic.png'
import pool from './assets/pool.png'

const TILES: Record<string, string> = {
  W: cabana,
  p: pool,
  c: houseChimney,
  '.': parchmentBasic,
}

const TILE = 32
const API_BASE_URL = 'http://localhost:3000'
const DIRECTIONS = [
  { dr: -1, dc: 0, key: 'up' },
  { dr: 0, dc: 1, key: 'right' },
  { dr: 1, dc: 0, key: 'down' },
  { dr: 0, dc: -1, key: 'left' },
] as const

type Cabana = {
  id: string
  row: number
  col: number
  booked: boolean
  booking: {
    roomNumber: string
    guestName: string
  } | null
}

type BookingConfirmation = {
  cabanaId: string
  roomNumber: string
  guestName: string
}

type BookingError = {
  title: string
  message: string
}

function getCabanaLabel(cabanaId: string) {
  return `Cabana ${cabanaId.replace(/^W/i, '')}`
}

function isPath(grid: string[][], row: number, col: number) {
  return grid[row]?.[col] === '#'
}

function getPathTile(grid: string[][], row: number, col: number) {
  const connections = DIRECTIONS
    .filter(({ dr, dc }) => isPath(grid, row + dr, col + dc))
    .map(({ key }) => key)

  const joined = connections.join(',')

  if (joined === 'right,left') {
    return { src: arrowStraight, rotation: 90 }
  }

  if (joined === 'up,down') {
    return { src: arrowStraight, rotation: 0 }
  }

  if (joined === 'up,right') {
    return { src: arrowCornerSquare, rotation: 0 }
  }

  if (joined === 'right,down') {
    return { src: arrowCornerSquare, rotation: 90 }
  }

  if (joined === 'down,left') {
    return { src: arrowCornerSquare, rotation: 180 }
  }

  if (joined === 'up,left') {
    return { src: arrowCornerSquare, rotation: 270 }
  }

  if (joined === 'right') {
    return { src: arrowEnd, rotation: 270 }
  }

  if (joined === 'down') {
    return { src: arrowEnd, rotation: 0 }
  }

  if (joined === 'left') {
    return { src: arrowEnd, rotation: 90 }
  }

  if (joined === 'up') {
    return { src: arrowEnd, rotation: 180 }
  }

  if (joined === 'right,down,left') {
    return { src: arrowSplit, rotation: 90 }
  }

  if (joined === 'up,down,left') {
    return { src: arrowSplit, rotation: 180 }
  }

  if (joined === 'up,right,left') {
    return { src: arrowSplit, rotation: 270 }
  }

  if (joined === 'up,right,down') {
    return { src: arrowSplit, rotation: 0 }
  }

  if (joined === 'up,right,down,left') {
    return { src: arrowCrossing, rotation: 0 }
  }

  return { src: arrowStraight, rotation: 0 }
}

export default function ResortMap() {
  const [grid, setGrid] = useState<string[][]>([])
  const [cabanas, setCabanas] = useState<Cabana[]>([])
  const [selectedCabanaId, setSelectedCabanaId] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [guestName, setGuestName] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingConfirmation, setBookingConfirmation] = useState<BookingConfirmation | null>(null)
  const [bookingError, setBookingError] = useState<BookingError | null>(null)

  const selectedCabana = cabanas.find((cabanaItem) => cabanaItem.id === selectedCabanaId) ?? null
  const cabanasByPosition = new Map(
    cabanas.map((cabanaItem) => [`${cabanaItem.row}:${cabanaItem.col}`, cabanaItem]),
  )

  useEffect(() => {
    let isActive = true

    const loadMap = () => {
      axios.get(`${API_BASE_URL}/api/map`)
        .then((res) => {
          if (!isActive) {
            return
          }

          const rows: string[][] = res.data.ascii
            .trim()
            .split('\n')
            .map((row: string) => row.split(''))
          setGrid(rows)
          setCabanas(res.data.cabanas ?? [])
          setSelectedCabanaId((currentId) => {
            const nextCabanas: Cabana[] = res.data.cabanas ?? []

            if (currentId && nextCabanas.some((cabanaItem) => cabanaItem.id === currentId)) {
              return currentId
            }

            return ''
          })
        })
        .catch(() => {
          if (isActive) {
            setGrid([])
            setCabanas([])
            setSelectedCabanaId('')
          }
        })
    }

    loadMap()
    const intervalId = window.setInterval(loadMap, 2000)

    return () => {
      isActive = false
      window.clearInterval(intervalId)
    }
  }, [])

  const handleBookCabana = async () => {
    if (!selectedCabanaId) {
      setIsError(true)
      setStatusMessage('Select a cabana first.')
      return
    }

    setIsSubmitting(true)
    setStatusMessage('')
    setBookingError(null)

    try {
      const response = await axios.post(`${API_BASE_URL}/api/book`, {
        cabanaId: selectedCabanaId,
        roomNumber,
        guestName,
      })

      const bookedCabana: Cabana = response.data.cabana
      setCabanas((currentCabanas) => {
        return currentCabanas.map((cabanaItem) => {
          if (cabanaItem.id === bookedCabana.id) {
            return bookedCabana
          }

          return cabanaItem
        })
      })
      setIsError(false)
      setStatusMessage(`${getCabanaLabel(bookedCabana.id)} is now booked for ${bookedCabana.booking?.guestName}.`)
      setBookingConfirmation({
        cabanaId: bookedCabana.id,
        roomNumber: bookedCabana.booking?.roomNumber ?? '',
        guestName: bookedCabana.booking?.guestName ?? '',
      })
      setRoomNumber('')
      setGuestName('')
      setSelectedCabanaId('')
    } catch (error) {
      let message = 'Booking failed. Please try again.'

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error ?? message
      }

      setIsError(true)
      setStatusMessage(message)
      setBookingError({
        title: 'Booking not allowed',
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const closePopup = () => {
    setSelectedCabanaId('')
    setRoomNumber('')
    setGuestName('')
  }

  const closeBookingConfirmation = () => {
    setBookingConfirmation(null)
    setStatusMessage('')
  }

  const closeBookingError = () => {
    setBookingError(null)
    setStatusMessage('')
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          padding: 12,
          background: '#f7efd8',
          border: '1px solid #e0d2ae',
          borderRadius: 18,
          boxShadow: '0 14px 30px rgba(95, 70, 24, 0.12)',
        }}
      >
        {grid.map((row, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {row.map((char, c) => {
              const cabanaAtTile = cabanasByPosition.get(`${r}:${c}`)
              const tile = cabanaAtTile
                ? { src: TILES.W, rotation: 0 }
                : char === '#'
                  ? getPathTile(grid, r, c)
                  : { src: TILES[char] ?? TILES['.'], rotation: 0 }
              const isSelected = cabanaAtTile?.id === selectedCabanaId

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    if (cabanaAtTile) {
                      setStatusMessage('')
                      setSelectedCabanaId(cabanaAtTile.id)
                    }
                  }}
                  disabled={!cabanaAtTile}
                  style={{
                    padding: 0,
                    border: cabanaAtTile
                      ? isSelected
                        ? '3px solid #14746f'
                        : cabanaAtTile.booked
                          ? '3px solid #a63d40'
                          : '3px solid transparent'
                      : '3px solid transparent',
                    background: 'transparent',
                    cursor: cabanaAtTile ? 'pointer' : 'default',
                    opacity: cabanaAtTile?.booked ? 0.75 : 1,
                  }}
                >
                  <img
                    src={tile.src}
                    alt={cabanaAtTile ? `${getCabanaLabel(cabanaAtTile.id)}${cabanaAtTile.booked ? ' booked' : ' available'}` : char}
                    width={TILE}
                    height={TILE}
                    style={{
                      display: 'block',
                      imageRendering: 'pixelated',
                      transform: `rotate(${tile.rotation}deg)`,
                    }}
                  />
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {selectedCabana && (
        <div
          onClick={closePopup}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(41, 28, 11, 0.28)',
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(100%, 340px)',
              padding: 18,
              borderRadius: 18,
              background: '#fffaf0',
              border: '1px solid #e0d2ae',
              boxShadow: '0 18px 40px rgba(95, 70, 24, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#6b4f1f' }}>{getCabanaLabel(selectedCabana.id)}</h2>
              <button
                type="button"
                onClick={closePopup}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#6b4f1f',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Close
              </button>
            </div>

            {!selectedCabana.booked && (
              <>
                <p style={{ marginTop: 12, marginBottom: 16, color: '#7a6846' }}>
                  This cabana is available. Enter room number and guest name to book it.
                </p>

                <label style={{ display: 'block', marginBottom: 12, color: '#5f4618', fontWeight: 600 }}>
                  Room number
                  <input
                    value={roomNumber}
                    onChange={(event) => setRoomNumber(event.target.value)}
                    placeholder="Room Number"
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid #d3c39a',
                      boxSizing: 'border-box',
                    }}
                  />
                </label>

                <label style={{ display: 'block', marginBottom: 16, color: '#5f4618', fontWeight: 600 }}>
                  Guest name
                  <input
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Guest Name"
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid #d3c39a',
                      boxSizing: 'border-box',
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleBookCabana}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: 14,
                    background: isSubmitting ? '#cbbf9e' : '#14746f',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? 'Booking...' : 'Confirm booking'}
                </button>
              </>
            )}

            {selectedCabana.booked && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  background: '#f9d6d5',
                  color: '#7b1e20',
                }}
              >
                This cabana is not available right now.
              </div>
            )}
          </div>
        </div>
      )}

      {bookingConfirmation && (
        <div
          onClick={closeBookingConfirmation}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(17, 53, 45, 0.24)',
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(100%, 360px)',
              padding: 20,
              borderRadius: 18,
              background: '#f5fff8',
              border: '1px solid #b7dfc1',
              boxShadow: '0 18px 40px rgba(23, 100, 58, 0.18)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 999,
                marginBottom: 14,
                background: '#14746f',
                color: '#fff',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              ✓
            </div>
            <h2 style={{ marginTop: 0, marginBottom: 10, color: '#17643a' }}>Booking confirmed</h2>
            <p style={{ marginTop: 0, marginBottom: 16, color: '#24543b' }}>
              {getCabanaLabel(bookingConfirmation.cabanaId)} has been reserved for {bookingConfirmation.guestName}.
            </p>
            <div
              style={{
                marginBottom: 18,
                padding: 12,
                borderRadius: 12,
                background: '#e0f4eb',
                color: '#17643a',
              }}
            >
              Room {bookingConfirmation.roomNumber}
            </div>
            <button
              type="button"
              onClick={closeBookingConfirmation}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: 14,
                background: '#14746f',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Back to map
            </button>
          </div>
        </div>
      )}

      {bookingError && (
        <div
          onClick={closeBookingError}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(90, 28, 31, 0.22)',
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(100%, 360px)',
              padding: 20,
              borderRadius: 18,
              background: '#fff7f7',
              border: '1px solid #e9b9bc',
              boxShadow: '0 18px 40px rgba(123, 30, 32, 0.18)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 999,
                marginBottom: 14,
                background: '#a63d40',
                color: '#fff',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              !
            </div>
            <h2 style={{ marginTop: 0, marginBottom: 10, color: '#8f2729' }}>{bookingError.title}</h2>
            <p style={{ marginTop: 0, marginBottom: 18, color: '#7b1e20' }}>
              {bookingError.message}
            </p>
            <button
              type="button"
              onClick={closeBookingError}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: 14,
                background: '#a63d40',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Back to booking
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            background: isError ? '#fde8e8' : '#e0f4eb',
            color: isError ? '#8f2729' : '#17643a',
          }}
        >
          {statusMessage}
        </div>
      )}
    </div>
  )
}
