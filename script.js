const start = document.getElementById("start-btn");
      const stop = document.getElementById("stop-btn");
      const record = document.getElementById("recordedVideo");
      const videoList = document.getElementById("video-list");

      let mediaRecorder;
      let recordedChunks = [];

      async function startRecording() {
        try {
          // Capture screen
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });

          // Capture microphone audio
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });

          // Combine screen and audio streams
          const combinedStream = new MediaStream([
            ...screenStream.getVideoTracks(),
            ...audioStream.getAudioTracks(),
          ]);

          mediaRecorder = new MediaRecorder(combinedStream);
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              recordedChunks.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: "video/webm" });
            record.src = URL.createObjectURL(blob);

            // Upload the video to the server
            await uploadVideo(blob);

            // Clear recorded chunks for the next recording
            recordedChunks = [];
          };

          start.disabled = true;
          stop.disabled = false;
          mediaRecorder.start();
        } catch (error) {
          console.error("Error starting recording:", error);
        }
      }

      async function uploadVideo(blob) {
        const formData = new FormData();
        formData.append("video", blob, "recording.webm");

        try {
          const response = await fetch("/upload", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            console.log("Video uploaded successfully!");
            // Refresh the list of videos
            fetchVideos();
          } else {
            console.error("Failed to upload video.");
          }
        } catch (error) {
          console.error("Error uploading video:", error);
        }
      }

      async function fetchVideos() {
        try {
          const response = await fetch("/videos");
          const videos = await response.json();

          // Display the list of videos
          videoList.innerHTML = videos
            .map(
              (video) => `
              <div class="video-card">
                <video src="/uploads/${video}" controls></video>
              </div>
            `
            )
            .join("");
        } catch (error) {
          console.error("Error fetching videos:", error);
        }
      }

      start.addEventListener("click", startRecording);
      stop.addEventListener("click", () => {
        mediaRecorder.stop();
        start.disabled = false;
        stop.disabled = true;
      });

      // Fetch videos when the page loads
      fetchVideos();