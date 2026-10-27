const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));
const classes = {
  warrior: {name:'Doğukan', color:'#ef4444', role:'Warrior'},
  healer: {name:'Yaren', color:'#facc15', role:'Healer'},
  archer: {name:'Aysima', color:'#a78bfa', role:'Archer'},
  mage: {name:'Berken', color:'#f472b6', role:'Mage'},
  fighter: {name:'Emre', color:'#4ade80', role:'Fighter'}
};
const rooms = new Map();
function makeEnemies(level) {
  const types = [ ['Slime','Skeleton'], ['Bat','Orc'], ['Wraith','Orc Guard'], ['Dark Knight','Wraith'], ['Ancient Guardian'] ][level-1] || ['Slime'];
  const count = level === 5 ? 1 : 3 + Math.min(level,2);
  return Array.from({length:count}, (_,i)=>({
    id:crypto.randomUUID(), type:types[i%types.length], x:(i%2===0?-1:1)*(3.2+(i%3)*1.5), z:-5-Math.floor(i/2)*2.2,
    hp:level===5?420:55+level*24, maxHp:level===5?420:55+level*24, boss:level===5, alive:true, attackAt:0
  }));
}
function freshRoom(code) { return {code, level:1, players:{}, enemies:makeEnemies(1), cleared:false}; }
function snapshot(room) { return {code:room.code, level:room.level, players:room.players, enemies:room.enemies, cleared:room.cleared}; }
function emitRoom(room) { io.to(room.code).emit('state', snapshot(room)); }
function aliveEnemies(room) { return room.enemies.filter(e=>e.alive).length; }
io.on('connection', socket => {
  socket.on('joinGame', ({roomCode, character}) => {
    const cls = classes[character] ? character : 'warrior';
    const code = String(roomCode||'SOLO').trim().toUpperCase().slice(0,12) || 'SOLO';
    let room = rooms.get(code); if (!room) { room=freshRoom(code); rooms.set(code,room); }
    if (Object.keys(room.players).length >= 5) return socket.emit('joinError','Bu oda dolu (en fazla 5 oyuncu).');
    socket.join(code); socket.data.room=code; socket.data.playerId=socket.id;
    const idx=Object.keys(room.players).length;
    room.players[socket.id]={id:socket.id, character:cls, name:classes[cls].name, color:classes[cls].color, role:classes[cls].role, x:(idx-2)*1.5, z:2, yaw:0, hp:100, maxHp:100, lastAction:0};
    emitRoom(room); socket.emit('joined',{id:socket.id,room:code});
  });
  socket.on('move', data=>{
    const room=rooms.get(socket.data.room), p=room?.players[socket.id]; if(!p||!data) return;
    p.x=Math.max(-10,Math.min(10,Number(data.x)||0)); p.z=Math.max(-14,Math.min(7,Number(data.z)||0)); p.yaw=Number(data.yaw)||0;
    socket.to(room.code).emit('playerMoved',{id:p.id,x:p.x,z:p.z,yaw:p.yaw});
  });
  socket.on('ability', ({kind,targetId}={})=>{
    const room=rooms.get(socket.data.room), p=room?.players[socket.id]; if(!p||!kind) return;
    const now=Date.now(); if(now-p.lastAction<450) return; p.lastAction=now;
    const cls=p.character; let effect={kind, x:p.x, z:p.z, color:p.color, playerId:p.id, name:p.name};
    if(kind==='ultimate') effect.kind='ultimate';
    if(cls==='healer' && (kind==='skill'||kind==='ultimate')) {
      Object.values(room.players).forEach(q=>{if(Math.hypot(q.x-p.x,q.z-p.z)<7) q.hp=Math.min(q.maxHp,q.hp+(kind==='ultimate'?45:24));});
      effect.kind=kind==='ultimate'?'healBurst':'heal'; effect.color='#ffe66d';
    } else {
      const damage = kind==='ultimate' ? (cls==='mage'?110:85) : kind==='skill' ? (cls==='archer'?58:50) : 28;
      let candidates=room.enemies.filter(e=>e.alive).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));
      const range = kind==='ultimate'?9:cls==='archer'||cls==='mage'?8:4;
      const hit = candidates.filter(e=>Math.hypot(e.x-p.x,e.z-p.z)<=range).slice(0,kind==='ultimate'?3:1);
      hit.forEach(e=>{e.hp-=damage;if(e.hp<=0){e.hp=0;e.alive=false;}});
      effect.targets=hit.map(e=>({id:e.id,x:e.x,z:e.z,damage}));
      effect.kind = cls==='warrior'?'slash':cls==='archer'?'arrow':cls==='mage'?'fireball':'punch';
      if(kind==='ultimate') effect.kind=cls==='mage'?'meteor':cls==='archer'?'arrowRain':cls==='warrior'?'spinSlash':'shockwave';
    }
    io.to(room.code).emit('effect',effect);
    if(aliveEnemies(room)===0 && !room.cleared){room.cleared=true;io.to(room.code).emit('roomCleared',{level:room.level});}
    emitRoom(room);
  });
  socket.on('nextLevel',()=>{
    const room=rooms.get(socket.data.room); if(!room||!room.cleared) return;
    if(room.level<5){room.level++;room.enemies=makeEnemies(room.level);room.cleared=false;Object.values(room.players).forEach(p=>{p.x=0;p.z=3;p.hp=Math.min(p.maxHp,p.hp+25);});io.to(room.code).emit('levelChanged',{level:room.level});emitRoom(room);}
    else io.to(room.code).emit('victory');
  });
  socket.on('disconnect',()=>{const room=rooms.get(socket.data.room);if(!room)return;delete room.players[socket.id];if(!Object.keys(room.players).length)rooms.delete(room.code);else emitRoom(room);});
});
// Simple enemy pressure: nearby players take occasional damage, synced for everyone.
setInterval(()=>{for(const room of rooms.values()){let changed=false;const now=Date.now();for(const e of room.enemies){if(!e.alive)continue;const ps=Object.values(room.players).filter(p=>p.hp>0).sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z));const p=ps[0];if(p){const dx=p.x-e.x,dz=p.z-e.z,dist=Math.hypot(dx,dz);if(dist>1.55){const step=(e.boss?0.72:0.95)*0.25;e.x+=dx/dist*step;e.z+=dz/dist*step;changed=true;}else if(now-e.attackAt>1600){p.hp=Math.max(0,p.hp-(e.boss?13:6));e.attackAt=now;io.to(room.code).emit('effect',{kind:'enemyHit',x:p.x,z:p.z,color:'#ff533d',playerId:p.id});changed=true;}}}if(changed)emitRoom(room);}},250);
server.listen(PORT,()=>console.log(`Five Souls running on ${PORT}`));
