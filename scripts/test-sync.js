const mqtt = require('mqtt');

function waitForMessage(client, filterFn, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setTimeout(() => {
      client.removeListener('message', handler);
      reject(new Error('Timeout waiting for message'));
    }, timeoutMs);

    function handler(topic, msg) {
      try {
        const parsed = JSON.parse(msg.toString());
        if (filterFn(parsed)) {
          clearTimeout(timer);
          client.removeListener('message', handler);
          resolve({ elapsed: Date.now() - start, data: parsed.data, sender: parsed.senderRole });
        }
      } catch (e) {}
    }

    client.on('message', handler);
  });
}

async function runTest() {
  console.log('🚀 Starting Real-Time Cloud Sync E2E Test...');
  const pairCode = 'test_' + Math.floor(Math.random() * 100000);
  const topic = 'cozyhome/v2/room_' + pairCode;

  console.log(`📡 Connecting to broker.emqx.io:8084 over WSS on topic: ${topic}`);

  // Phone 1: Husband
  const husband = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
    clientId: 'test_h_' + Math.random().toString(36).substring(2, 7)
  });

  // Phone 2: Wife
  const wife = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
    clientId: 'test_w_' + Math.random().toString(36).substring(2, 7)
  });

  await new Promise((resolve) => {
    let connected = 0;
    husband.on('connect', () => {
      console.log('✅ Phone 1 (Husband Galaxy A54) connected to Cloud Broker');
      husband.subscribe(topic, () => {
        if (++connected === 2) resolve();
      });
    });
    wife.on('connect', () => {
      console.log('✅ Phone 2 (Wife Galaxy A54) connected to Cloud Broker');
      wife.subscribe(topic, () => {
        if (++connected === 2) resolve();
      });
    });
  });

  console.log('\n--- Step 1: Mood Sync Test ---');
  const moodPromise = waitForMessage(wife, (m) => m.type === 'MOOD_UPDATE' && m.senderDeviceId === 'dev_husband');
  husband.publish(topic, JSON.stringify({
    senderDeviceId: 'dev_husband',
    senderRole: 'husband',
    type: 'MOOD_UPDATE',
    data: { role: 'husband', mood: { id: 'hungry', title: 'Хочу кушать! 🍕' }, avatarType: 'corgi' },
    timestamp: Date.now()
  }));

  const moodRes = await moodPromise;
  console.log(`🎉 Mood sync received by Wife in ${moodRes.elapsed} ms: "${moodRes.data.mood.title}" (Avatar: ${moodRes.data.avatarType})`);

  console.log('\n--- Step 2: Shopping Cart Sync Test ---');
  const shopPromise = waitForMessage(husband, (m) => m.type === 'SHOPPING_UPDATE' && m.senderDeviceId === 'dev_wife');
  wife.publish(topic, JSON.stringify({
    senderDeviceId: 'dev_wife',
    senderRole: 'wife',
    type: 'SHOPPING_UPDATE',
    data: { items: [{ id: 1, name: 'Молоко 3.2%', checked: true }, { id: 2, name: 'Свежий багет', checked: false }] },
    timestamp: Date.now()
  }));

  const shopRes = await shopPromise;
  console.log(`🎉 Shopping sync received by Husband in ${shopRes.elapsed} ms: ${shopRes.data.items.length} items (Milk is checked: ${shopRes.data.items[0].checked})`);

  console.log('\n--- Step 3: Urgent Heads-Up SOS Push Test ---');
  const sosPromise = waitForMessage(wife, (m) => m.type === 'SOS_PUSH' && m.senderDeviceId === 'dev_husband');
  husband.publish(topic, JSON.stringify({
    senderDeviceId: 'dev_husband',
    senderRole: 'husband',
    type: 'SOS_PUSH',
    data: { sender: 'Муж', icon: '🥖', text: 'Захвати, пожалуйста, хрустящий багет!' },
    timestamp: Date.now()
  }));

  const sosRes = await sosPromise;
  console.log(`🎉 Urgent SOS Push received by Wife in ${sosRes.elapsed} ms: [${sosRes.data.icon}] ${sosRes.data.sender}: "${sosRes.data.text}"`);

  console.log('\n--- Step 4: Custom Dispute (Games Tab) Sync Test ---');
  const gamesPromise = waitForMessage(husband, (m) => m.type === 'GAMES_UPDATE' && m.senderDeviceId === 'dev_wife');
  wife.publish(topic, JSON.stringify({
    senderDeviceId: 'dev_wife',
    senderRole: 'wife',
    type: 'GAMES_UPDATE',
    data: {
      presets: {
        custom_walk: {
          title: 'Кто гуляет с собачкой? 🐕',
          options: ['Муж 👨', 'Жена 👩', 'Вместе ❤️', 'Кто проиграет в цу-е-фа ✌️']
        }
      }
    },
    timestamp: Date.now()
  }));

  const gamesRes = await gamesPromise;
  console.log(`🎉 Custom Dispute received by Husband in ${gamesRes.elapsed} ms: "${gamesRes.data.presets.custom_walk.title}" (${gamesRes.data.presets.custom_walk.options.length} options for dice & wheel)`);

  husband.end();
  wife.end();

  console.log('\n========================================');
  console.log('🏆 ALL REAL-TIME SYNC TESTS PASSED (100%)');
  console.log(`⚡ Average Round-Trip Cloud Latency: ~${Math.round((moodRes.elapsed + shopRes.elapsed + sosRes.elapsed + gamesRes.elapsed) / 4)} ms`);
  console.log('========================================');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
