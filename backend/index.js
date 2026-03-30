const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const minimist = require("minimist");
const path = require("path");

const args = minimist(process.argv.slice(2));
const mapPath = args.map
  ? path.resolve(process.cwd(), args.map)
  : path.resolve(__dirname, "map.ascii");
const bookingPath = args.bookings
  ? path.resolve(process.cwd(), args.bookings)
  : path.resolve(__dirname, "bookings.json");

console.log("Map file:", mapPath);
console.log("Booking file:", bookingPath);

const app = express();
app.use(cors());
app.use(express.json());

let guestRegistry = [];
let cabanas = [];

function parseGrid(ascii) {
  return ascii
    .trim()
    .split("\n")
    .map((row) => row.split(""));
}
function buildCabanaState(grid) {
  const nextCabanas = [];
  let cabanaNumber = 1;
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === "W") {
        nextCabanas.push({
          id: `W${cabanaNumber}`,
          row: rowIndex,
          col: colIndex,
          booked: false,
          booking: null,
        });
        cabanaNumber += 1;
      }
    });
  });

  return nextCabanas;
}

function mergeCabanaBookings(nextCabanas) {
  const previousBookingsByPosition = new Map(
    cabanas
      .filter((cabana) => cabana.booked)
      .map((cabana) => [`${cabana.row}:${cabana.col}`, cabana.booking]),
  );

  return nextCabanas.map((cabana) => {
    const booking =
      previousBookingsByPosition.get(`${cabana.row}:${cabana.col}`) ?? null;

    return {
      ...cabana,
      booked: Boolean(booking),
      booking,
    };
  });
}

function findGuest(roomNumber, guestName) {
  const normalizedRoom = String(roomNumber ?? "").trim();
  const normalizedGuestName = String(guestName ?? "")
    .trim()
    .toLowerCase();

  return guestRegistry.find((guest) => {
    return (
      guest.room === normalizedRoom &&
      guest.guestName.toLowerCase() === normalizedGuestName
    );
  });
}

async function loadData() {
  const [ascii, bookingsRaw] = await Promise.all([
    fs.readFile(mapPath, "utf8"),
    fs.readFile(bookingPath, "utf8"),
  ]);

  const parsedBookings = JSON.parse(bookingsRaw);
  if (!Array.isArray(parsedBookings)) {
    throw new Error("Bookings file must contain an array of guests.");
  }

  guestRegistry = parsedBookings;
  cabanas = buildCabanaState(parseGrid(ascii));
}
async function syncCabanaState() {
  const ascii = await fs.readFile(mapPath, "utf8");
  const nextCabanas = buildCabanaState(parseGrid(ascii));

  cabanas = mergeCabanaBookings(nextCabanas);

  return ascii;
}

function startServer(port = 3000) {
  return loadData()
    .then(() => {
      return app.listen(port, () => {
        console.log(`Backend is running on http://localhost:${port}`);
      });
    })
    .catch((error) => {
      console.error("Failed to load startup data:", error);
      process.exit(1);
    });
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "Backend is live",
    guestsLoaded: guestRegistry.length,
    cabanasLoaded: cabanas.length,
  });
});
app.get("/api/map", async (req, res) => {
  try {
    const ascii = await syncCabanaState();
    res.json({ ascii, cabanas });
  } catch (error) {
    res.status(500).json({ error: "Could not read map file." });
  }
});

app.post("/api/book", async (req, res) => {
  const { cabanaId, roomNumber, guestName } = req.body ?? {};

  if (!cabanaId || !roomNumber || !guestName) {
    return res
      .status(400)
      .json({ error: "cabanaId, roomNumber, and guestName are required." });
  }

  try {
    await syncCabanaState();
  } catch (error) {
    return res.status(500).json({ error: "Could not refresh map data." });
  }

  const guest = findGuest(roomNumber, guestName);
  if (!guest) {
    return res
      .status(400)
      .json({
        error: "Room number and guest name do not match our guest list.",
      });
  }

  const cabana = cabanas.find((entry) => entry.id === cabanaId);
  if (!cabana) {
    return res.status(404).json({ error: "Cabana not found." });
  }

  if (cabana.booked) {
    return res.status(409).json({ error: "Cabana is already booked." });
  }

  cabana.booked = true;
  cabana.booking = {
    roomNumber: guest.room,
    guestName: guest.guestName,
  };

  return res.status(201).json({
    message: "Cabana booked successfully.",
    cabana,
  });
});

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  loadData,
  startServer,
};
