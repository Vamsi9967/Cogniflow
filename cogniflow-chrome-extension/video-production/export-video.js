/**
 * CogniFlow Video Exporter
 * Captures 1920x1080 frame-accurate canvas stream + Web Audio destination
 * Encodes directly to MP4/WebM master video file.
 */

class CogniFlowVideoExporter {
  constructor() {
    this.isExporting = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.btnExport = document.getElementById('btn-export');
    this.progressBar = document.getElementById('export-progress');
    this.progressFill = document.getElementById('export-fill');
  }

  async startExport() {
    if (this.isExporting) return;
    this.isExporting = true;

    // Pause current player and reset to 0
    window.player.pause();
    window.player.seek(0);

    this.btnExport.textContent = 'Recording 1080p...';
    this.btnExport.style.background = '#FF5F56';
    this.progressBar.style.display = 'block';

    // Create master offscreen rendering canvas at 1920x1080
    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = 1920;
    masterCanvas.height = 1080;
    const masterCtx = masterCanvas.getContext('2d');

    // Video stream from master canvas at 30 FPS
    const videoStream = masterCanvas.captureStream(30);

    // Audio stream from AudioEngine
    const audioStream = window.audioEngine.getAudioStream();
    const tracks = [...videoStream.getVideoTracks()];
    if (audioStream && audioStream.getAudioTracks().length > 0) {
      tracks.push(...audioStream.getAudioTracks());
    }
    const combinedStream = new MediaStream(tracks);

    // Determine supported mime type
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else {
        mimeType = '';
      }
    }

    try {
      const options = { videoBitsPerSecond: 16000000 };
      if (mimeType) options.mimeType = mimeType;
      this.mediaRecorder = new MediaRecorder(combinedStream, options);
    } catch (e) {
      console.warn('Standard MediaRecorder fallback:', e);
      this.mediaRecorder = new MediaRecorder(combinedStream);
    }

    this.recordedChunks = [];
    this.mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) this.recordedChunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      this.finishExport();
    };

    this.mediaRecorder.start(100);

    // Start soundtrack audio
    window.audioEngine.playAt(0);

    // Frame-by-frame clock for 35.0 seconds at 30 FPS
    const totalFrames = 35 * 30; // 1050 frames
    let currentFrame = 0;
    const frameIntervalMs = 1000 / 30;

    const exportStep = () => {
      if (!this.isExporting) return;

      const t = currentFrame / 30.0;
      window.player.seek(t);

      // Render full visual frame to master canvas
      window.motionRenderer.renderToCanvas(masterCtx, t);

      currentFrame++;
      const progressPercent = Math.min(100, Math.round((currentFrame / totalFrames) * 100));
      this.progressFill.style.width = `${progressPercent}%`;

      if (currentFrame <= totalFrames) {
        setTimeout(exportStep, frameIntervalMs);
      } else {
        this.mediaRecorder.stop();
        window.audioEngine.pause();
      }
    };

    exportStep();
  }

  finishExport() {
    this.isExporting = false;
    const mime = (this.mediaRecorder && this.mediaRecorder.mimeType) || 'video/webm';
    const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    const blob = new Blob(this.recordedChunks, { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `CogniFlow-Launch-Film-1080p.${ext}`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 1000);

    this.btnExport.textContent = '✓ Downloaded!';
    this.btnExport.style.background = '#20C997';
    setTimeout(() => {
      this.btnExport.textContent = 'Export 1080p Video';
      this.btnExport.style.background = '';
      this.progressBar.style.display = 'none';
      this.progressFill.style.width = '0%';
    }, 3500);
  }
}

window.videoExporter = new CogniFlowVideoExporter();
