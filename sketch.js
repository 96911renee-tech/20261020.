/* 這是一個 p5.js 全螢幕拖曳題測驗系統，請直接放入既有專案的 sketch.js。 */ // 這行說明檔案用途
/* 使用方式一：將下方 GIF_URL 改成可直接開啟的 GIF 圖片網址。 */ // 這行說明 GIF 替換方式
/* 使用方式二：index.html 必須先載入 p5.js，再載入本 sketch.js。 */ // 這行說明載入順序
/* 使用方式三：例如先放 <script src="p5.js"></script>，再放 <script src="sketch.js"></script>。 */ // 這行提供 HTML 載入範例
/* 若 GIF_URL 留白、載入中或載入失敗，系統會自動使用內建 p5.js 動畫。 */ // 這行說明 GIF 備援機制

const GIF_URL = ""; // 請將空字串替換成你的 GIF 直接網址
const QUESTION_COUNT = 6; // 設定測驗題目總數
const QUESTIONS = [ // 建立六個 p5.js 基礎題目
  { // 開始第一題資料
    prompt: "哪一個函式用來建立 p5.js 的畫布？", // 設定第一題題目
    correct: "createCanvas()", // 設定第一題正確答案
    choices: ["createCanvas()", "background()", "ellipse()", "rect()", "draw()", "mousePressed()"] // 設定第一題六個選項
  }, // 結束第一題資料
  { // 開始第二題資料
    prompt: "哪一個函式用來設定畫布的背景顏色？", // 設定第二題題目
    correct: "background()", // 設定第二題正確答案
    choices: ["ellipse()", "background()", "createCanvas()", "rect()", "draw()", "mousePressed()"] // 設定第二題六個選項
  }, // 結束第二題資料
  { // 開始第三題資料
    prompt: "哪一個函式可以在畫布上繪製橢圓形？", // 設定第三題題目
    correct: "ellipse()", // 設定第三題正確答案
    choices: ["rect()", "draw()", "ellipse()", "background()", "mousePressed()", "createCanvas()"] // 設定第三題六個選項
  }, // 結束第三題資料
  { // 開始第四題資料
    prompt: "哪一個函式可以在畫布上繪製矩形？", // 設定第四題題目
    correct: "rect()", // 設定第四題正確答案
    choices: ["mousePressed()", "rect()", "createCanvas()", "ellipse()", "background()", "draw()"] // 設定第四題六個選項
  }, // 結束第四題資料
  { // 開始第五題資料
    prompt: "哪一個函式會在 p5.js 中持續重複執行以製作動畫？", // 設定第五題題目
    correct: "draw()", // 設定第五題正確答案
    choices: ["draw()", "rect()", "mousePressed()", "background()", "createCanvas()", "ellipse()"] // 設定第五題六個選項
  }, // 結束第五題資料
  { // 開始第六題資料
    prompt: "哪一個函式會在使用者按下滑鼠時執行？", // 設定第六題題目
    correct: "mousePressed()", // 設定第六題正確答案
    choices: ["background()", "ellipse()", "mousePressed()", "draw()", "rect()", "createCanvas()"] // 設定第六題六個選項
  } // 結束第六題資料
]; // 結束全部題目資料

let canvas; // 保存 p5.js 畫布物件
let gifElement = null; // 保存網頁上的 GIF 圖片元素
let gifState = "fallback"; // 保存 GIF 狀態並預設使用內建動畫
let currentQuestion = 0; // 保存目前顯示的題目索引
let selectedAnswers = []; // 保存每一題目前選定的答案
let answerStates = []; // 保存每一題的正確或錯誤狀態
let feedbackText = "請將下方選項拖曳到上方答案區。"; // 保存目前提示文字
let feedbackType = "normal"; // 保存提示文字的顯示類型
let isDragging = false; // 記錄目前是否正在拖曳選項
let draggedChoice = ""; // 保存正在拖曳的選項文字
let draggedFromAnswer = false; // 記錄選項是否從答案區開始拖曳
let hasSubmitted = false; // 記錄使用者是否已經交卷
let score = 0; // 保存答對題數
let percentage = 0; // 保存測驗百分比
let confetti = []; // 保存彩帶粒子資料
let layout = {}; // 保存全螢幕介面各區域位置

function preload() { // p5.js 載入階段函式
  if (GIF_URL.trim() !== "") { // 判斷使用者是否有填入 GIF 網址
    gifState = "loading"; // 將 GIF 狀態設定為載入中
  } // 結束 GIF 網址判斷
} // 結束載入階段函式

function setup() { // p5.js 初始化函式
  canvas = createCanvas(windowWidth, windowHeight); // 建立全螢幕畫布
  canvas.elt.setAttribute("aria-label", "p5.js 拖曳題測驗畫布"); // 為畫布加入無障礙說明
  textFont("Noto Sans TC, Microsoft JhengHei, sans-serif"); // 設定繁體中文優先字型
  textAlign(LEFT, CENTER); // 設定文字預設靠左並垂直置中
  rectMode(CORNER); // 設定矩形使用左上角座標
  initializeQuiz(); // 初始化題目答案與提示狀態
  createGifElement(); // 建立可替換的 GIF 圖片元素
  calculateLayout(); // 計算全螢幕介面配置
  updateGifElement(); // 將 GIF 放到上方圖片區域
} // 結束初始化函式

function draw() { // p5.js 每幀重複執行函式
  calculateLayout(); // 每幀重新計算配置以支援不同視窗大小
  drawBackground(); // 繪製整體背景與頁首
  drawMediaArea(); // 繪製 GIF 區域或內建動畫備援
  drawQuestionArea(); // 繪製題目與答案區
  drawChoiceCards(); // 繪製下方六個拖曳選項
  drawNavigation(); // 繪製上一題、題號與下一題按鈕
  drawDragPreview(); // 繪製跟隨滑鼠的拖曳卡片
  if (hasSubmitted && percentage > 60) { // 判斷是否需要顯示彩帶
    updateAndDrawConfetti(); // 更新並繪製成功彩帶動畫
  } // 結束彩帶判斷
  updateGifElement(); // 每幀更新 GIF 的位置與大小
} // 結束繪圖函式

function windowResized() { // p5.js 視窗縮放回呼函式
  resizeCanvas(windowWidth, windowHeight); // 讓畫布跟著視窗重新調整
  calculateLayout(); // 重新計算所有介面區域
  updateGifElement(); // 重新設定 GIF 的位置與大小
} // 結束視窗縮放函式

function createGifElement() { // 建立 GIF 網頁元素的函式
  if (GIF_URL.trim() === "") { // 判斷 GIF 網址是否為空白
    gifState = "fallback"; // 空白網址時直接使用內建動畫
    return; // 結束 GIF 建立流程
  } // 結束空白網址判斷
  gifElement = createImg(GIF_URL, "p5.js 教學動畫", handleGifLoaded); // 使用 p5.js 建立 GIF 圖片元素
  gifElement.elt.onerror = handleGifError; // 監聽 GIF 載入失敗事件
  gifElement.style("object-fit", "contain"); // 讓 GIF 保持比例完整顯示
  gifElement.style("background", "#10233f"); // 為 GIF 元素設定深色背景
  gifElement.style("border-radius", "16px"); // 讓 GIF 元素四角圓滑
  gifElement.style("z-index", "2"); // 讓 GIF 位於圖片區域上方
  gifElement.hide(); // 載入完成前先隱藏 GIF 元素
} // 結束 GIF 建立函式

function handleGifLoaded() { // 處理 GIF 載入成功的函式
  gifState = "ready"; // 將 GIF 狀態設定為成功
  if (gifElement !== null) { // 確認 GIF 元素已經建立
    gifElement.show(); // 顯示成功載入的 GIF
  } // 結束 GIF 元素確認
} // 結束 GIF 成功函式

function handleGifError() { // 處理 GIF 載入失敗的函式
  gifState = "error"; // 將 GIF 狀態設定為失敗
  if (gifElement !== null) { // 確認 GIF 元素已經建立
    gifElement.hide(); // 隱藏失敗的 GIF 元素
  } // 結束 GIF 元素確認
} // 結束 GIF 失敗函式

function initializeQuiz() { // 初始化測驗資料的函式
  selectedAnswers = Array(QUESTION_COUNT).fill(""); // 建立六個空白答案位置
  answerStates = Array(QUESTION_COUNT).fill("empty"); // 建立六個未作答狀態
  currentQuestion = 0; // 將目前題目重設為第一題
  feedbackText = "請將下方選項拖曳到上方答案區。"; // 重設操作提示
  feedbackType = "normal"; // 重設提示樣式
  isDragging = false; // 清除拖曳狀態
  draggedChoice = ""; // 清除拖曳文字
  draggedFromAnswer = false; // 清除拖曳來源狀態
  hasSubmitted = false; // 清除交卷狀態
  score = 0; // 清除答對題數
  percentage = 0; // 清除百分比
  confetti = []; // 清除所有彩帶粒子
} // 結束初始化函式

function calculateLayout() { // 計算全螢幕版面配置的函式
  const margin = constrain(width * 0.035, 14, 38); // 依畫布寬度設定邊界距離
  const headerHeight = constrain(height * 0.105, 58, 82); // 依畫布高度設定頁首高度
  const mediaHeight = constrain(height * 0.235, 126, 250); // 依畫布高度設定圖片區高度
  const mediaY = headerHeight + 10; // 設定圖片區的垂直位置
  const answerY = mediaY + mediaHeight + 12; // 設定答案區的垂直位置
  const answerHeight = constrain(height * 0.085, 58, 78); // 設定答案區高度
  const questionY = answerY + answerHeight + 24; // 設定題目文字的垂直位置
  const questionHeight = constrain(height * 0.07, 44, 62); // 設定題目文字區高度
  const optionsY = questionY + questionHeight + 12; // 設定選項卡片起始位置
  const navigationY = height - constrain(height * 0.09, 54, 72); // 設定導覽列垂直位置
  const optionGap = constrain(width * 0.012, 7, 15); // 設定選項卡片間距
  const cardWidth = (width - margin * 2 - optionGap * 2) / 3; // 設定每張選項卡片寬度
  const availableOptionHeight = navigationY - optionsY - 12; // 計算選項可使用高度
  const cardHeight = constrain((availableOptionHeight - optionGap) / 2, 36, 64); // 設定每張選項卡片高度
  layout = { // 保存所有介面區域資料
    margin: margin, // 保存左右邊界
    headerHeight: headerHeight, // 保存頁首高度
    mediaX: margin, // 保存圖片區左側位置
    mediaY: mediaY, // 保存圖片區上方位置
    mediaW: width - margin * 2, // 保存圖片區寬度
    mediaH: mediaHeight, // 保存圖片區高度
    answerX: margin, // 保存答案區左側位置
    answerY: answerY, // 保存答案區上方位置
    answerW: width - margin * 2, // 保存答案區寬度
    answerH: answerHeight, // 保存答案區高度
    questionX: margin, // 保存題目左側位置
    questionY: questionY, // 保存題目上方位置
    questionW: width - margin * 2, // 保存題目區寬度
    questionH: questionHeight, // 保存題目區高度
    optionsX: margin, // 保存選項區左側位置
    optionsY: optionsY, // 保存選項區上方位置
    cardW: cardWidth, // 保存選項卡片寬度
    cardH: cardHeight, // 保存選項卡片高度
    optionGap: optionGap, // 保存選項卡片間距
    navigationY: navigationY, // 保存導覽列上方位置
    navigationH: height - navigationY - 10 // 保存導覽列高度
  }; // 結束版面資料
} // 結束版面計算函式

function updateGifElement() { // 更新 GIF 位置與尺寸的函式
  if (gifElement !== null && gifState === "ready") { // 確認 GIF 已成功載入
    gifElement.position(layout.mediaX, layout.mediaY); // 將 GIF 放入上方圖片區
    gifElement.size(layout.mediaW, layout.mediaH); // 將 GIF 縮放為圖片區大小
  } // 結束 GIF 更新判斷
} // 結束 GIF 更新函式

function drawBackground() { // 繪製背景與頁首的函式
  background("#081426"); // 填滿深藍色背景
  noStroke(); // 關閉一般圖形外框
  fill("#102c4d"); // 設定頁首底色
  rect(0, 0, width, layout.headerHeight); // 繪製頁首區域
  fill("#74e0c0"); // 設定主標題顏色
  textStyle(BOLD); // 設定主標題粗體
  textSize(constrain(width * 0.027, 19, 30)); // 設定主標題大小
  text("p5.js 拖曳題測驗", layout.margin, layout.headerHeight * 0.43); // 繪製主標題
  fill("#c8d8ec"); // 設定作答進度顏色
  textStyle(NORMAL); // 恢復一般字體樣式
  textSize(constrain(width * 0.014, 12, 17)); // 設定進度文字大小
  text(getProgressText(), layout.margin, layout.headerHeight * 0.76); // 繪製作答進度
  drawHeaderButtons(); // 繪製頁首功能按鈕
} // 結束背景函式

function drawHeaderButtons() { // 繪製交卷與重新測驗按鈕的函式
  const resetW = constrain(width * 0.12, 108, 148); // 設定重新測驗按鈕寬度
  const submitW = constrain(width * 0.14, 120, 170); // 設定交卷按鈕寬度
  const buttonH = constrain(layout.headerHeight * 0.52, 34, 46); // 設定頁首按鈕高度
  const resetX = width - layout.margin - resetW; // 設定重新測驗按鈕位置
  const submitX = resetX - 12 - submitW; // 設定交卷按鈕位置
  drawButton(submitX, (layout.headerHeight - buttonH) / 2, submitW, buttonH, "交卷看成績", hasSubmitted, "#f59e6b"); // 繪製交卷按鈕
  drawButton(resetX, (layout.headerHeight - buttonH) / 2, resetW, buttonH, "重新測驗", false, "#74e0c0"); // 繪製重新測驗按鈕
} // 結束頁首按鈕函式

function drawMediaArea() { // 繪製上方 GIF 或備援動畫的函式
  push(); // 保存目前繪圖狀態
  noStroke(); // 關閉圖片區外框
  fill("#10233f"); // 設定圖片區底色
  rect(layout.mediaX, layout.mediaY, layout.mediaW, layout.mediaH, 16); // 繪製圓角圖片區
  if (gifState !== "ready") { // 判斷是否需要繪製內建動畫
    drawFallbackAnimation(); // 繪製不依賴外部檔案的動畫
    fill("#d9e7f5"); // 設定備援說明文字顏色
    textAlign(CENTER, CENTER); // 將備援文字置中
    textStyle(BOLD); // 設定備援文字粗體
    textSize(constrain(width * 0.018, 14, 21)); // 設定備援文字大小
    const message = gifState === "loading" ? "GIF 載入中，先看 p5.js 內建動畫" : "GIF 未設定或載入失敗，使用內建動畫"; // 產生備援狀態文字
    text(message, width / 2, layout.mediaY + layout.mediaH - 23); // 顯示備援狀態文字
    textAlign(LEFT, CENTER); // 恢復一般文字對齊方式
  } // 結束備援動畫判斷
  pop(); // 還原繪圖狀態
} // 結束圖片區函式

function drawFallbackAnimation() { // 繪製 p5.js 內建動畫備援的函式
  push(); // 保存動畫繪圖狀態
  translate(width / 2, layout.mediaY + layout.mediaH * 0.47); // 將動畫中心移到圖片區中央
  const pulse = 1 + sin(frameCount * 0.07) * 0.08; // 計算呼吸動畫比例
  const orbit = frameCount * 0.035; // 計算旋轉動畫角度
  noStroke(); // 關閉動畫圖形外框
  fill("#1d4d72"); // 設定動畫中心背景色
  ellipse(0, 0, min(layout.mediaW, layout.mediaH) * 0.62 * pulse); // 繪製動畫中心圓形
  for (let index = 0; index < 8; index += 1) { // 依序繪製八個旋轉粒子
    const angle = orbit + TWO_PI * index / 8; // 計算每個粒子的角度
    const radius = min(layout.mediaW, layout.mediaH) * 0.28; // 設定粒子旋轉半徑
    const particleX = cos(angle) * radius; // 計算粒子的水平位置
    const particleY = sin(angle) * radius; // 計算粒子的垂直位置
    fill(index % 2 === 0 ? "#74e0c0" : "#f5b86b"); // 交替設定粒子顏色
    ellipse(particleX, particleY, 15 + 5 * sin(frameCount * 0.08 + index)); // 繪製旋轉粒子
  } // 結束粒子迴圈
  fill("#f4fbff"); // 設定中心文字顏色
  textAlign(CENTER, CENTER); // 將中心文字置中
  textStyle(BOLD); // 設定中心文字粗體
  textSize(constrain(width * 0.04, 25, 48)); // 設定中心文字大小
  text("p5.js", 0, 0); // 繪製 p5.js 中心文字
  pop(); // 還原動畫繪圖狀態
} // 結束備援動畫函式

function drawQuestionArea() { // 繪製題目與答案區的函式
  fill("#dceafa"); // 設定題目文字顏色
  textStyle(BOLD); // 設定題目文字粗體
  textSize(constrain(width * 0.019, 15, 22)); // 設定題目文字大小
  text(`第 ${currentQuestion + 1} 題｜${QUESTIONS[currentQuestion].prompt}`, layout.questionX, layout.questionY + layout.questionH * 0.36); // 繪製目前題目
  fill("#8ea8c5"); // 設定操作提示文字顏色
  textStyle(NORMAL); // 設定提示文字一般字體
  textSize(constrain(width * 0.014, 12, 16)); // 設定提示文字大小
  text(feedbackText, layout.questionX, layout.questionY + layout.questionH * 0.82); // 繪製目前操作提示
  drawAnswerZone(); // 繪製上方答案放置區
} // 結束題目區函式

function drawAnswerZone() { // 繪製答案拖放區的函式
  const isTarget = isDragging && !hasSubmitted; // 判斷答案區是否應該高亮
  const answer = selectedAnswers[currentQuestion]; // 取得目前題目的答案
  let zoneColor = "#183653"; // 設定預設答案區顏色
  let borderColor = isTarget ? "#f5d06f" : "#47749d"; // 設定答案區外框顏色
  if (answerStates[currentQuestion] === "correct") { // 判斷目前答案是否正確
    zoneColor = "#174c48"; // 將正確答案區設為綠色
    borderColor = "#74e0c0"; // 將正確答案外框設為薄荷色
  } // 結束正確狀態判斷
  if (answerStates[currentQuestion] === "wrong") { // 判斷目前答案是否錯誤
    zoneColor = "#542f3b"; // 將錯誤答案區設為紅色
    borderColor = "#f28b8b"; // 將錯誤答案外框設為粉紅色
  } // 結束錯誤狀態判斷
  stroke(borderColor); // 設定答案區外框顏色
  strokeWeight(isTarget ? 4 : 2); // 拖曳時加粗答案區外框
  fill(zoneColor); // 設定答案區填色
  rect(layout.answerX, layout.answerY, layout.answerW, layout.answerH, 14); // 繪製答案區
  noStroke(); // 關閉後續文字外框
  fill(answer === "" ? "#9db8d1" : "#ffffff"); // 依答案狀態設定文字顏色
  textStyle(answer === "" ? NORMAL : BOLD); // 依答案狀態設定文字粗細
  textSize(constrain(width * 0.018, 14, 20)); // 設定答案文字大小
  text(answer === "" ? "請把選項拖到這裡" : `目前答案：${answer}`, layout.answerX + 18, layout.answerY + layout.answerH / 2); // 顯示答案或放置提示
} // 結束答案區函式

function drawChoiceCards() { // 繪製六個文字選項卡片的函式
  const choices = QUESTIONS[currentQuestion].choices; // 取得目前題目的六個選項
  for (let index = 0; index < choices.length; index += 1) { // 逐一繪製六個選項
    const column = index % 3; // 計算選項所在欄位
    const row = floor(index / 3); // 計算選項所在列位
    const cardX = layout.optionsX + column * (layout.cardW + layout.optionGap); // 計算選項卡片水平位置
    const cardY = layout.optionsY + row * (layout.cardH + layout.optionGap); // 計算選項卡片垂直位置
    const isBeingDragged = isDragging && draggedChoice === choices[index] && !draggedFromAnswer; // 判斷選項是否正在被拖曳
    const isCurrentAnswer = selectedAnswers[currentQuestion] === choices[index]; // 判斷選項是否為目前答案
    let cardFill = isCurrentAnswer ? "#285d66" : "#173957"; // 設定選項卡片底色
    if (isBeingDragged) { // 判斷是否為正在拖曳的卡片
      cardFill = "#6b5d2d"; // 將拖曳中的卡片改為醒目黃色
    } // 結束拖曳卡片判斷
    stroke(isCurrentAnswer ? "#74e0c0" : "#39698f"); // 設定選項卡片外框顏色
    strokeWeight(isCurrentAnswer ? 3 : 1.5); // 設定選項卡片外框粗細
    fill(cardFill); // 填入選項卡片顏色
    rect(cardX, cardY, layout.cardW, layout.cardH, 11); // 繪製選項卡片
    noStroke(); // 關閉文字外框
    fill("#f2f8ff"); // 設定選項文字顏色
    textStyle(BOLD); // 設定選項文字粗體
    textSize(constrain(width * 0.017, 14, 20)); // 設定選項文字大小
    textAlign(CENTER, CENTER); // 將選項文字置中
    text(choices[index], cardX + layout.cardW / 2, cardY + layout.cardH / 2); // 繪製選項文字
    textAlign(LEFT, CENTER); // 恢復一般文字對齊方式
  } // 結束六個選項迴圈
} // 結束選項卡片函式

function drawNavigation() { // 繪製題目導覽按鈕的函式
  const smallButtonW = constrain(width * 0.105, 82, 124); // 設定上一題與下一題按鈕寬度
  const buttonH = constrain(layout.navigationH * 0.7, 34, 48); // 設定導覽按鈕高度
  const numberGap = constrain(width * 0.008, 5, 10); // 設定題號按鈕間距
  const numberW = constrain((width - layout.margin * 2 - smallButtonW * 2 - numberGap * 8) / 6, 30, 52); // 設定題號按鈕寬度
  const totalW = smallButtonW * 2 + numberW * 6 + numberGap * 7; // 計算整個導覽列寬度
  const startX = (width - totalW) / 2; // 計算導覽列起始位置
  const buttonY = layout.navigationY + (layout.navigationH - buttonH) / 2; // 計算導覽按鈕垂直位置
  drawButton(startX, buttonY, smallButtonW, buttonH, "上一題", hasSubmitted || currentQuestion === 0, "#47749d"); // 繪製上一題按鈕
  for (let index = 0; index < QUESTION_COUNT; index += 1) { // 逐一繪製六個題號按鈕
    const numberX = startX + smallButtonW + numberGap + index * (numberW + numberGap); // 計算題號按鈕水平位置
    const isCurrent = index === currentQuestion; // 判斷是否為目前題號
    drawButton(numberX, buttonY, numberW, buttonH, String(index + 1), hasSubmitted, isCurrent ? "#74e0c0" : "#315879", isCurrent); // 繪製題號按鈕
  } // 結束題號按鈕迴圈
  const nextX = startX + smallButtonW + numberGap + 6 * (numberW + numberGap); // 計算下一題按鈕水平位置
  drawButton(nextX, buttonY, smallButtonW, buttonH, "下一題", hasSubmitted || currentQuestion === QUESTION_COUNT - 1, "#47749d"); // 繪製下一題按鈕
} // 結束導覽函式

function drawButton(x, y, buttonW, buttonH, label, disabled, color, active = false) { // 繪製通用按鈕的函式
  const buttonColor = disabled ? "#263b51" : color; // 依按鈕是否鎖定決定底色
  const labelColor = disabled ? "#71859a" : "#f6fbff"; // 依按鈕是否鎖定決定文字色
  stroke(disabled ? "#354a5f" : color); // 設定按鈕外框顏色
  strokeWeight(active ? 3 : 1.5); // 設定目前題號按鈕的外框粗細
  fill(buttonColor); // 填入按鈕底色
  rect(x, y, buttonW, buttonH, 10); // 繪製圓角按鈕
  noStroke(); // 關閉文字外框
  fill(labelColor); // 設定按鈕文字顏色
  textStyle(BOLD); // 設定按鈕文字粗體
  textSize(constrain(buttonW * 0.16, 12, 17)); // 設定按鈕文字大小
  textAlign(CENTER, CENTER); // 將按鈕文字置中
  text(label, x + buttonW / 2, y + buttonH / 2); // 繪製按鈕文字
  textAlign(LEFT, CENTER); // 恢復一般文字對齊方式
} // 結束通用按鈕函式

function drawDragPreview() { // 繪製拖曳中跟隨滑鼠卡片的函式
  if (!isDragging || draggedChoice === "") { // 判斷目前是否沒有拖曳項目
    return; // 沒有拖曳時直接結束函式
  } // 結束沒有拖曳判斷
  const previewW = min(layout.cardW, width * 0.5); // 設定拖曳預覽卡片寬度
  const previewH = layout.cardH; // 設定拖曳預覽卡片高度
  push(); // 保存拖曳預覽繪圖狀態
  translate(mouseX - previewW / 2, mouseY - previewH / 2); // 將預覽卡片移到滑鼠位置
  stroke("#f5d06f"); // 設定預覽卡片外框顏色
  strokeWeight(3); // 加粗預覽卡片外框
  fill("#7a6429"); // 設定預覽卡片底色
  rect(0, 0, previewW, previewH, 11); // 繪製拖曳預覽卡片
  noStroke(); // 關閉預覽文字外框
  fill("#ffffff"); // 設定預覽文字顏色
  textStyle(BOLD); // 設定預覽文字粗體
  textSize(constrain(width * 0.017, 14, 20)); // 設定預覽文字大小
  textAlign(CENTER, CENTER); // 將預覽文字置中
  text(draggedChoice, previewW / 2, previewH / 2); // 繪製跟隨滑鼠的選項文字
  pop(); // 還原拖曳預覽繪圖狀態
} // 結束拖曳預覽函式

function mousePressed() { // p5.js 滑鼠按下事件函式
  if (isInsideResetButton(mouseX, mouseY)) { // 判斷是否按下重新測驗按鈕
    initializeQuiz(); // 重新初始化整份測驗
    return false; // 阻止瀏覽器預設行為
  } // 結束重新測驗判斷
  if (isInsideSubmitButton(mouseX, mouseY) && !hasSubmitted) { // 判斷是否按下交卷按鈕
    submitQuiz(); // 執行交卷與計分
    return false; // 阻止瀏覽器預設行為
  } // 結束交卷判斷
  if (hasSubmitted) { // 判斷測驗是否已經交卷
    return false; // 交卷後鎖定所有答案與導覽
  } // 結束交卷鎖定判斷
  if (handleNavigationPress(mouseX, mouseY)) { // 判斷是否按下導覽按鈕
    return false; // 導覽按鈕已處理時阻止預設行為
  } // 結束導覽按鈕判斷
  const choiceIndex = getChoiceIndexAt(mouseX, mouseY); // 取得被按下的選項索引
  if (choiceIndex >= 0) { // 判斷是否按中了下方選項
    isDragging = true; // 開始拖曳狀態
    draggedChoice = QUESTIONS[currentQuestion].choices[choiceIndex]; // 設定正在拖曳的選項
    draggedFromAnswer = false; // 記錄拖曳來源為下方選項
    feedbackText = "拖曳中：請把卡片移到上方答案區。"; // 更新拖曳提示
    feedbackType = "normal"; // 設定一般提示樣式
    return false; // 阻止瀏覽器預設行為
  } // 結束選項按下判斷
  if (isInsideAnswerZone(mouseX, mouseY) && selectedAnswers[currentQuestion] !== "") { // 判斷是否按下已有答案的答案區
    isDragging = true; // 開始拖曳既有答案
    draggedChoice = selectedAnswers[currentQuestion]; // 將目前答案放入拖曳預覽
    draggedFromAnswer = true; // 記錄拖曳來源為答案區
    feedbackText = "可以更換答案，請拖到答案區確認。"; // 更新更換答案提示
    feedbackType = "normal"; // 設定一般提示樣式
    return false; // 阻止瀏覽器預設行為
  } // 結束答案區按下判斷
  return false; // 阻止滑鼠按下的瀏覽器預設行為
} // 結束滑鼠按下函式

function mouseDragged() { // p5.js 滑鼠拖曳事件函式
  if (isDragging && !hasSubmitted) { // 確認拖曳尚未被鎖定
    feedbackText = isInsideAnswerZone(mouseX, mouseY) ? "放開滑鼠即可放入答案區。" : "請繼續拖曳到上方答案區。"; // 依滑鼠位置更新拖曳提示
  } // 結束拖曳提示判斷
  return false; // 阻止瀏覽器拖曳預設行為
} // 結束滑鼠拖曳函式

function mouseReleased() { // p5.js 滑鼠放開事件函式
  if (!isDragging) { // 判斷目前是否沒有拖曳中的項目
    return false; // 沒有拖曳時直接結束函式
  } // 結束沒有拖曳判斷
  if (!hasSubmitted && isInsideAnswerZone(mouseX, mouseY)) { // 判斷是否在答案區放開選項
    selectedAnswers[currentQuestion] = draggedChoice; // 保留使用者放入的答案
    answerStates[currentQuestion] = draggedChoice === QUESTIONS[currentQuestion].correct ? "correct" : "wrong"; // 判斷答案正確或錯誤
    if (answerStates[currentQuestion] === "correct") { // 判斷是否答對
      feedbackText = "答對了！這個函式正是本題要找的答案。"; // 顯示成功提示
      feedbackType = "success"; // 設定成功提示樣式
    } else { // 處理答案錯誤狀況
      feedbackText = `目前答案不正確，請再試一次；提示：正確答案是 ${QUESTIONS[currentQuestion].correct}。`; // 顯示錯誤提示
      feedbackType = "error"; // 設定錯誤提示樣式
    } // 結束答案判斷
  } else { // 處理沒有放入答案區的狀況
    feedbackText = "尚未放入答案區，答案保持不變。"; // 顯示未放入提示
    feedbackType = "normal"; // 設定一般提示樣式
  } // 結束答案區放開判斷
  isDragging = false; // 結束拖曳狀態
  draggedChoice = ""; // 清除拖曳中的選項文字
  draggedFromAnswer = false; // 清除拖曳來源狀態
  return false; // 阻止瀏覽器放開滑鼠的預設行為
} // 結束滑鼠放開函式

function handleNavigationPress(x, y) { // 處理導覽按鈕點擊的函式
  const smallButtonW = constrain(width * 0.105, 82, 124); // 設定上一題與下一題按鈕寬度
  const buttonH = constrain(layout.navigationH * 0.7, 34, 48); // 設定導覽按鈕高度
  const numberGap = constrain(width * 0.008, 5, 10); // 設定題號按鈕間距
  const numberW = constrain((width - layout.margin * 2 - smallButtonW * 2 - numberGap * 8) / 6, 30, 52); // 設定題號按鈕寬度
  const totalW = smallButtonW * 2 + numberW * 6 + numberGap * 7; // 計算導覽列寬度
  const startX = (width - totalW) / 2; // 計算導覽列起始位置
  const buttonY = layout.navigationY + (layout.navigationH - buttonH) / 2; // 計算導覽列垂直位置
  if (isPointInside(x, y, startX, buttonY, smallButtonW, buttonH)) { // 判斷是否按下上一題
    if (currentQuestion > 0) { // 確認目前不是第一題
      currentQuestion -= 1; // 切換到上一題
      refreshQuestionFeedback(); // 更新切換後的提示
    } // 結束上一題切換
    return true; // 回傳已處理導覽按鈕
  } // 結束上一題按鈕判斷
  for (let index = 0; index < QUESTION_COUNT; index += 1) { // 逐一檢查六個題號按鈕
    const numberX = startX + smallButtonW + numberGap + index * (numberW + numberGap); // 計算題號按鈕水平位置
    if (isPointInside(x, y, numberX, buttonY, numberW, buttonH)) { // 判斷是否按下題號按鈕
      currentQuestion = index; // 切換到指定題目
      refreshQuestionFeedback(); // 更新切換後的提示
      return true; // 回傳已處理題號按鈕
    } // 結束題號按鈕判斷
  } // 結束題號按鈕迴圈
  const nextX = startX + smallButtonW + numberGap + 6 * (numberW + numberGap); // 計算下一題按鈕水平位置
  if (isPointInside(x, y, nextX, buttonY, smallButtonW, buttonH)) { // 判斷是否按下下一題
    if (currentQuestion < QUESTION_COUNT - 1) { // 確認目前不是最後一題
      currentQuestion += 1; // 切換到下一題
      refreshQuestionFeedback(); // 更新切換後的提示
    } // 結束下一題切換
    return true; // 回傳已處理下一題按鈕
  } // 結束下一題按鈕判斷
  return false; // 回傳沒有按下導覽按鈕
} // 結束導覽處理函式

function refreshQuestionFeedback() { // 更新切換題目後提示的函式
  const answer = selectedAnswers[currentQuestion]; // 取得切換後題目的答案
  if (answer === "") { // 判斷切換後題目是否尚未作答
    feedbackText = "請將下方選項拖曳到上方答案區。"; // 顯示未作答提示
    feedbackType = "normal"; // 設定一般提示樣式
    return; // 結束未作答提示流程
  } // 結束未作答判斷
  if (answerStates[currentQuestion] === "correct") { // 判斷切換後答案是否正確
    feedbackText = "答對了！可以繼續挑戰下一題。"; // 顯示答對提示
    feedbackType = "success"; // 設定成功提示樣式
  } else { // 處理切換後答案錯誤狀況
    feedbackText = `目前答案不正確，請再試一次；提示：正確答案是 ${QUESTIONS[currentQuestion].correct}。`; // 顯示錯誤提示
    feedbackType = "error"; // 設定錯誤提示樣式
  } // 結束切換後答案判斷
} // 結束提示更新函式

function submitQuiz() { // 執行交卷與計分的函式
  score = 0; // 交卷前先清除舊分數
  for (let index = 0; index < QUESTION_COUNT; index += 1) { // 逐題檢查答案
    if (selectedAnswers[index] === QUESTIONS[index].correct) { // 判斷目前題目是否答對
      score += 1; // 增加答對題數
      answerStates[index] = "correct"; // 將題目狀態標記為正確
    } else if (selectedAnswers[index] === "") { // 判斷目前題目是否未作答
      answerStates[index] = "empty"; // 將題目狀態標記為未作答
    } else { // 處理已作答但答案錯誤的情況
      answerStates[index] = "wrong"; // 將題目狀態標記為錯誤
    } // 結束單題計分判斷
  } // 結束逐題計分迴圈
  percentage = round(score / QUESTION_COUNT * 100); // 計算整份測驗百分比
  hasSubmitted = true; // 鎖定答案與導覽修改
  isDragging = false; // 清除拖曳狀態
  draggedChoice = ""; // 清除拖曳文字
  if (percentage > 60) { // 判斷成績是否嚴格高於百分之六十
    feedbackText = `恭喜完成測驗！答對 ${score} / ${QUESTION_COUNT} 題，成績 ${percentage}%，太棒了！`; // 設定高分結果提示
    feedbackType = "success"; // 設定高分提示樣式
    createConfetti(); // 建立彩帶粒子動畫
  } else { // 處理成績小於或等於百分之六十
    feedbackText = `測驗完成！答對 ${score} / ${QUESTION_COUNT} 題，成績 ${percentage}%。繼續練習，你會越來越好！`; // 設定鼓勵結果提示
    feedbackType = "normal"; // 設定鼓勵提示樣式
    confetti = []; // 確保低分不顯示彩帶
  } // 結束成績判斷
} // 結束交卷函式

function createConfetti() { // 建立彩帶粒子資料的函式
  confetti = []; // 清除舊彩帶資料
  for (let index = 0; index < 150; index += 1) { // 建立一百五十個彩帶粒子
    confetti.push({ // 將單一彩帶粒子加入陣列
      x: random(width), // 設定彩帶初始水平位置
      y: random(-height, 0), // 設定彩帶初始垂直位置
      speed: random(1.5, 4.5), // 設定彩帶下落速度
      size: random(5, 12), // 設定彩帶大小
      rotation: random(TWO_PI), // 設定彩帶初始旋轉角度
      spin: random(-0.08, 0.08), // 設定彩帶旋轉速度
      sway: random(0.01, 0.04), // 設定彩帶左右擺動速度
      color: random(["#74e0c0", "#f5b86b", "#f28b8b", "#8bb9f2", "#d5a7f5"]) // 設定彩帶顏色
    }); // 結束單一彩帶資料
  } // 結束彩帶建立迴圈
} // 結束彩帶建立函式

function updateAndDrawConfetti() { // 更新並繪製彩帶動畫的函式
  noStroke(); // 關閉彩帶外框
  for (const piece of confetti) { // 逐一更新所有彩帶粒子
    piece.y += piece.speed; // 讓彩帶向下移動
    piece.x += sin(frameCount * piece.sway + piece.rotation) * 0.8; // 讓彩帶左右擺動
    piece.rotation += piece.spin; // 更新彩帶旋轉角度
    if (piece.y > height + piece.size) { // 判斷彩帶是否落出畫面
      piece.y = random(-80, -10); // 將彩帶放回畫面上方
      piece.x = random(width); // 重新隨機彩帶水平位置
    } // 結束彩帶重置判斷
    push(); // 保存單一彩帶繪圖狀態
    translate(piece.x, piece.y); // 移動到彩帶所在位置
    rotate(piece.rotation); // 旋轉彩帶圖形
    fill(piece.color); // 填入彩帶顏色
    rect(0, 0, piece.size, piece.size * 0.55, 2); // 繪製彩帶粒子
    pop(); // 還原單一彩帶繪圖狀態
  } // 結束彩帶更新迴圈
} // 結束彩帶動畫函式

function getProgressText() { // 取得頁首作答進度文字的函式
  const answeredCount = selectedAnswers.filter((answer) => answer !== "").length; // 計算已作答題數
  if (!hasSubmitted) { // 判斷是否尚未交卷
    return `作答進度：${answeredCount} / ${QUESTION_COUNT} 題`; // 只顯示作答進度不顯示成績
  } // 結束未交卷判斷
  return `測驗已交卷｜答對 ${score} / ${QUESTION_COUNT} 題｜${percentage}%`; // 交卷後顯示完整成績
} // 結束進度文字函式

function getChoiceIndexAt(x, y) { // 取得滑鼠所在選項索引的函式
  for (let index = 0; index < QUESTIONS[currentQuestion].choices.length; index += 1) { // 逐一檢查六個選項
    const column = index % 3; // 計算選項所在欄位
    const row = floor(index / 3); // 計算選項所在列位
    const cardX = layout.optionsX + column * (layout.cardW + layout.optionGap); // 計算選項水平位置
    const cardY = layout.optionsY + row * (layout.cardH + layout.optionGap); // 計算選項垂直位置
    if (isPointInside(x, y, cardX, cardY, layout.cardW, layout.cardH)) { // 判斷滑鼠是否在選項卡片內
      return index; // 回傳被按下的選項索引
    } // 結束選項卡片判斷
  } // 結束選項檢查迴圈
  return -1; // 回傳沒有按中任何選項
} // 結束選項索引函式

function isInsideAnswerZone(x, y) { // 判斷座標是否位於答案區的函式
  return isPointInside(x, y, layout.answerX, layout.answerY, layout.answerW, layout.answerH); // 回傳答案區碰撞結果
} // 結束答案區判斷函式

function isInsideSubmitButton(x, y) { // 判斷座標是否位於交卷按鈕的函式
  const resetW = constrain(width * 0.12, 108, 148); // 設定重新測驗按鈕寬度
  const submitW = constrain(width * 0.14, 120, 170); // 設定交卷按鈕寬度
  const buttonH = constrain(layout.headerHeight * 0.52, 34, 46); // 設定頁首按鈕高度
  const resetX = width - layout.margin - resetW; // 設定重新測驗按鈕水平位置
  const submitX = resetX - 12 - submitW; // 設定交卷按鈕水平位置
  return isPointInside(x, y, submitX, (layout.headerHeight - buttonH) / 2, submitW, buttonH); // 回傳交卷按鈕碰撞結果
} // 結束交卷按鈕判斷函式

function isInsideResetButton(x, y) { // 判斷座標是否位於重新測驗按鈕的函式
  const resetW = constrain(width * 0.12, 108, 148); // 設定重新測驗按鈕寬度
  const buttonH = constrain(layout.headerHeight * 0.52, 34, 46); // 設定頁首按鈕高度
  const resetX = width - layout.margin - resetW; // 設定重新測驗按鈕水平位置
  return isPointInside(x, y, resetX, (layout.headerHeight - buttonH) / 2, resetW, buttonH); // 回傳重新測驗按鈕碰撞結果
} // 結束重新測驗按鈕判斷函式

function isPointInside(x, y, targetX, targetY, targetW, targetH) { // 判斷座標是否位於矩形內的函式
  return x >= targetX && x <= targetX + targetW && y >= targetY && y <= targetY + targetH; // 回傳矩形碰撞結果
} // 結束矩形碰撞函式
