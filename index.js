const WebSocket = require('ws')
const xml2js = require('xml2js')
const axios = require('axios')
const FormData = require('form-data')
const request = require('request')
var greetings = require('./config.js')
var socket = new WebSocket(greetings.speaker_ws, "gabbo");
var currentTrack
var timeout

function pulseLight(seconds) { 
    // First Photon
    var options = { method: 'POST',
      url: 'https://api.particle.io/v1/devices/' + greetings.photon1 + '/led',
      qs: { access_token: greetings.photon_access_token }, 
      form: { arg: seconds } 
    }
    request(options)

    // Second Photon
    var options2 = { method: 'POST',
      url: 'https://api.particle.io/v1/devices/' + greetings.photon2 + '/led',
      qs: { access_token: greetings.photon_access_token },
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      form: { arg: seconds } 
    }
    request(options2)
}


function getTempo(trackId) {
    if (trackId.replace('spotify:track:', '') === currentTrack) {
        return
    }
    currentTrack = trackId.replace('spotify:track:', '')
    console.log('THEOS: Now playing ' + currentTrack )
    axios.post(greetings.speaker_http, '<key state="press" sender="Gabbo">PAUSE</key>') 
    //console.log('pause sent')
    axios.get('https://api.spotify.com/v1/audio-features/' + trackId.replace('spotify:track:', ''), {headers: {Authorization: greetings.auth_code}}).then((response) => {
        console.log('The tempo of this song is: ' + response.data.tempo)
        pulseLight(60000 / parseInt(response.data.tempo))
        }).catch((error) => {
            console.log("aw shit error :( : " + error)
    })
}

socket.on('message', ((data) => {
   //console.log(data)
   if (data.includes('nowPlaying')) {
      xml2js.parseString(data, (err, result) => {
         if (err) {
         	console.log('we have an error!: ' + result)
         	return
         } 
         var trackId = result.updates.nowPlayingUpdated[0].nowPlaying[0].trackID[0]
         getTempo(trackId)
      })
   }
   

}))

