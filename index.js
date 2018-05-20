const WebSocket = require('ws');
const xml2js = require('xml2js');
const axios = require('axios');
const FormData = require('form-data');
const request = require('request');
const config = require('./config.js');

const socket = new WebSocket(config.speaker_ws, 'gabbo');
let currentTrack;
let timeBetween;

function pulseLight(seconds) {
  // First Photon
  const options = {
    method: 'POST',
    url: `https://api.particle.io/v1/devices/${config.photon1}/led`,
    qs: { access_token: config.photon_access_token },
    form: { arg: seconds },
  };
  request(options);

  // Second Photon
  const options2 = {
    method: 'POST',
    url: `https://api.particle.io/v1/devices/${config.photon2}/led`,
    qs: { access_token: config.photon_access_token },
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    form: { arg: seconds },
  };
  request(options2);
}


function getTempo(trackId) {
  if (trackId.replace('spotify:track:', '') === currentTrack) {
    pulseLight(timeBetween);
    return;
  }
  currentTrack = trackId.replace('spotify:track:', '');
  console.log(`Now playing ${currentTrack}`);
  axios.get(`https://api.spotify.com/v1/audio-features/${trackId.replace('spotify:track:', '')}`, { headers: { Authorization: config.auth_code } }).then((response) => {
    console.log(`The tempo of this song is: ${response.data.tempo}`);
    pulseLight(60000 / parseInt(response.data.tempo));
    timeBetween = 60000 / parseInt(response.data.tempo);
  }).catch((error) => {
    console.log(`Error: ${error}`);
  });
}

socket.on('message', ((data) => {
  if (data.includes('nowPlaying')) {
    xml2js.parseString(data, (err, result) => {
      if (err) {
         	console.log(`we have an error!: ${result}`);
         	return;
      }
      const trackId = result.updates.nowPlayingUpdated[0].nowPlaying[0].trackID[0];
      getTempo(trackId);
      });
  }
}));

