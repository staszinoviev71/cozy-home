const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['polling', 'websocket'],
  pingTimeout: 20000,
  pingInterval: 10000
});

// Хранилище состояний комнат и событий для Long-Polling
const rooms = new Map(); // roomCode -> { state: Object, events: Array<{ id, time, msg }> }
const waitingPolls = new Map(); // roomCode -> Set<res>

function getRoomData(roomCode) {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, {
      state: {},
      events: []
    });
  }
  return rooms.get(roomCode);
}

function broadcastEvent(roomCode, msg) {
  const room = getRoomData(roomCode);
  const eventItem = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    time: Date.now(),
    msg: msg
  };
  room.events.push(eventItem);
  if (room.events.length > 50) {
    room.events.shift(); // Храним последние 50 событий
  }

  // Обновляем кэш состояния комнаты
  if (msg.type === 'MOOD_UPDATE' && msg.data) {
    if (!room.state.moods) room.state.moods = {};
    if (msg.data.role) room.state.moods[msg.data.role] = msg.data.mood;
  } else if (msg.type === 'SHOPPING_UPDATE' && msg.data) {
    room.state.items = msg.data.items;
  } else if (msg.type === 'DINNER_POLL_UPDATE' && msg.data) {
    room.state.dinnerPoll = msg.data.poll;
  } else if (msg.type === 'DINNER_RECIPES_UPDATE' && msg.data) {
    room.state.dinnerRecipes = msg.data.recipes;
  } else if (msg.type === 'PASSPORT_UPDATE' && msg.data) {
    room.state.passportItems = msg.data.items;
  }

  // 1. Отправляем через Socket.IO подключенным веб-клиентам
  io.to('room_' + roomCode).emit('sync_message', msg);

  // 2. Будим ожидающие HTTP Long-Polling клиенты (фоновая служба Android)
  const waiters = waitingPolls.get(roomCode);
  if (waiters && waiters.size > 0) {
    for (const res of waiters) {
      try {
        res.json({ events: [eventItem], state: room.state });
      } catch (e) {}
    }
    waiters.clear();
  }
}

// ==================== REST API ====================

// Healthcheck для Koyeb и мониторинга
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    activeSockets: io.engine ? io.engine.clientsCount : 0,
    roomsCount: rooms.size
  });
});

// Получить текущее состояние комнаты
app.get('/api/state/:roomCode', (req, res) => {
  const room = getRoomData(req.params.roomCode);
  res.json({ state: room.state });
});

// Отправить событие через REST (если сокет заблокирован)
app.post('/api/sync/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode;
  const msg = req.body;
  if (!msg || !msg.type) {
    return res.status(400).json({ error: 'Invalid message format' });
  }
  broadcastEvent(roomCode, msg);
  res.json({ success: true, timestamp: Date.now() });
});

// HTTP Long-Polling (на 100% стабильно для Android Background Service)
app.get('/api/poll/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode;
  const since = parseInt(req.query.since || '0', 10);
  const deviceId = req.query.deviceId || '';
  const room = getRoomData(roomCode);

  // Если уже есть свежие события с момента since — отдаем сразу
  const newEvents = room.events.filter(e => e.time > since && e.msg.senderDeviceId !== deviceId);
  if (newEvents.length > 0) {
    return res.json({ events: newEvents, state: room.state });
  }

  // Иначе удерживаем соединение до 25 секунд
  if (!waitingPolls.has(roomCode)) {
    waitingPolls.set(roomCode, new Set());
  }
  const waiters = waitingPolls.get(roomCode);
  waiters.add(res);

  const timer = setTimeout(() => {
    waiters.delete(res);
    try {
      res.json({ events: [], state: room.state });
    } catch (e) {}
  }, 25000);

  req.on('close', () => {
    clearTimeout(timer);
    waiters.delete(res);
  });
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join_room', (data) => {
    const roomCode = data.roomCode || '777888';
    currentRoom = roomCode;
    socket.join('room_' + roomCode);

    const room = getRoomData(roomCode);
    // Отправляем подключившемуся актуальное состояние
    socket.emit('room_state', { state: room.state });

    // Оповещаем второго партнера, что мы в сети
    socket.to('room_' + roomCode).emit('partner_presence', {
      deviceId: data.deviceId,
      role: data.role,
      online: true
    });
  });

  socket.on('sync_message', (msg) => {
    if (!msg || !msg.roomCode) return;
    broadcastEvent(msg.roomCode, msg);
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      socket.to('room_' + currentRoom).emit('partner_presence', {
        online: false
      });
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Cozy Home Cloud Sync Server running on port ${PORT}`);
});
