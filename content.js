let isRecording = false;
let mediaRecorder;
let recordedChunks = [];

const btn = document.createElement("button");
btn.innerText = "📹 Start Recording";
btn.style.position = "fixed";
btn.style.top = "20px";
btn.style.left = "20px";
btn.style.zIndex = 9999;
btn.style.padding = "10px 20px";
btn.style.background = "#4CAF50";
btn.style.color = "#fff";
btn.style.border = "none";
btn.style.borderRadius = "5px";
btn.style.cursor = "pointer";
btn.style.fontSize = "16px";
document.body.appendChild(btn);

btn.onclick = async () => {
  if (!isRecording) {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true // ✅ Enable system audio (if user shares it)
      });

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      const systemSource = audioContext.createMediaStreamSource(screenStream);
      const micSource = audioContext.createMediaStreamSource(micStream);

      systemSource.connect(destination);
      micSource.connect(destination);

      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
      ]);

      mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' });

      recordedChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if (recordedChunks.length === 0) {
          alert("No data was recorded.");
          return;
        }

        const blob = new Blob(recordedChunks, { type: 'video/webm;codecs=vp9,opus' });

        // Optional local download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "meet-recording.webm";
        a.click();

        // Upload to Google Drive
        chrome.runtime.sendMessage(
          { action: "uploadToDrive", blob, mimeType: "video/webm;codecs=vp9,opus" },
          (response) => {
            if (response?.success) {
              const fileUrl = `https://drive.google.com/file/d/${response.fileId}/view`;
              alert("Recording uploaded to Drive.\n\nView File: " + fileUrl);
            } else {
              const err = response?.error;
              const errorMsg = typeof err === "string" ? err :
                              err?.message ? err.message :
                              JSON.stringify(err || "Unknown error");
              alert("Upload failed: " + errorMsg);
            }
          }
        );
      };

      mediaRecorder.start();
      isRecording = true;
      btn.innerText = "🛑 Stop Recording";
      btn.style.background = "#E53935";

    } catch (err) {
      alert("Permission error: " + err.message);
      console.error("Recording error:", err);
    }
  } else {
    mediaRecorder.stop();
    isRecording = false;
    btn.innerText = "📹 Start Recording";
    btn.style.background = "#4CAF50";
  }
};
