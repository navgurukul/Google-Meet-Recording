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
      alert("📢 IMPORTANT:\n\nSelect 'Entire Screen' and make sure to tick 'Share system audio'.");

      // Step 1: Get screen + system audio
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Step 2: Get mic audio
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      // Step 3: Combine all tracks (video + system audio + mic)
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...screenStream.getAudioTracks(),   // system audio
        ...micStream.getAudioTracks()      // mic audio
      ]);

      // ✅ Debug Logs
      console.log("ScreenStream audio tracks:", screenStream.getAudioTracks());
      console.log("MicStream audio tracks:", micStream.getAudioTracks());
      console.log("CombinedStream audio tracks:", combinedStream.getAudioTracks());

      // Step 4: Create recorder
      mediaRecorder = new MediaRecorder(combinedStream); // ← fallback mime type

      recordedChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if (recordedChunks.length === 0) {
          alert("No data was recorded.");
          return;
        }

        const blob = new Blob(recordedChunks, { type: "video/webm" });

        // Optional local download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "meet-recording.webm";
        a.click();

        // Upload to Google Drive
        chrome.runtime.sendMessage(
          { action: "uploadToDrive", blob, mimeType: "video/webm" },
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
