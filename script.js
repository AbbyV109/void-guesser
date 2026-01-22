const braneContainer = document.getElementById('brane-container');
const guessInput = document.getElementById('brane-guess');
const submitButton = document.getElementById('submit-guess');
const dropdown = document.getElementById("dropdown");
const uiContainer = document.getElementById("ui-container")
const paletteButton = document.getElementById('palette-button');
const paletteDropdown = document.getElementById('palette-dropdown');
const modeButton = document.getElementById('mode-button');
const header = document.querySelector('header h1')
const copyButton = document.getElementById('copy-button');
const highscoreC = document.getElementById('highscore');
const shareContainer = document.getElementById('share-container');
const prefix = 'void_guesser_';
const amountBranes = 567
const braneIndexes = Array.from({ length: amountBranes }, (_, i) => i);;
const seed = new Date().getUTCFullYear() - 100;
const shuffledBranes = seededShuffle(braneIndexes, seed);
const palettes = {
    0: {0: [255,255,255], 1: [192, 192, 192], 2: [128, 128, 128], 3: [0, 0, 0]},
    1: {0: [255, 249, 244], 1: [248, 123, 87], 2: [194, 13, 13], 3: [20, 0, 0]},
    2: {0: [255, 241, 234], 1: [249, 160, 64], 2: [192, 90, 60], 3: [18, 15, 5]},
    3: {0: [255, 250, 250], 1: [234, 195, 0], 2: [186, 119, 154], 3: [15, 15, 0]},
    4: {0: [229, 249, 238], 1: [88, 221, 139], 2: [12, 112, 100], 3: [0, 20, 20]},
    5: {0: [238, 248, 253], 1: [100, 200, 250], 2: [7, 117, 147], 3: [21, 43, 48]},
    6: {0: [247, 247, 247], 1: [167, 153, 204], 2: [117, 70, 113], 3: [13, 0, 32]},
    7: {0: [250, 236, 248], 1: [187, 129, 200], 2: [101, 49, 160], 3: [5, 0, 30]},
    8: {0: [229, 229, 229], 1: [183, 183, 183], 2: [145, 145, 145], 3: [63, 63, 63]},
    
    9: {2: [0,0,0], 0: [192, 192, 192], 1: [128, 128, 128], 3: [0, 0, 0]},
    10: {2: [20, 0, 0], 0: [248, 123, 87], 1: [194, 13, 13], 3: [20, 0, 0]},
    11: {2: [18, 15, 5], 0: [249, 160, 64], 1: [192, 90, 60], 3: [18, 15, 5]},
    12: {2: [15, 15, 0], 0: [234, 195, 0], 1: [186, 119, 154], 3: [15, 15, 0]},
    13: {2: [0, 20, 20], 0: [88, 221, 139], 1: [12, 112, 100], 3: [0, 20, 20]},
    14: {2: [21, 43, 48], 0: [100, 200, 250], 1: [7, 117, 147], 3: [21, 43, 48]},
    15: {2: [13, 0, 32], 0: [167, 153, 204], 1: [117, 70, 113], 3: [13, 0, 32]},
    16: {2: [5, 0, 30], 0: [187, 129, 200], 1: [101, 49, 160], 3: [5, 0, 30]},
    17: {2: [63, 63, 63], 0: [183, 183, 183], 1: [145, 145, 145], 3: [63, 63, 63]},
};

const savedPalette = localStorage.getItem(prefix + 'savedPalette');
let palette = 0;
if (savedPalette !== null) {
    palette = parseInt(savedPalette);
    paletteButton.textContent = paletteDropdown.querySelector(`div[data-value="${palette}"]`).textContent;
}

const savedHighscore = localStorage.getItem(prefix + 'savedHighscore');
let highscore = 0;
if (savedHighscore !== null) {
    highscore = parseInt(savedHighscore);
}

const currentDay = getDay();
const savedDay = localStorage.getItem(prefix + 'lastDayPlayed');
if (savedDay !== null && parseInt(savedDay) !== currentDay) {
    localStorage.removeItem(prefix + 'savedVictoryCounted');
    for (let i=0;i<=5;i++) {
        localStorage.removeItem(prefix + `savedGuess${i}`);
    }
}
localStorage.setItem(prefix + 'lastDayPlayed', currentDay);

const savedVictoryCounted = localStorage.getItem(prefix + 'savedVictoryCounted');
let victoryCounted = false;
if (savedVictoryCounted === 'true') {
    victoryCounted = true;
}

const savedGuesses = ["","","","","",""];
for (let i=0;i<=5;i++){
    savedGuesses[i] = String(localStorage.getItem(prefix + `savedGuess${i}`));
}
let stats = JSON.parse(localStorage.getItem(prefix + 'savedStats')) || [0, 0, 0, 0, 0, 0];
let gamesPlayed = parseInt(localStorage.getItem(prefix + 'gamesPlayed')) || 0;
let numGuesses;
let stage;
let roundCompleted;
let roundWon;
let score;
let branes = [];
let possible_guesses = [];
let solution_display = ["","","",""];
let index;
let solution;
let center;
let mode = 0;
let tiles;
let modalExists = false;
let selectedIndex = -1;
let discardPile = [-1,256,"",""];
let newHighscore = false;

function mulberry32(seed) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function seededShuffle(array, seed) {
    // Seeded shuffle for the indexes of the branes
    const rng = mulberry32(seed);
    const result = array.slice();

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function getDailyBraneIndex() {
    // Gets the index of the brane, goes in order
    const day = getDay();
    return shuffledBranes[Math.max(0,day) % shuffledBranes.length];
}

function getDay(){
    const start = Date.UTC(2026, 0, 22, 5, 0, 0);
    const now = Date.now();
    return Math.floor((now - start) / 86400000);
}

async function loadBranes() {
    const text = await fetch('./branes.txt').then(r => r.text());
    branes = text.trim().replaceAll("\r","").split("\n");
    possible_guesses = branes.map(t => t.split(",")[0])
}

async function getBrane(index) {
    // Returns the selected brane in the format "brane number,tiles"
    if (branes.length === 0){
        await loadBranes();
    }
    return branes[index].split(",");
}

function getValidPositions(){
    let res = [112,113,114,115,116,117,118,119,120,121,122,123,124,125];
    let c = center;
    let row;
    let column;
    if (c<=11) c+=15;
    else if (c<=23) c+=17;
    else if (c<=35) c+=19;
    else if (c<=47) c+=21;
    else if (c<=59) c+=23;
    else if (c<=71) c+=25;
    let n;
    if (stage === 5) n=1;
    else if (stage === 4) n=2;
    else if (stage === 3) n=4;
    else if (stage === 2) n=6;
    else if (stage <= 1) n=13;
    for (let i = -n; i <= n; i++) {
        for (let j = -n; j <= n; j++) {
            row = Math.floor((c+(14*i)) / 14);
            column = c % 14 + j;
            if (row>=0 && row <=7 && column>=0 && column<=13){
                res.push(c+(14*i)+j)
            }
        }
    }
    return res;
}

async function renderBrane() {
    tiles[tiles.length - 12] = 'num'+stage;                                 // Change locust count
    if (roundCompleted){                                                    // Display solution
        tiles[tiles.length-1] = solution_display[3];
        tiles[tiles.length-2] = solution_display[2];
        tiles[tiles.length-3] = solution_display[1];
        tiles[tiles.length-4] = solution_display[0];
    }
    while (braneContainer.firstChild) braneContainer.removeChild(braneContainer.firstChild);
    let slot;
    let entity = false;
    let valid_positions = getValidPositions();
    let i = 0;

    for (const tile of tiles){
        let isEntity = tile.length >= 3 && !["w","e","x"].includes(tile[0]);
        if(valid_positions.includes(i) || roundCompleted){
            const img = document.createElement('img');
            img.src = tintedCache[tile];
            if (entity){                                                    // If last tile was an entity
                slot.appendChild(img);
                braneContainer.appendChild(slot);
                entity = false;
                i++;
            }
            else if (isEntity){                                             // If current tile is an entity
                slot = document.createElement('div');
                slot.className = 'tile-slot';
                img.className = 'sprite-layer';
                slot.appendChild(img);
                entity = true;
            }
            else {                                                          // If not an entity
                braneContainer.appendChild(img);
                i++;
            }
        } else {                                                            // If not discovered
            if (!isEntity) {
                const img = document.createElement('img');
                img.src = tintedCache["em"];
                braneContainer.appendChild(img);
                i++;
            }
        }
    }
}


const tintedCache = {};

async function preloadTiles(tiles) {   
    let tmpTiles = [...tiles];
    tmpTiles.push("em","num0","num1","num2","num3","num4","num5","wnum0","0up","0down","0yes","0no","0question","modalquestion","modaleepy","modalyay","modalouch");
    tmpTiles.push(...solution_display)
    const uniqueTiles = [...new Set(tmpTiles)]
    for (let tile of uniqueTiles) {
        if (palette===0) {
            tintedCache[tile] = tileMap[tile]
        } else {
            let tempImg = new Image();
            tempImg.src = tileMap[tile];
            await new Promise(resolve => tempImg.onload = resolve);
            tintedCache[tile] = tintImage(tempImg, tile);
            tempImg.src = "";
            tempImg = null;
        }
    }
    document.querySelectorAll('.header-icon').forEach(img => {              // Update images in modals
        const tile = img.dataset.tile;
        if (tile && tintedCache[tile]) {
            img.src = tintedCache[tile];
        }
    });
}


const processingCanvas = document.createElement('canvas');
const processingCtx = processingCanvas.getContext('2d', { willReadFrequently: true });

function tintImage(img, tile) {
    let w = img.width;
    let h =  img.height;
    processingCanvas.width = w;
    processingCanvas.height = h;
    processingCtx.drawImage(img, 0, 0);

    const imageData = processingCtx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const currentPalette = palettes[palette];
    if (tile.includes("modal") && modalExists) return;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        let shade;
        if (r > 224) shade = currentPalette[0];
        else if (r > 160) shade = currentPalette[1];
        else if (r > 96) shade = currentPalette[2];
        else shade = currentPalette[3];

        data[i] = shade[0];
        data[i + 1] = shade[1];
        data[i + 2] = shade[2];
    }

    processingCtx.putImageData(imageData, 0, 0);
    return processingCanvas.toDataURL('image/png');
}


// Event listeners
submitButton.addEventListener('click', () => checkGuess());
guessInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') checkGuess();
});

guessInput.addEventListener("input", () => {
    selectedIndex = -1;
    let guess = guessInput.value.toLowerCase();
    let matches = [];
    dropdown.scrollTop = 0;
    dropdown.innerHTML = "";

    if (!guess) {
        dropdown.style.display = "none";
        return;
    }

    if (guess == "e"){
        matches = possible_guesses.filter(g => g.toLowerCase()[0].includes(guess));
    } else if (guess.includes("l") && !guess.includes("le")) {
        matches = possible_guesses.filter(g => (g.toLowerCase().includes(guess.replaceAll('l', '')) && g.toLowerCase().includes("lillie")));
    } else {
        matches = possible_guesses.filter(g => g.toLowerCase().includes(guess));
    }
    matches = matches.filter(m => checkDiscard(m.toLowerCase()));

    if (!matches.length) {
        dropdown.style.display = "none";
        return;
    }

    for (const match of matches) {
        const div = document.createElement("div");
        div.textContent = match;
        dropdown.appendChild(div);
    }

    const rect = guessInput.getBoundingClientRect();
    dropdown.style.width = rect.width + "px";
    dropdown.style.top = rect.bottom + window.scrollY + "px";
    dropdown.style.left = rect.left + window.scrollX + "px";
    dropdown.style.display = "block";
});

dropdown.addEventListener("click", (e) => {
    if (e.target.tagName === 'DIV') {
        guessInput.value = e.target.textContent;
        closeDropdown();
        guessInput.focus();
    }
});

guessInput.addEventListener("keydown", e => {
    const items = dropdown.querySelectorAll("div");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
        selectedIndex = (selectedIndex + 1) % items.length;
        updateHighlight(items);
        e.preventDefault();
    } else if (e.key === "ArrowUp") {
        if (selectedIndex===-1){
            selectedIndex = items.length - 1;
        } else {
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        }
        updateHighlight(items);
        e.preventDefault();
    } else if (e.key === "Enter") {
        if (selectedIndex >= 0) {
            guessInput.value = items[selectedIndex].textContent;
            dropdown.style.display = "none";
            selectedIndex = -1;
            e.preventDefault();
        }
    }
});

guessInput.addEventListener('click', () => {
    if (guessInput.value.length > 0) guessInput.dispatchEvent(new Event('input'));
});

function updateHighlight(items) {
    items.forEach((item, i) => {
        item.classList.toggle("highlight", i === selectedIndex);
        if (i === selectedIndex) item.scrollIntoView({ block: "nearest" });
    });
}

function updateCSS() {
    for (let i=0 ; i<4 ; i++) {
        const [r, g, b] = palettes[palette][i];
        document.documentElement.style.setProperty(["--shade1","--shade2","--shade3","--shade4"][i], `rgb(${r}, ${g}, ${b})`);
    }
    if (modalExists){
        [r, g, b] = palettes[palette-9][0]
        document.documentElement.style.setProperty("--shade0", `rgb(${r}, ${g}, ${b})`);
    };
}

paletteButton.addEventListener('click', () => {
    paletteDropdown.style.display = paletteDropdown.style.display === 'block' ? 'none' : 'block';
});

paletteDropdown.querySelectorAll('div').forEach(option => {
    option.addEventListener('click', async () => {        
        paletteButton.textContent = option.textContent;
        paletteDropdown.style.display = 'none';
        
        let newPalette = parseInt(option.getAttribute('data-value'), 10);
        if (newPalette!==palette) {
            palette = newPalette;
            localStorage.setItem(prefix + 'savedPalette', palette);
            await changePalette();
        }
    });
});

async function changePalette(){    
    for (let key in tintedCache) delete tintedCache[key];
    await preloadTiles(tiles);
    updateCSS();
    renderBrane();

    document.querySelectorAll('.guess-feedback').forEach(slot => {
        const img = slot.querySelector('img');
        const tile = slot.dataset.tile;
    
        if (img && tile) {
            img.src = tintedCache[tile];
        }
    });
}

window.addEventListener('click', (e) => {
    if (!paletteButton.contains(e.target)) {
        paletteDropdown.style.display = 'none';
    }
    if (!dropdown.contains(e.target) && !guessInput.contains(e.target)) closeDropdown();
    if (e.target.classList.contains('modal')) {
        modalExists = false;
        palette -= 9;
        e.target.style.display = 'none';
        changePalette();
    }
});

modeButton.addEventListener('click', () => {
    mode = (mode + 1) % 2
    if (!mode) {
        startDaily();
        modeButton.textContent = "Endless Mode";
        header.textContent = "Void Guesser";
    }else {
        score = 0;
        startEndless();
        modeButton.textContent = "Daily Mode";
        header.textContent = "Endless Guesser";
    }
});

document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', async () => {
        const modalId = trigger.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        if (modal){
            palette += 9;
            modalExists = true;
            await changePalette();
            modal.style.display = 'flex';
        }
        const text = document.getElementById('p-stats');
        text.textContent = "Statistics";
    });
});

document.querySelectorAll('.close-button').forEach(button => {
    button.addEventListener('click', () => {
        palette -= 9;
        modalExists = false;
        button.closest('.modal').style.display = 'none';
        changePalette();
    });
});


function closeDropdown(){
    dropdown.scrollTop = 0;
    dropdown.style.display = "none";
    while (dropdown.firstChild) dropdown.removeChild(dropdown.firstChild);
    selectedIndex = -1;
}

function checkDiscard(match){
    let res = true;
    let number = parseInt(match.slice(1,4), 10);
    let initial = match[0];
    if (match.includes("chamber") || match.includes("shortcut")) initial = "h";
    if ((!isNaN(number) && (number <= discardPile[0] || number >= discardPile[1])) || discardPile[2].includes(initial)){
        res = false;
    }
    if (discardPile[3]!=="" && discardPile[3]!==initial) {
        res = false;
    }
    return res;
}

// Game logic
updateCSS();
startDaily();
updateStats();

function startDaily(){
    dayChangeCheck();
    for (let i=0;i<=5;i++){
        savedGuesses[i] = String(localStorage.getItem(prefix + `savedGuess${i}`));
    }
    let tmpVictoryCounted = localStorage.getItem(prefix + 'savedVictoryCounted');
    victoryCounted = false;
    if (tmpVictoryCounted === 'true') {
        victoryCounted = true;
    }
    mode = 0;
    index = getDailyBraneIndex();
    const rng = mulberry32(index);
    center = Math.floor(rng() * 72);
    highscoreC.textContent = "";
    shareContainer.style.display = "flex";
    startRound();
}

function dayChangeCheck(){
    let res = false;
    let day = getDay();
    let lastDay = localStorage.getItem(prefix + 'lastDayPlayed');
    if (lastDay !== null && parseInt(lastDay) !== day) {
        localStorage.removeItem(prefix + 'savedVictoryCounted');
        for (let i=0;i<=5;i++) {
            localStorage.removeItem(prefix + `savedGuess${i}`);
        }
        res = true;
        copyButton.disabled = true;
    }
    localStorage.setItem(prefix + 'lastDayPlayed', day);
    return res;
}

function startEndless(){
    mode = 1;
    index = Math.floor(Math.random() * amountBranes)
    center = Math.floor(Math.random() * 72);
    highscoreC.textContent = "Highscore: " + highscore + " | Current: " + score;
    copyButton.disabled = true;
    shareContainer.style.display = "none";
    startRound();
}

async function startRound(){
    discardPile = [-1,256,"",""];
    numGuesses = -1;
    for (let i = 0; i <= 5; i++) {
        const feedbackSlot = document.getElementById(`feedback-${i}`);
        if (feedbackSlot) {
            feedbackSlot.innerHTML = '';
            delete feedbackSlot.dataset.tile;
        }
        const valSlot = feedbackSlot ? feedbackSlot.previousElementSibling : null;
        if (valSlot) {
            valSlot.textContent = '';
        }
    }

    const rows = document.querySelectorAll('#guide-container p');
    rows.forEach(row => {
        row.classList.remove('discarded');
    });

    submitButton.textContent="Guess";
    let brane = await getBrane(index);
    guessInput.disabled = false;
    roundCompleted = false;
    roundWon = false;
    solution = brane[0];
    let sequence = [1,0,3,2]
    if (solution.includes("h")){
        solution_display[0] = "que";
        solution_display[1] = "wb";
        solution_display[2] = "que";
        solution_display[3] = "wque";
    } else {
        for (let i=0; i<4; i++){
            let start = "";
            if (i%2!==0) start = "w";
            if (i===1) solution_display[i] = "w" + solution[sequence[i]].toLowerCase();
            else if (solution[sequence[i]] === "?") solution_display[i] = start + "que";
            else solution_display[i] = start + "num" + solution[sequence[i]];
        }
    }  
    tiles = (brane[1] + ";w;hp;num7;wnum0;w;lo;num5;wnum0;vr;w;w;w;w;w;que;wb;que;wque").split(";");
    await preloadTiles(tiles);
    stage = 5;
    if (!mode) {
        for (let i=stage; i>=0; i--){
            checkGuess(savedGuesses[i]);
        }
    }
    renderBrane();
}

function checkGuess(input) {
    if (!mode && dayChangeCheck()) {
        startDaily();
        return;
    }
    if (submitButton.textContent==="Next" || submitButton.textContent==="Reset"){
        startEndless();
        return;
    }
    if (roundCompleted) return;
    if (typeof input !== 'string') guessInput.focus();
    let completed = false;
    let guess = (typeof input === 'string') ? input : guessInput.value;
    let guess_lower =  guess.toLowerCase();
    if (!possible_guesses.map(g => g.toLowerCase()).includes(guess_lower)) return;
    guessInput.value = "";
    if (guess_lower.length !== 0){
        if (!mode) localStorage.setItem(prefix + `savedGuess${stage}`, guess);
    
        const guessNum = parseInt(guess_lower.slice(1,4), 10);
        const solutionNum = parseInt(solution.slice(1,4), 10);
        const solution_lower = solution.toLowerCase();

        const correct = (solution_lower.trim()===guess_lower.trim()) || (solution_lower.includes("tree") && guess_lower.includes("tree"))
        || (solution_lower==="b057" && guess_lower==="b225 (voided)") || (solution_lower==="b225 (voided)" && guess_lower==="b057");

        let tmpSolution = solution_lower;
        let tmpGuess = guess_lower;
        if (solution_lower.includes("chamber") || solution_lower.includes("shortcut")) tmpSolution = "h" + solution_lower;
        if (guess_lower.includes("chamber") || guess_lower.includes("shortcut")) tmpGuess = "h" + guess_lower;

        let feedback = "";
        if (correct){
            completed = true;
            roundWon = true;
            feedback = "0yes";
        }
        else if (!(tmpSolution[0]===tmpGuess[0])) {
            feedback = "0no";
            discardPile[2] += tmpGuess[0];
        }
        else if (guessNum < solutionNum) {
            feedback = "0up";
            discardPile[0] = guessNum;
            discardPile[3] = tmpGuess[0];
        }
        else if (guessNum > solutionNum) {
            feedback = "0down";
            discardPile[1] = guessNum;
            discardPile[3] = tmpGuess[0];
        }
        else feedback = "0question";
    
        const feedbackSlot = document.getElementById(`feedback-${stage}`);
        const valSlot = feedbackSlot.previousElementSibling;
        valSlot.textContent = guess;

        feedbackSlot.innerHTML = '';
        const img = document.createElement('img');
        img.src = tintedCache[feedback];
        img.className = "feedback-img";
    
        feedbackSlot.dataset.tile = feedback;
        feedbackSlot.appendChild(img);
        
        numGuesses += 1;
        stage -= 1;
        if (stage<0){
            completed = true;
            stage=0;
        }
        renderBrane();
        updateGuide();

        if (completed){
            completeRound();
        }
    }
}

function updateGuide(){
    let index_rows = [];
    let helper = [1,2,3,4,5,6,7,8,9,13,10,11,12];
    let low;
    let high;
    if (discardPile[3]==="e"){
        index_rows.push(1,2,3,4,5,6,7,8,9);
        helper = [13,10,11,12]
        low = Math.floor((discardPile[0] - 1 + 15) / 15);
        high = Math.floor((discardPile[1] - 3 + 15) / 15);
        if (low === 0) low = 1;
        if (high === 17) high = 4;
        high = Math.min(high, 4)
        index_rows.push(...helper.slice(0, low-1), ...helper.slice(high));
    }
    else if (discardPile[3]==="b"){
        index_rows.push(13,10,11,12);
        helper = [1,2,3,4,5,6,7,8,9];
        low = Math.floor((discardPile[0] + 28) / 28);
        high = Math.floor((discardPile[1] - 2 + 28) / 28);
        if (low === 0) low = 1;
        if (high === 9) high = 9;
        high = Math.min(high, 9)
        index_rows.push(...helper.slice(0, low-1), ...helper.slice(high));

    }
    else if (discardPile[3]==="h") index_rows = [...helper];
    if (discardPile[2].includes("e")) index_rows.push(13,10,11,12);
    if (discardPile[2].includes("b")) index_rows.push(1,2,3,4,5,6,7,8,9);

    let uniqueIndices = [...new Set(index_rows)];
    for (let i of uniqueIndices){
        const row = document.querySelector(`#guide-container p:nth-child(${i})`);
        if (row) {
            row.classList.add('discarded');
        }
    }
}


async function completeRound(){
    roundCompleted = true;
    renderBrane();
    guessInput.disabled = true
    if (!mode) {
        if (!victoryCounted) {
            gamesPlayed++;
            localStorage.setItem(prefix + 'gamesPlayed', gamesPlayed);
            if (roundWon) {
                stats[numGuesses] += 1;
                localStorage.setItem(prefix + 'savedStats', JSON.stringify(stats));
            }
            victoryCounted = true;
            localStorage.setItem(prefix + 'savedVictoryCounted', victoryCounted);
            await new Promise(resolve => setTimeout(resolve, 300));
            const modal = document.getElementById('stats-modal');
            const text = document.getElementById('p-stats');
            if (roundWon) text.textContent = "Well done!";
            else{
                const imgs = document.querySelectorAll(".result");
                imgs.forEach(img => {
                    img.src = tintedCache['modalouch'];
                })
                text.textContent = "Next time for sure...";
            } 
            if (modal){
                palette += 9;
                modalExists = true;
                await changePalette();
                modal.style.display = 'flex';
            }
        }
        copyButton.disabled = false;
        updateStats(numGuesses);
    }
    if (mode) {
        if (roundWon) {
            score += 1;
            if (highscore < score){
                highscore = score;
                localStorage.setItem(prefix + 'savedHighscore', highscore);
                newHighscore = true;
            }
            highscoreC.textContent = "Highscore: " + highscore + " | Current: " + score;
            submitButton.textContent = "Next"
        } else {
            if (newHighscore) {
                await new Promise(resolve => setTimeout(resolve, 100));
                const modal = document.getElementById('highscore-modal');
                if (modal){
                    palette += 9;
                    modalExists = true;
                    await changePalette();
                    modal.style.display = 'flex';
                }
            }
            newHighscore = false;
            score = 0;
            submitButton.textContent = "Reset"
        }
    }
}


function updateStats(latestGuessCount) {
    let winRate = 0;
    if (gamesPlayed !== 0) {
        const totalWins = stats.reduce((a, b) => a + b, 0);
        winRate = Math.round((totalWins / gamesPlayed) * 100);
    }
    document.getElementById('stat-played').textContent = gamesPlayed;
    document.getElementById('stat-winrate').textContent = winRate;

    const rows = document.querySelectorAll('.dist-row');
    const maxWins = Math.max(...stats);

    rows.forEach((row, index) => {
        const count = stats[index];
        const bar = row.querySelector('.dist-bar');
        
        const percentage = maxWins > 0 ? (count / maxWins) * 100 : 0;
        
        bar.style.width = `${Math.max(percentage, 1)}%`;
        bar.textContent = count;

        if (index === latestGuessCount && roundWon) {
            row.classList.add('current-guess');
        } else {
            row.classList.remove('current-guess');
        }
    });
}


function copyResults() {
    const urlActive = document.getElementById('include-url').checked;
    let day = getDay() + 1;
    const guessesUsed = roundWon ? String(numGuesses+1) : "X";
    
    let emojis = "";
    for (let i = 5; i >= 0; i--) {
        const slot = document.getElementById(`feedback-${i}`);
        const tile = slot ? slot.dataset.tile : null;

        if (tile) {
            if (tile === "0yes") emojis += "🟩";
            else if (tile === "0up") emojis += "⬆️";
            else if (tile === "0down") emojis += "⬇️";
            else if (tile === "0no") emojis += "🟥";
            else emojis += "❓";
        }
    }
    const url = urlActive ? "https://abbyv109.github.io/void-guesser/" : "Void Guesser";
    const textToCopy = `${url} | Day ${day} in ${guessesUsed}/6\n${emojis}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = document.getElementById('copy-button');
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = "Copy today's results", 2000);
    });

}
