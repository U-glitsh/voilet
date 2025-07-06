// استيراد Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// بيانات الاتصال بـ Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB7FOJ96_V2Mit8Lp3SsX0rPUXgFD3x24s",
  authDomain: "chat-web-ebd3e.firebaseapp.com",
  projectId: "chat-web-ebd3e",
  storageBucket: "chat-web-ebd3e.firebasestorage.app",
  messagingSenderId: "562511218872",
  appId: "1:562511218872:web:18205883adcea9990c4c4d",
  measurementId: "G-NTVR2T9847"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// بيانات المستخدم
let username = localStorage.getItem("username") || "زائر";
let avatarURL = localStorage.getItem("avatar") || "https://via.placeholder.com/40";
let verifiedUsers = JSON.parse(localStorage.getItem("verifiedUsers") || "[]");
let currentRoom = localStorage.getItem("room") || "الرئيسية";

const messageBox = document.getElementById("messages");
const input = document.getElementById("chatInput");
const fileInput = document.getElementById("imageInput");

// عرض رسالة
function renderMessage(data) {
  const div = document.createElement("div");
  div.className = "message";
  const verifiedMark = data.verified ? " <span style='color:#0af'>✔️</span>" : "";
  const imagePart = data.image ? `<img src="${data.image}" style="max-width:200px;border-radius:10px;margin-top:5px">` : "";
  div.innerHTML = `
    <div><strong>${data.username}${verifiedMark}</strong></div>
    <div>${data.text || ""}</div>
    ${imagePart}
  `;
  messageBox.appendChild(div);
  messageBox.scrollTop = messageBox.scrollHeight;
}

// إرسال رسالة
async function sendMessage() {
  const text = input.value.trim();
  const imageFile = fileInput.files[0];
  let imageDataUrl = "";

  if (imageFile) {
    const reader = new FileReader();
    reader.onloadend = async () => {
      imageDataUrl = reader.result;
      await sendToFirebase(text, imageDataUrl);
    };
    reader.readAsDataURL(imageFile);
  } else {
    await sendToFirebase(text, "");
  }
}

async function sendToFirebase(text, imageUrl) {
  await addDoc(collection(db, "rooms", currentRoom, "messages"), {
    username: username,
    avatar: avatarURL,
    text: text,
    image: imageUrl,
    verified: username === "مالك الشات",
    timestamp: Date.now()
  });
  input.value = "";
  fileInput.value = "";
}

// التحديث التلقائي
const q = query(collection(db, "rooms", currentRoom, "messages"), orderBy("timestamp"));
onSnapshot(q, (snapshot) => {
  messageBox.innerHTML = "";
  snapshot.forEach((doc) => {
    renderMessage(doc.data());
  });
});
