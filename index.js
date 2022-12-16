#!/bin/node

const ffprobe = require('ffprobe');
const readline = require('readline');
const path = require('path');

async function askQuestion(query) {
  if (process.env.NAMER_AUTO === 'true') return Promise.resolve();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans && ans.length ? ans : null);
    })
  );
}

async function getInfo(file) {
  return new Promise((resolve, reject) => {
    ffprobe(file, { path: 'ffprobe' }, (err, info) => {
      if (err) return reject(err);
      resolve(info);
    });
  });
}

async function selectStream(name, streams) {
  if (!streams || !streams.length) return Promise.resolve(null);

  const r = await askQuestion(`Select ${name} stream:
${streams
  .map(
    (s, i) =>
      `${i} - ${s.codec_long_name} (${s.tags?.language}${
        s.tags?.title ? ` - ${s.tags?.title}` : ''
      })`
  )
  .join('\n')}
`);

  console.log('');

  return r === '' ? 0 : Number(r);
}

async function run() {
  const filePath = process.argv[2];

  const { streams } = await getInfo(filePath);
  const videoStreams = streams.filter((s) => s.codec_type === 'video');
  const audioStreams = streams.filter((s) => s.codec_type === 'audio');
  const subtitleStreams = streams.filter((s) => s.codec_type === 'subtitle');

  const video = await selectStream('video', videoStreams);
  const audio = await selectStream('audio', audioStreams);
  const sub = await selectStream('subtitle', subtitleStreams);

  const params = [];

  if (video !== null) params.push(`-map 0:v:${video}`);
  if (audio !== null) params.push(`-map 0:a:${audio}`);
  if (sub !== null) params.push(`-map 0:s:${sub}`);

  console.log(
    `ffmpeg -i "${filePath.replace(/"/g, '//"')}" -c copy ${params.join(
      ' '
    )} -map_metadata -1 -metadata:s:v:0 title= out${path.extname(filePath)}`
  );
}

run();
