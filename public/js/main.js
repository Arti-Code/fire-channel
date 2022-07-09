import {auth} from './auth.js';

const app = firebase.initializeApp(auth);
const db = firebase.database();

const messages = document.getElementById('messages');
const btn_info = document.getElementById('btn_info');
const btn_start = document.getElementById('btn_start');
const btn_stop = document.getElementById('btn_stop');
const input_device = document.getElementById('device_id');
let device_id = "";
btn_stop.setAttribute('disabled', 'true');
let run = false;
let pc = null;
let dc = null;



function create_pc() {
  pc = new RTCPeerConnection({
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302'
    }]
  });

  dc = pc.createDataChannel('LINK');

  dc.onclose = () => {
    info('link has closed');
    console.log('link has closed');
  };

  dc.onopen = () => {
    info('link has opened');
    console.log('link has opened');
  };

  dc.onmessage = e => {
    info(`'${dc.label}': '${e.data}'`);
  };

  pc.oniceconnectionstatechange = e => info(pc.iceConnectionState);

  pc.onicecandidate = event => {
    if (event.candidate === null) {
      let lsd = btoa(JSON.stringify(pc.localDescription))
      console.log(lsd);
      db_write(device_id, "offer", lsd);
      //document.getElementById('local_sd').value = btoa(JSON.stringify(pc.localDescription));
    }
  };

  pc.onnegotiationneeded = e => {
    pc.createOffer().then(d => pc.setLocalDescription(d)).catch();
  };
};


  function db_read() {
  let dbRef = db.ref()
    .child("messages").child("welcome")
    .get().then((snapshoot) => {
      if (snapshoot.exists()) {
        console.log(snapshoot.val());
        info(snapshoot.val());
      } else {
        console.log("empty snapshoot");
        info("empty snapshoot");
      }
    });
};

function db_write(device, msg_type, data) {
  db.ref().child("messages").child(device).child(msg_type)
    .set(data);
}

function info(text) {
  messages.innerHTML = messages.innerHTML + text + '<br />';
};

btn_info.addEventListener("click", () => {
  if (device_id != '') {
    info("device: " + device_id);
    console.log("device: " + device_id);
  } else {
    info("unknown device");
    console.log("unknown device");
  }
});

btn_start.addEventListener("click", () => {
  device_id = input_device.value;
  info("link with device: " + device_id);
  console.log("link with device: " + device_id);
  input_device.setAttribute('disabled', 'true');
  btn_start.setAttribute('disabled', 'true');
  btn_stop.removeAttribute('disabled');
  create_pc();
});

btn_stop.addEventListener("click", () => {
  info("communication ended");
  console.log("communication ended");
  device_id = '';
  btn_stop.setAttribute('disabled', 'true');
  btn_start.removeAttribute('disabled');
  input_device.removeAttribute('disabled');
  input_device.value = '';
});