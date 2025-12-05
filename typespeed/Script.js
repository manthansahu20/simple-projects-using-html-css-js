// Typing Test App (Vanilla JS)
// Save this file as script.js

// --------- Text pool (add more samples if you want) ----------
const TEXTS = [
  "The quick brown fox jumps over the lazy dog.",
  "Practice makes perfect. Keep typing every day to improve speed and accuracy.",
  "Learning to code is like learning a new language. Patience and practice help a lot.",
  "Small consistent steps lead to big results over time.",
  "Design, build, and ship. Feedback will guide your improvements."
];

// --------- DOM Elements ----------
const textDisplay = document.getElementById("textDisplay");
const inputArea = document.getElementById("inputArea");
const timeSelect = document.getElementById("timeSelect");
const timeLeftEl = document.getElementById("timeLeft");
const wpmEl = document.getElementById("wpm");
const correctEl = document.getElementById("correctChars");
const incorrectEl = document.getElementById("incorrectChars");
const typedEl = document.getElementById("typedChars");
const accuracyEl = document.getElementById("accuracy");
const newTextBtn = document.getElementById("newTextBtn");
const restartBtn = document.getElementById("restartBtn");
const historyList = document.getElementById("historyList");

let currentText = "";
let chars = []; // array of characters
let currentIndex = 0;
let timer = null;
let started = false;
let totalTime = parseInt(timeSelect.value, 10);
let timeLeft = totalTime;
let typedChars = 0;
let correctChars = 0;
let incorrectChars = 0;
let startTimestamp = null;

// load history from localStorage
function loadHistory(){
  const raw = localStorage.getItem("typing_history");
  const arr = raw ? JSON.parse(raw) : [];
  historyList.innerHTML = "";
  arr.forEach(r=>{
    const li = document.createElement("li");
    li.textContent = `${r.wpm} WPM • ${r.accuracy}% • ${r.time}s`;
    historyList.appendChild(li);
  });
}

// save result to history
function saveResult(result){
  const raw = localStorage.getItem("typing_history");
  const arr = raw ? JSON.parse(raw) : [];
  arr.unshift(result);
  if(arr.length>10) arr.pop();
  localStorage.setItem("typing_history", JSON.stringify(arr));
  loadHistory();
}

// get random text
function pickText(){
  return TEXTS[Math.floor(Math.random()*TEXTS.length)];
}

// render text with spans for each char
function renderText(txt){
  textDisplay.innerHTML = "";
  chars = Array.from(txt);
  chars.forEach((ch, i) => {
    const span = document.createElement("span");
    span.className = "char";
    if(ch === " ") {
      span.classList.add("space");
      span.textContent = "•"; // small visible dot instead of blank to show spaces
    } else {
      span.textContent = ch;
    }
    textDisplay.appendChild(span);
  });
  // mark first char as current
  setCurrentChar(0);
}

// mark current char index
function setCurrentChar(i){
  const spans = textDisplay.querySelectorAll(".char");
  spans.forEach(s=> s.classList.remove("current"));
  if(spans[i]) spans[i].classList.add("current");
}

// start timer
function startTimer(){
  if(started) return;
  started = true;
  startTimestamp = Date.now();
  timeLeft = parseInt(timeSelect.value, 10);
  timeLeftEl.textContent = timeLeft;
  timer = setInterval(()=>{
    const elapsed = Math.floor((Date.now() - startTimestamp)/1000);
    const left = Math.max(0, parseInt(timeSelect.value,10) - elapsed);
    timeLeft = left;
    timeLeftEl.textContent = left;
    updateStats();
    if(left <= 0){
      finishTest();
    }
  }, 200);
}

// update stats live
function updateStats(){
  typedEl.textContent = typedChars;
  correctEl.textContent = correctChars;
  incorrectEl.textContent = incorrectChars;

  // WPM calculation: correct characters / 5 per minute
  const elapsedSec = Math.max(1, (parseInt(timeSelect.value,10) - timeLeft));
  const minutes = elapsedSec / 60;
  const wpm = minutes > 0 ? Math.round((correctChars / 5) / minutes) : 0;
  wpmEl.textContent = wpm;

  const accuracy = typedChars > 0 ? Math.round((correctChars / typedChars) * 100) : 100;
  accuracyEl.textContent = accuracy;
}

// finish test
function finishTest(){
  clearInterval(timer);
  started = false;
  inputArea.disabled = true;

  // final WPM + accuracy
  const elapsedSec = parseInt(timeSelect.value,10);
  const minutes = elapsedSec / 60;
  const finalWpm = Math.round((correctChars / 5) / minutes);
  const finalAcc = typedChars > 0 ? Math.round((correctChars / typedChars) * 100) : 100;

  // save
  saveResult({ wpm: finalWpm, accuracy: finalAcc, time: parseInt(timeSelect.value,10), date: new Date().toISOString() });

  // small flash result
  wpmEl.textContent = finalWpm;
  accuracyEl.textContent = finalAcc;
  alert(`Test finished!\nWPM: ${finalWpm}\nAccuracy: ${finalAcc}%`);
}

// handle restart/new text
function resetTest(newText = false){
  clearInterval(timer);
  started = false;
  inputArea.disabled = false;
  inputArea.value = "";
  typedChars = 0;
  correctChars = 0;
  incorrectChars = 0;
  currentIndex = 0;
  totalTime = parseInt(timeSelect.value, 10);
  timeLeft = totalTime;
  timeLeftEl.textContent = totalTime;
  wpmEl.textContent = 0;
  correctEl.textContent = 0;
  incorrectEl.textContent = 0;
  typedEl.textContent = 0;
  accuracyEl.textContent = 100;

  if(newText || !currentText){
    currentText = pickText();
  }
  renderText(currentText);
  inputArea.focus();
}

// handle input keystrokes
inputArea.addEventListener("input", (e) => {
  // disable paste: ignore big inputs
  if(e.inputType === 'insertFromPaste'){
    inputArea.value = inputArea.value.slice(0, -1);
    return;
  }
  if(!started) startTimer();

  const value = inputArea.value;
  // compare last typed character to text at currentIndex
  const lastChar = value.charAt(value.length - 1);
  if(lastChar === "") return; // nothing typed

  // typed total
  typedChars = value.length;

  // move through characters and mark spans
  const spans = textDisplay.querySelectorAll(".char");

  // find the index to check (currentIndex)
  const i = value.length - 1;

  if(i < chars.length){
    const expected = chars[i];
    // normalize space for display dots
    const expectedChar = expected === " " ? "•" : expected;
    const targetSpan = spans[i];

    if(lastChar === expected || (expected === " " && lastChar === " ")){
      // correct
      if(targetSpan){
        targetSpan.classList.remove("incorrect");
        targetSpan.classList.add("correct");
      }
      correctChars++;
    } else {
      if(targetSpan){
        targetSpan.classList.remove("correct");
        targetSpan.classList.add("incorrect");
      }
      incorrectChars++;
    }
  } else {
    // typed more than text length: count as incorrect
    incorrectChars++;
  }

  currentIndex = value.length;
  setCurrentChar(currentIndex);
  updateStats();
});

// handle backspace and deletion: we need to recalc entire typed result safe way
inputArea.addEventListener("keyup", (e) => {
  if(e.key === "Backspace" || e.key === "Delete"){
    // recompute from scratch
    const value = inputArea.value;
    typedChars = value.length;
    correctChars = 0;
    incorrectChars = 0;
    const spans = textDisplay.querySelectorAll(".char");
    spans.forEach(s => s.classList.remove("correct","incorrect"));
    for(let i=0;i<value.length;i++){
      const expected = chars[i];
      const typed = value.charAt(i);
      const span = spans[i];
      if(typed === expected || (expected === " " && typed === " ")){
        correctChars++;
        if(span) span.classList.add("correct");
      } else {
        incorrectChars++;
        if(span) span.classList.add("incorrect");
      }
    }
    currentIndex = value.length;
    setCurrentChar(currentIndex);
    updateStats();
  }
});

// prevent paste via context menu too
inputArea.addEventListener("paste", (e)=> {
  e.preventDefault();
  return false;
});

// new text button
newTextBtn.addEventListener("click", ()=> {
  currentText = pickText();
  resetTest(true);
});

// restart (same text)
restartBtn.addEventListener("click", ()=> {
  resetTest(false);
});

// time change resets
timeSelect.addEventListener("change", ()=> {
  resetTest(false);
});

// initialize
(function init(){
  currentText = pickText();
  resetTest(true);
  loadHistory();
})();
