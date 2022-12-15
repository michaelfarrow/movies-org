#!/bin/node

const axios = require('axios');
const klaw = require('klaw');
const fs = require('fs-extra');
const path = require('path');
const sequence = require('promise-sequence');
const sharp = require('sharp');
const { MovieDb } = require('moviedb-promise');

const TM_DB_KEY = '4219e299c89411838049ab0dab19ebd5';
const IMAGE_PREFIX = 'https://image.tmdb.org/t/p/original';

const moviedb = new MovieDb(TM_DB_KEY);

async function getFiles() {
  const items = [];
  const rootDir = path.resolve('.');

  return new Promise((resolve, reject) => {
    klaw(rootDir, { depthLimit: 0 })
      .on('data', (item) => {
        // if (['.mp4', '.avi', '.mkv'].includes(path.extname(item.path))) {
        //   items.push(item.path);
        // }
        if (item.path !== rootDir && item.stats.isDirectory()) {
          const imdbid = item.path.match(/\[imdbid-(tt\d+)\]$/);
          items.push({ id: (imdbid && imdbid[1]) || null, dir: item.path });
        }
      })
      .on('end', () => {
        resolve(items);
      })
      .on('error', reject);
  });
}

async function getArt(id) {
  const data = await moviedb.find({
    id,
    language: 'en-US',
    external_source: 'imdb_id',
  });
  const primary = data?.movie_results?.[0]?.poster_path;
  const backdrop = data?.movie_results?.[0]?.backdrop_path;

  return {
    primary: (primary && `${IMAGE_PREFIX}${primary}`) || null,
    backdrop: (backdrop && `${IMAGE_PREFIX}${backdrop}`) || null,
  };
}

async function saveArt(src, dest) {
  console.log('SAVE', src, dest);
  const input = (await axios({ url: src, responseType: 'arraybuffer' })).data;
  await sharp(input).jpeg({ quality: 100 }).toFile(dest);
}

async function setArt(id, dest) {
  const name = path.basename(dest);

  const primaryPath = path.resolve(dest, 'poster.jpg');
  const backdropPath = path.resolve(dest, 'backdrop.jpg');
  const hasPrimary = await fs.pathExists(primaryPath);
  const hasBackdrop = await fs.pathExists(backdropPath);
  if (!hasPrimary || !hasBackdrop) {
    const art = await getArt(id);
    if (!hasPrimary) {
      if (art?.primary) {
        await saveArt(art.primary, primaryPath);
      } else {
        console.log('MISSING - primary', name);
      }
    }
    if (!hasBackdrop) {
      if (art?.backdrop) {
        await saveArt(art.backdrop, backdropPath);
      } else {
        console.log('MISSING - backdrop', name);
      }
    }
  } else {
    console.log(`OK ${name}`);
  }
}

async function getRelatedFiles(file) {
  const items = [];
  const rootDir = path.resolve('.');

  return new Promise((resolve, reject) => {
    klaw(rootDir, { depthLimit: 0 })
      .on('data', (item) => {
        if (!item.stats.isDirectory()) {
          if (
            item.path.indexOf(
              file.substring(0, file.length - path.extname(file).length)
            ) === 0
          ) {
            items.push(item.path);
          }
        }
      })
      .on('end', () => {
        resolve(items);
      })
      .on('error', reject);
  });
}

async function run() {
  const items = await getFiles();
  const validItems = items.filter((item) => item.id !== null);

  await sequence(validItems.map((file) => () => setArt(file.id, file.dir)));

  // await sequence(
  //   items.map((file) => async () => {
  //     const movieFile = file;
  //     const movieFileName = movieFile.substring(
  //       0,
  //       movieFile.length - path.extname(movieFile).length
  //     );
  //     const name = path.basename(file, path.extname(file));
  //     const cleanName = name.replace(/\s*\(\d+\)\s*\[imdbid-tt\d+\]$/, '');
  //     const allFiles = await getRelatedFiles(file);
  //     console.log('Ensure Dir:', path.resolve(name));
  //     await fs.ensureDir(path.resolve(name));
  //     await sequence(
  //       allFiles.map((file) => () => {
  //         const dest = path.resolve(
  //           name,
  //           `${cleanName}${file.substring(movieFileName.length)}`
  //         );
  //         console.log('Moving:', file, '=>', dest);
  //         return fs.move(file, dest);
  //       })
  //     );
  //   })
  // );
}

run();
