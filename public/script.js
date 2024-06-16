const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;
myVideo.style.transform = "scaleX(-1)";
let myVideoStream;
let linkGenerated=false;

// Initialize socket.io
const socket = io("/");

// Initialize PeerJS
const peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

// Get user media (video  and audio)
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    // Listen for incoming calls
    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // Listen for 'user-connected' event from socket
    socket.on("user-connected", (userId) => {
      setTimeout(() => {
        connectToNewUser(userId, stream);
      }, 1000);
    });
    // Listen for user disconnected event

    socket.on("user-disconnected", (userId) => {
      setTimeout(() => {
        if (peer[userId]) peer[userId].close();
        disconnectUser(userId, stream);
      }, 1000);
    });

    let text = $("input");

    $("html").keydown((e) => {
      if (e.which == 13 && text.val().length !== 0) {
        console.log(text.val());
        socket.emit("message", text.val());
        text.val("");
      }
    });

    socket.on("createMessage", (message) => {
      $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
      scrollToBottom();
    });
  });

// Emit 'join-room' event once peer is open
peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  call.on("error", () => {
    video.remove();
  });
  console.log(`Connected to new user: ${userId}`);
};

const disconnectUser = (userId) => {
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach(video => {
    if (video.getAttribute('data-user-id') === userId) {
      video.remove();
      window.close();
    }
  });
  console.log(`Disconnected user: ${userId}`);
};

// Function to add video stream to the DOM
const addVideoStream = (video, stream,userId) => {
  if(!linkGenerated){
    const currentURL = window.location.href;
    alert(currentURL);
    linkGenerated=true;
  }  
  video.srcObject = stream;
  video.setAttribute('data-user-id', userId);
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

const scrollToBottom=()=>{
  let d=$('main__chat__window');
  d.scrollTop(d.prop("scrollHeight"));
}

// mute-unmute

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const leaveMeeting = () => { 
  socket.emit("leave-room", ROOM_ID, peer.id);
  // Attempt to close the tab or window
  window.close();
  setTimeout(() => {
    window.location.href = "about:blank";
  }, 1000);
};

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i> 
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}
