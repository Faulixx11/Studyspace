const videoInput = document.getElementById("videoInput");
const dropzone = document.getElementById("dropzone");
const browseButton = document.getElementById("browseButton");
const fileCard = document.getElementById("fileCard");
const fileName = document.getElementById("fileName");
const fileMeta = document.getElementById("fileMeta");
const removeFile = document.getElementById("removeFile");
const generateButton = document.getElementById("generateButton");
const promptInput = document.getElementById("promptInput");
const styleSelect = document.getElementById("styleSelect");
const ratioSelect = document.getElementById("ratioSelect");
const sourcePreview = document.getElementById("sourcePreview");
const resultPreview = document.getElementById("resultPreview");
const emptyState = document.getElementById("emptyState");
const previewTag = document.getElementById("previewTag");
const previewFilebar = document.getElementById("previewFilebar");
const previewFilename = document.getElementById("previewFilename");
const previewDuration = document.getElementById("previewDuration");
const formError = document.getElementById("formError");
const modeChip = document.getElementById("modeChip");
const connectionText = document.getElementById("connectionText");
const statusTitle = document.getElementById("statusTitle");
const statusMessage = document.getElementById("statusMessage");
const statusPercent = document.getElementById("statusPercent");
const progressFill = document.getElementById("progressFill");
const resultDetails = document.getElementById("resultDetails");
const resultNotes = document.getElementById("resultNotes");
const finalDuration = document.getElementById("finalDuration");
const sectionCount = document.getElementById("sectionCount");
const captionCount = document.getElementById("captionCount");
const downloadButton = document.getElementById("downloadButton");
const timelineTrack = document.querySelector(".timeline-track");
const timelineLabel = document.getElementById("timelineLabel");
const maxUpload = document.getElementById("maxUpload");

let selectedFile = null;
let sourceUrl = null;
let currentJobId = null;
let polling = false;
let maxUploadMb = 500;

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(value / 60);
  const rest = value % 60;
  return String(minutes).padStart(2, "0") + ":" + String(rest).padStart(2, "0");
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function showError(message) {
  formError.textContent = message;
  formError.classList.remove("hidden");
}

function clearError() {
  formError.textContent = "";
  formError.classList.add("hidden");
}

function setStatus(title, message, progress) {
  statusTitle.textContent = title;
  statusMessage.textContent = message;
  const safe = Math.max(0, Math.min(100, Number(progress) || 0));
  progressFill.style.width = safe + "%";
  statusPercent.textContent = safe ? Math.round(safe) + "%" : "—";
}

function setFile(file) {
  clearError();
  resultDetails.classList.add("hidden");
  resultPreview.classList.add("hidden");
  sourcePreview.classList.add("hidden");
  emptyState.classList.remove("hidden");
  previewFilebar.classList.add("hidden");

  if (!file) return;
  const extension = (file.name.split(".").pop() || "").toLowerCase();
  const allowed = ["mp4", "mov", "m4v", "mkv", "webm"];
  if (!allowed.includes(extension)) {
    showError("Please choose an MP4, MOV, M4V, MKV or WebM video.");
    return;
  }
  if (file.size > maxUploadMb * 1024 * 1024) {
    showError("This file is larger than the current " + maxUploadMb + " MB upload limit.");
    return;
  }
  selectedFile = file;
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = URL.createObjectURL(file);
  sourcePreview.src = sourceUrl;
  sourcePreview.classList.remove("hidden");
  emptyState.classList.add("hidden");
  previewTag.textContent = "SOURCE FOOTAGE";
  previewTag.classList.remove("hidden");
  fileCard.classList.remove("hidden");
  fileName.textContent = file.name;
  fileMeta.textContent = formatBytes(file.size) + " · Local preview";
  previewFilename.textContent = file.name;
  previewFilebar.classList.remove("hidden");
  previewDuration.textContent = "Reading duration…";
  sourcePreview.onloadedmetadata = () => {
    previewDuration.textContent = formatTime(sourcePreview.duration);
  };
  generateButton.disabled = false;
  setStatus("Ready to create", "Your source video is loaded. Describe the edit you want.", 0);
  timelineLabel.textContent = "Awaiting instructions";
  timelineTrack.innerHTML = '<div class="timeline-empty">Your cut will appear here</div>';
}

function resetFile() {
  selectedFile = null;
  videoInput.value = "";
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = null;
  sourcePreview.pause();
  sourcePreview.removeAttribute("src");
  sourcePreview.load();
  sourcePreview.classList.add("hidden");
  resultPreview.classList.add("hidden");
  emptyState.classList.remove("hidden");
  previewTag.classList.add("hidden");
  fileCard.classList.add("hidden");
  previewFilebar.classList.add("hidden");
  resultDetails.classList.add("hidden");
  generateButton.disabled = true;
  setStatus("Waiting for footage", "Your workspace is ready when you are.", 0);
  timelineLabel.textContent = "No edit yet";
  timelineTrack.innerHTML = '<div class="timeline-empty">Your cut will appear here</div>';
  clearError();
}

browseButton.addEventListener("click", () => videoInput.click());
dropzone.addEventListener("click", (event) => {
  if (event.target.closest("button")) return;
  videoInput.click();
});
dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    videoInput.click();
  }
});
videoInput.addEventListener("change", () => setFile(videoInput.files?.[0]));
removeFile.addEventListener("click", resetFile);

["dragenter", "dragover"].forEach((name) => dropzone.addEventListener(name, (event) => {
  event.preventDefault();
  dropzone.classList.add("dragover");
}));
["dragleave", "drop"].forEach((name) => dropzone.addEventListener(name, (event) => {
  event.preventDefault();
  dropzone.classList.remove("dragover");
}));
dropzone.addEventListener("drop", (event) => {
  const file = event.dataTransfer?.files?.[0];
  if (file) setFile(file);
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    promptInput.value = button.dataset.prompt || "";
    promptInput.focus();
  });
});

function requestUpload(formData) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/jobs");
    xhr.responseType = "json";
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 12);
        setStatus("Uploading video", "Securely transferring your source footage…", progress);
      }
    });
    xhr.addEventListener("load", () => {
      const payload = xhr.response || {};
      if (xhr.status >= 200 && xhr.status < 300) resolve(payload);
      else reject(new Error(payload.error || "The upload failed. Please try again."));
    });
    xhr.addEventListener("error", () => reject(new Error("Could not reach the server. Is it running?")));
    xhr.addEventListener("abort", () => reject(new Error("The upload was cancelled.")));
    xhr.send(formData);
  });
}

async function pollJob(id) {
  if (polling) return;
  polling = true;
  try {
    while (true) {
      const response = await fetch("/api/jobs/" + encodeURIComponent(id));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not read the job status.");
      setStatus(
        data.status === "complete" ? "Edit complete" :
          data.status === "rendering" ? "Rendering your edit" :
            data.status === "analyzing" ? "AI is analysing your footage" : "Preparing your project",
        data.message,
        data.progress
      );

      if (data.status === "error") throw new Error(data.error || data.message || "The edit failed.");
      if (data.status === "complete") {
        showResult(id, data.plan);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  } finally {
    polling = false;
  }
}

function showResult(id, plan) {
  const resultUrl = "/api/jobs/" + encodeURIComponent(id) + "/video";
  sourcePreview.pause();
  sourcePreview.classList.add("hidden");
  emptyState.classList.add("hidden");
  resultPreview.src = resultUrl;
  resultPreview.classList.remove("hidden");
  resultPreview.load();
  previewTag.textContent = "AI EDIT · FINAL RENDER";
  previewTag.classList.remove("hidden");
  previewFilebar.classList.add("hidden");
  resultDetails.classList.remove("hidden");
  resultNotes.textContent = (plan?.aiUsed ? "AI edit: " : "Demo render: ") + (plan?.notes || "Your video has been rendered.");
  finalDuration.textContent = formatTime(plan?.outputDuration);
  sectionCount.textContent = String(plan?.segments?.length || 1);
  captionCount.textContent = String(plan?.captionsCount || 0);
  downloadButton.href = resultUrl + "?download=1";
  timelineLabel.textContent = (plan?.aiUsed ? "AI edit plan" : "Demo render") + " · " + String(plan?.segments?.length || 1) + " sections";
  timelineTrack.innerHTML = "";
  const segments = plan?.segments || [];
  const total = segments.reduce((sum, item) => sum + Math.max(.1, item.end - item.start), 0) || 1;
  segments.forEach((item) => {
    const block = document.createElement("div");
    block.className = "timeline-segment";
    block.style.flex = String(Math.max(.1, item.end - item.start) / total);
    block.title = formatTime(item.start) + " – " + formatTime(item.end) + (item.reason ? " · " + item.reason : "");
    timelineTrack.appendChild(block);
  });
}

generateButton.addEventListener("click", async () => {
  clearError();
  if (!selectedFile) return showError("Choose a video before starting the edit.");
  if (currentJobId) return showError("An edit is already running. Wait for it to finish first.");

  generateButton.disabled = true;
  generateButton.querySelector("span").textContent = "Preparing edit…";
  resultDetails.classList.add("hidden");
  resultPreview.classList.add("hidden");
  sourcePreview.classList.remove("hidden");
  previewTag.textContent = "SOURCE FOOTAGE";
  setStatus("Preparing your project", "Creating a secure edit job…", 2);

  try {
    const formData = new FormData();
    formData.append("video", selectedFile, selectedFile.name);
    formData.append("prompt", promptInput.value);
    formData.append("style", styleSelect.value);
    formData.append("aspectRatio", ratioSelect.value);
    const created = await requestUpload(formData);
    currentJobId = created.id;
    await pollJob(currentJobId);
  } catch (error) {
    showError(error.message || "Something went wrong.");
    setStatus("Edit stopped", "Check the error message and try again.", 0);
  } finally {
    currentJobId = null;
    generateButton.disabled = !selectedFile;
    generateButton.querySelector("span").textContent = "Generate my edit";
  }
});

async function checkServer() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error("Server unavailable");
    const data = await response.json();
    maxUploadMb = Number(data.maxUploadMb || 500);
    maxUpload.textContent = String(maxUploadMb);
    if (data.aiConfigured) {
      modeChip.classList.remove("demo", "offline");
      modeChip.innerHTML = '<span class="mode-dot"></span> AI CONNECTED';
      connectionText.textContent = "AI engine connected";
    } else {
      modeChip.classList.add("demo");
      modeChip.innerHTML = '<span class="mode-dot"></span> DEMO MODE';
      connectionText.textContent = "Demo mode · API key missing";
    }
  } catch {
    modeChip.classList.add("offline");
    modeChip.innerHTML = '<span class="mode-dot"></span> SERVER OFFLINE';
    connectionText.textContent = "Start the local server";
    setStatus("Server not connected", "Run npm start in the project folder, then refresh this page.", 0);
  }
}

checkServer();
