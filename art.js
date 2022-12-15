#!/bin/node

const fs = require('fs-extra');
const path = require('path');
const sequence = require('promise-sequence');
const sharp = require('sharp');

const TM_DB_KEY = '4219e299c89411838049ab0dab19ebd5';

async function getFiles() {
  const items = [];
  const rootDir = path.resolve('.');

  return new Promise((resolve, reject) => {
    klaw(rootDir)
      .on('data', (item) => {})
      .on('end', () => {
        resolve(items);
      })
      .on('error', reject);
  });
}

async function getArt(artist) {}

async function saveArt(src, dest) {
  console.log('SAVE', src, dest);
  // const input = (await axios({ url: src, responseType: 'arraybuffer' })).data;
  // await sharp(input).jpeg({ quality: 100 }).toFile(dest);
}

async function setArt(name, dest) {
  // const primaryPath = path.resolve(dest, 'poster.jpg');
  // const backdropPath = path.resolve(dest, 'backdrop.jpg');
  // const hasPrimary = await fs.pathExists(primaryPath);
  // const hasBackdrop = await fs.pathExists(backdropPath);
  // if (!hasPrimary || !hasBackdrop) {
  //   const art = await getArt(name);
  //   if (!hasPrimary) {
  //     if (art?.primary) {
  //       await saveArt(art.primary, primaryPath);
  //     } else {
  //       console.log('MISSING - primary', name);
  //     }
  //   }
  //   if (!hasBackdrop) {
  //     if (art?.backdrop[0]) {
  //       await saveArt(art.backdrop[0], backdropPath);
  //     } else {
  //       console.log('MISSING - backdrop', name);
  //     }
  //   }
  // } else {
  //   console.log(`OK ${name}`);
  // }
}

async function run() {
  const files = await getFiles();
  console.log(file);
  // await sequence(files.map((file) => () => setArt(file.name, file.path)));
}

run();
