const synth = window.speechSynthesis;
let voices = [];

const languageSelect = document.getElementById("languageSelect");
const voiceSelect = document.getElementById("voiceSelect");
const speakButton = document.getElementById("speakButton");
const downloadButton = document.getElementById("downloadButton");
const textInput = document.getElementById("textInput");

function getUniqueLanguages(voices) {
  const langs = voices.map((v) => v.lang);
  return [...new Set(langs)].sort();
}

function populateLanguageList() {
  const langs = getUniqueLanguages(voices);
  languageSelect.innerHTML = "";
  langs.forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang;
    option.textContent = lang;
    languageSelect.appendChild(option);
  });
  // Automatically trigger population of voices for first language
  populateVoiceList(langs[0]);
}

function populateVoiceList(lang) {
  voiceSelect.innerHTML = "";
  const filtered = voices.filter((voice) => voice.lang === lang);
  filtered.forEach((voice, index) => {
    const option = document.createElement("option");
    option.textContent = `${voice.name} (${voice.lang})`;
    option.value = voices.indexOf(voice); // Use full list index
    voiceSelect.appendChild(option);
  });
}

function initVoices() {
  voices = synth.getVoices();
  populateLanguageList();
}

if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = initVoices;
}

languageSelect.addEventListener("change", (e) => {
  populateVoiceList(e.target.value);
});

speakButton.onclick = () => {
  const text = textInput.value.trim();
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voices[voiceSelect.value];
  utterance.lang = utterance.voice.lang;
  synth.speak(utterance);

  // Setup audio recording for download
  // const audioStream = document.createElement("audio");
  const mediaStreamDestination = new MediaStreamAudioDestinationNode(new AudioContext());
  const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
  const chunks = [];

  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);
    downloadButton.href = url;
    downloadButton.download = "speech-output.webm";
    downloadButton.style.display = "inline-block";
    downloadButton.disabled = false;
  };

  try {
    // Experimental download via Web Audio API
    const context = new AudioContext();
    const source = context.createMediaStreamSource(mediaStreamDestination.stream);
    source.connect(context.destination);
    mediaRecorder.start();

    utterance.onend = () => {
      mediaRecorder.stop();
      context.close();
    };
  } catch (e) {
    console.warn("Audio recording not supported or failed", e);
  }
};
