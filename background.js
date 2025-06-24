chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "uploadToDrive" && message.blob) {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        sendResponse({ success: false, error: chrome.runtime.lastError });
        return;
      }

      const metadata = {
        name: `meet-recording-${Date.now()}.webm`,
        mimeType: message.mimeType || "video/webm",
        parents: ["1IyddwhenIlD-iNIIdPj-JuncpaJzLT5d"]
      };

      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", message.blob);

      fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
        method: "POST",
        headers: new Headers({ Authorization: "Bearer " + token }),
        body: form
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Drive API response:", data); // 🔍 Debug line

          if (data && data.id) {
            const fileUrl = `https://drive.google.com/file/d/${data.id}/view`;
            sendResponse({ success: true, fileId: data.id, fileUrl });
          } else {
            sendResponse({
              success: false,
              error: "Upload succeeded but file ID is missing.",
              response: data
            });
          }
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message || error });
        });
    });

    return true;
  }

  if (message.test) {
    sendResponse({ reply: "Background is alive ✅" });
    return true;
  }
});
