const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const { app, loadData } = require('./index.js')

const mapAscii = fs.readFileSync(path.join(__dirname, 'map.ascii'), 'utf8')
const expectedCabanaCount = (mapAscii.match(/W/g) ?? []).length

function getRouteHandler(path, method) {
  const routeLayer = app.router.stack.find((layer) => layer.route?.path === path)

  if (!routeLayer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`)
  }

  const methodLayer = routeLayer.route.stack.find((layer) => layer.method === method)

  if (!methodLayer) {
    throw new Error(`Method not found: ${method.toUpperCase()} ${path}`)
  }

  return methodLayer.handle
}

async function invokeRoute(path, method, { body } = {}) {
  const handler = getRouteHandler(path, method)
  const req = { body }

  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, payload })
        return this
      },
    }

    Promise.resolve(handler(req, res)).catch(reject)
  })
}

test.beforeEach(async () => {
  await loadData()
})

test('GET /api/map returns the ASCII map and API-driven cabana state', async () => {
  const response = await invokeRoute('/api/map', 'get')

  assert.equal(response.statusCode, 200)
  assert.match(response.payload.ascii, /W+/)
  assert.equal(response.payload.cabanas.length, expectedCabanaCount)
  assert.deepEqual(response.payload.cabanas[0], {
    id: 'W1',
    row: 11,
    col: 3,
    booked: false,
    booking: null,
  })
})

test('POST /api/book rejects guests that are not in memory', async () => {
  const response = await invokeRoute('/api/book', 'post', {
    body: {
      cabanaId: 'W1',
      roomNumber: '999',
      guestName: 'Not A Guest',
    },
  })

  assert.equal(response.statusCode, 400)
  assert.equal(response.payload.error, 'Room number and guest name do not match our guest list.')
})

test('POST /api/book books an available cabana and GET /api/map reflects the update', async () => {
  const bookingResponse = await invokeRoute('/api/book', 'post', {
    body: {
      cabanaId: 'W1',
      roomNumber: '101',
      guestName: 'Alice Smith',
    },
  })

  assert.equal(bookingResponse.statusCode, 201)
  assert.equal(bookingResponse.payload.cabana.booked, true)
  assert.deepEqual(bookingResponse.payload.cabana.booking, {
    roomNumber: '101',
    guestName: 'Alice Smith',
  })

  const mapResponse = await invokeRoute('/api/map', 'get')
  const bookedCabana = mapResponse.payload.cabanas.find((cabana) => cabana.id === 'W1')

  assert.equal(bookedCabana.booked, true)
  assert.deepEqual(bookedCabana.booking, {
    roomNumber: '101',
    guestName: 'Alice Smith',
  })
})

test('POST /api/book blocks attempts to rebook a cabana already held in memory', async () => {
  await invokeRoute('/api/book', 'post', {
    body: {
      cabanaId: 'W1',
      roomNumber: '101',
      guestName: 'Alice Smith',
    },
  })

  const response = await invokeRoute('/api/book', 'post', {
    body: {
      cabanaId: 'W1',
      roomNumber: '102',
      guestName: 'Bob Jones',
    },
  })

  assert.equal(response.statusCode, 409)
  assert.equal(response.payload.error, 'Cabana is already booked.')
})
