const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ══════════════════════════════════════════════
//  /api/user/:username  ← THE MISSING ENDPOINT
//  1. POST to /v1/usernames/users  (exact match)
//  2. Fetch avatar headshot
//  3. Return { id, name, displayName, avatarUrl }
// ══════════════════════════════════════════════
app.get('/api/user/:username', async (req, res) => {
  const username = req.params.username.trim();
  try {
    // Step 1: exact username → userId
    const userRes = await fetchWithTimeout(
      'https://users.roblox.com/v1/usernames/users',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
      },
      8000
    );

    if (!userRes.ok) return res.status(404).json({ error: 'User not found' });

    const userJson = await userRes.json();
    const users = userJson.data || [];
    if (!users.length) return res.status(404).json({ error: 'User not found' });

    const user = users[0];
    const userId = user.id;
    const name = user.name;
    const displayName = user.displayName || name;

    // Step 2: fetch avatar (non-blocking — still return user if fails)
    let avatarUrl = '';
    try {
      const avatarRes = await fetchWithTimeout(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=true`,
        { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } },
        6000
      );
      if (avatarRes.ok) {
        const avatarJson = await avatarRes.json();
        const entry = (avatarJson.data || [])[0];
        if (entry && entry.state === 'Completed' && entry.imageUrl) {
          avatarUrl = entry.imageUrl;
        }
      }
    } catch (e) { /* avatar failed — return user anyway */ }

    let joinedYear=''; try{ const p=await fetchWithTimeout(`https://users.roblox.com/v1/users/${userId}`); if(p.ok){ const d=await p.json(); if(d.created) joinedYear=new Date(d.created).getFullYear(); }}catch(e){} return res.json({ id: userId, name, displayName, avatarUrl, joinedYear });

  } catch (err) {
    return res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// Keep old endpoints intact
app.get('/api/users/search', async (req, res) => {
  const { username } = req.query;
  if (!username || username.length < 3) return res.json({ data: [] });
  try {
    const response = await fetchWithTimeout(
      `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }, 6000
    );
    if (!response.ok) return res.status(response.status).json({ data: [], error: `Roblox API ${response.status}` });
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ data: [], error: err.message });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const response = await fetchWithTimeout(
      `https://users.roblox.com/v1/users/${req.params.userId}`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }, 5000
    );
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/avatars/batch', async (req, res) => {
  const { userIds } = req.query;
  if (!userIds) return res.json({ data: [] });
  try {
    const response = await fetchWithTimeout(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds}&size=420x420&format=Png&isCircular=true`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }, 6000
    );
    if (!response.ok) return res.json({ data: [] });
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ data: [], error: err.message });
  }
});

app.get('/api/avatar/:userId', async (req, res) => {
  try {
    const response = await fetchWithTimeout(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${req.params.userId}&size=420x420&format=Png&isCircular=true`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }, 5000
    );
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ data: [], error: err.message });
  }
});

app.post('/api/users/batch', async (req, res) => {
  try {
    const response = await fetchWithTimeout(
      'https://users.roblox.com/v1/users',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({ userIds: req.body.userIds, excludeBannedUsers: false })
      }, 5000
    );
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/api/limited-items', async (req, res) => {
  try {
    const items = [
      {id:128739664413207,name:'Fractured Domino Crown',robux:'24,000',oldRobux:'22,500',bonus:'+1500 more',price:'₱11.49K'},
      {id:140223484513447,name:'Wings of the Pactbreaker',robux:'11,000',oldRobux:'10,000',bonus:'+1000 more',price:'₱5,700'}
    ];
    const ids = items.map(i=>i.id).join(',');
    const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${ids}&returnPolicy=PlaceHolder&size=420x420&format=Png&isCircular=false`);
    const thumbJson = await thumbRes.json();
    items.forEach(item=>{
      const thumb=(thumbJson.data||[]).find(x=>Number(x.targetId)===Number(item.id));
      item.imageUrl=thumb?.imageUrl||'';
    });
    res.json(items);
  } catch(err){res.status(500).json({error:err.message});}
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
