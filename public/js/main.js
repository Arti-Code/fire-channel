import {auth} from './auth.js';

const app = firebase.initializeApp(auth);
const db = firebase.database();

const messages = document.getElementById('messages');
const btn_info = document.getElementById('btn_info');
const btn_start = document.getElementById('btn_start');
const btn_stop = document.getElementById('btn_stop');
const btn_send = document.getElementById('btn_send');
const input_device = document.getElementById('device_id');
const input_msg = document.getElementById('input_msg');
let device_id = "";
let pc = null;
let dc = null;

btn_stop.setAttribute('disabled', 'true');
input_msg.setAttribute('disabled', 'true');

function create_pc() {
  pc = new RTCPeerConnection({
    iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
  });

  dc = pc.createDataChannel('LINK');

  dc.onclose = () => {
    info('CHANNEL CLOSE');
  };

  dc.onopen = () => {
    info('CHANNEL OPEN');
  };

  dc.onmessage = e => {
    info(`-> '${e.data}'`);
  };

  pc.oniceconnectionstatechange = e => {
    info(pc.iceConnectionState);
  };

  pc.onicecandidate = event => {
    if (event.candidate === null) {
      let lsd = btoa(JSON.stringify(pc.localDescription))
      console.log("[OFFER]: " + lsd);
      info("[OFFER] OK");
      db_write(device_id, "answer", "");
      db_write(device_id, "offer", lsd);
    }
  };

  pc.onnegotiationneeded = e => {
    pc.createOffer().then(d => pc.setLocalDescription(d)).catch();
  };

  pc.ontrack = function (event) {
    var el = document.createElement(event.track.kind)
    el.srcObject = event.streams[0]
    el.autoplay = true
    el.controls = true
    document.getElementById('remoteVideo').appendChild(el)
    console.log("[VIDEO]");
    info("[VIDEO]");
      
  }

  pc.addTransceiver('video', {'direction': 'recvonly'})
  console.log("new video transceiver");
  info("new video transceiver");

};

function db_read() {
  let dbRef = db.ref().child("messages").child("welcome")
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
};

function send_msg(msg) {
  dc.send(msg);
  info("<- " + msg);
}

function info(text) {
  messages.innerHTML = messages.innerHTML + text + '<br />';
};

function wait_answer() {
  let on_answer = db.ref().child("messages").child(device_id).child("answer");
  on_answer.on('value', (snapshot) => {
    set_remote_sdp(snapshot.val());
  });
};

function set_remote_sdp(data) {
  if (data == "") {
    return;
  } else {
    try {
      let sdp = JSON.parse(atob(data));
      pc.setRemoteDescription(new RTCSessionDescription(sdp));
      info("[ANSWER]: OK");
      console.log("[ANSWER]: OK");
    } catch (e) {
      alert(e);
    }
  }
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

btn_stop.addEventListener("click", () => {
  btn_stop.setAttribute('disabled', 'true');
  btn_start.removeAttribute('disabled');
  input_device.removeAttribute('disabled');
  input_device.value = '';
  input_msg.setAttribute('disabled', 'true');
});

btn_start.addEventListener("click", () => {
  device_id = input_device.value;
  input_device.setAttribute('disabled', 'true');
  btn_start.setAttribute('disabled', 'true');
  btn_stop.removeAttribute('disabled');
  input_msg.removeAttribute('disabled');
  create_pc();
  wait_answer();
});

btn_send.addEventListener("click", () => {
  let msg = input_msg.value;
  send_msg(msg);
  input_msg.value = "";
});