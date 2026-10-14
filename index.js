const { Client, EmbedBuilder, PermissionsBitField } = require('discord.js');
const http = require('http');
http.createServer((req,res)=>{res.writeHead(200);res.end('PROTECTOR OK');}).listen(process.env.PORT||10000);

const client = new Client({ intents: [3276799] });
const TOKEN = process.env.TOKEN;

// CONFIG ROSA-BET
const CONFIG = {
  LOG_CHANNEL: 'logs', // crée un salon #logs sur ton serveur
  MUTE_ROLE: 'Mute',
  MAX_MSG: 5, // 5 messages en 5 sec = spam
  ANTI_LINK: true,
  ANTI_NITRO_SCAM: true,
  ANTI_EVERYONE: true
};

const spam = new Map();

client.on('ready',()=>{console.log('🛡️ PROTECTOR OK - Protège ROSA-BET');});

client.on('messageCreate', async m=>{
  if(m.author.bot ||!m.guild) return;
  if(m.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

  const low = m.content.toLowerCase();

  // 1. ANTI-SCAM NITRO / FAUX LIEN
  if(CONFIG.ANTI_NITRO_SCAM && (low.includes('free nitro') || low.includes('nitro gratuit') || low.includes('steam gift') || low.includes('discord.gift') || low.includes('@everyone') && low.includes('http'))){
    await m.delete().catch(()=>{});
    await m.member.timeout(3600000, 'Scam Nitro').catch(()=>{});
    const e=new EmbedBuilder().setColor(0xFF0000).setTitle('🛡️ SCAM BLOQUÉ').setDescription(`<@${m.author.id}> a envoyé un lien suspect Nitro/Steam - Mute 1h\nContenu: ${m.content.slice(0,200)}`);
    const ch=m.guild.channels.cache.find(c=>c.name.includes('log')); if(ch) ch.send({embeds:[e]});
    return m.channel.send(`🚨 <@${m.author.id}> lien scam supprimé!`).then(x=>setTimeout(()=>x.delete(),5000));
  }

  // 2. ANTI-LIEN (bloque liens si activé)
  if(CONFIG.ANTI_LINK && (m.content.includes('http://')||m.content.includes('https://')||m.content.includes('discord.gg/'))){
    if(!m.member.roles.cache.some(r=>r.name.toLowerCase().includes('vip'))){
      await m.delete().catch(()=>{});
      return m.reply('🔗 Liens interdits pour les non-VIP! Deviens VIP avec!vip').then(x=>setTimeout(()=>x.delete(),5000));
    }
  }

  // 3. ANTI @everyone / @here
  if(CONFIG.ANTI_EVERYONE && (m.content.includes('@everyone')||m.content.includes('@here'))){
    await m.delete().catch(()=>{});
    await m.member.timeout(600000, 'Anti everyone').catch(()=>{});
    return m.channel.send(`🚫 <@${m.author.id}> pas de @everyone! Mute 10min`);
  }

  // 4. ANTI-SPAM (5 messages rapides)
  const key=m.author.id;
  const now=Date.now();
  if(!spam.has(key)) spam.set(key,[]);
  let arr=spam.get(key); arr=arr.filter(t=>now-t<5000); arr.push(now); spam.set(key,arr);
  if(arr.length>=CONFIG.MAX_MSG){
    spam.set(key,[]);
    await m.member.timeout(300000, 'Spam').catch(()=>{});
    await m.channel.bulkDelete(5).catch(()=>{});
    return m.channel.send(`🤐 <@${m.author.id}> spam détecté - Mute 5min`);
  }

  // 5. COMMANDES PROTECTION
  if(low==='!protect'){
    const e=new EmbedBuilder().setColor(0x00FF00).setTitle('🛡️ ROSA-BET PROTECTOR')
   .addFields(
      {name:'✅ Actif',value:'Anti-scam Nitro\nAnti-lien\nAnti @everyone\nAnti-spam'},
      {name:'Commandes Admin',value:'!antilink on/off\n!lock #salon\n!unlock #salon'}
    );
    return m.reply({embeds:[e]});
  }

  if(low.startsWith('!lock') && m.member.permissions.has(PermissionsBitField.Flags.ManageChannels)){
    const ch=m.mentions.channels.first()||m.channel;
    await ch.permissionOverwrites.edit(m.guild.roles.everyone,{SendMessages:false});
    return m.reply(`🔒 ${ch} verrouillé`);
  }
  if(low.startsWith('!unlock') && m.member.permissions.has(PermissionsBitField.Flags.ManageChannels)){
    const ch=m.mentions.channels.first()||m.channel;
    await ch.permissionOverwrites.edit(m.guild.roles.everyone,{SendMessages:null});
    return m.reply(`🔓 ${ch} déverrouillé`);
  }
});

client.login(TOKEN);
