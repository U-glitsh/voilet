// Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7FOJ96_V2Mit8Lp3SsX0rPUXgFD3x24s",
  authDomain: "chat-web-ebd3e.firebaseapp.com",
  projectId: "chat-web-ebd3e",
  storageBucket: "chat-web-ebd3e.firebasestorage.app",
  messagingSenderId: "562511218872",
  appId: "1:562511218872:web:18205883adcea9990c4c4d",
  measurementId: "G-NTVR2T9847"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let username = localStorage.getItem("username") || "زائر";
let avatarURL = localStorage.getItem("avatar") || "https://via.placeholder.com/40";
let currentRoom = localStorage.getItem("room") || "الرئيسية";
let isVerified = false;

const checkStatus = async () => {
  const ref = doc(db, "users", username);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    isVerified = snap.data().verified || false;
  }
};
await checkStatus();

const messageBox = document.getElementById("messages");
const input = document.getElementById("chatInput");
const fileInput = document.getElementById("imageInput");

function renderMessage(data) {
  const div = document.createElement("div");
  div.className = "message";
  const verifiedMark = data.verified ? " <span style='color:#0af'>✔️</span>" : "";
  const imagePart = data.image ? `<img src="${data.image}" style="max-width:200px;border-radius:10px;margin-top:5px">` : "";
  const audioPart = data.audio ? `<audio controls src="${data.audio}" style="margin-top:5px;"></audio>` : "";
  div.innerHTML = `
    <div><strong>${data.username}${verifiedMark}</strong></div>
    <div>${data.text || ""}</div>
    ${imagePart}
    ${audioPart}
  `;
  messageBox.appendChild(div);
  messageBox.scrollTop = messageBox.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  const imageFile = fileInput.files[0];
  let imageDataUrl = "";

  if (imageFile) {
    const reader = new FileReader();
    reader.onloadend = async () => {
      imageDataUrl = reader.result;
      await sendToFirebase(text, imageDataUrl, "");
    };
    reader.readAsDataURL(imageFile);
  } else {
    await sendToFirebase(text, "", "");
  }
}

async function sendToFirebase(text, imageUrl, audioUrl) {
  await addDoc(collection(db, "rooms", currentRoom, "messages"), {
    username: username,
    avatar: avatarURL,
    text: text,
    image: imageUrl,
    audio: audioUrl,
    verified: isVerified,
    timestamp: Date.now()
  });
  input.value = "";
  fileInput.value = "";
}

// صوت
let mediaRecorder;
let audioChunks = [];

window.startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.start();
  audioChunks = [];

  mediaRecorder.addEventListener("dataavailable", event => {
    audioChunks.push(event.data);
  });

  mediaRecorder.addEventListener("stop", () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result;
      await sendToFirebase("", "", base64Audio);
    };
    reader.readAsDataURL(audioBlob);
  });

  setTimeout(() => {
    mediaRecorder.stop();
  }, 5000); // يسجل 5 ثواني
};

const q = query(collection(db, "rooms", currentRoom, "messages"), orderBy("timestamp"));
onSnapshot(q, (snapshot) => {
  messageBox.innerHTML = "";
  snapshot.forEach((doc) => {
    renderMessage(doc.data());
  });
});
