/**
 * Build a word search puzzle from a newline-separated wordlist.
 */

const WORD_LIST_URL = "https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json" as string;
const WORDS_PER_PUZZLE = 5 as number;
const DIRECTIONS = {
    N:  [0, -1],
    NE: [1, -1],
    E:  [1, 0],
    SE: [1, 1],
    S:  [0, 1],
    SW: [-1, 1],
    W:  [-1, 0],
    NW: [-1, -1]
} as object;
const ALLOWED_SLOPES = [-Infinity, -1, 0, 1, Infinity]

let hiddenWords: string[] = [];
let foundWords: string[] = [];
let wsData: object = {};
let wsWordLookup: object = {};


/**
 * Return `n` random choices from an array of `values`.
 * 
 * @param values - An array.
 * @param n - Number of random choices to return.
 * @param replace - If false, each value can only be chosen once.
 * @returns - Array of values (subset of original).
 */
function getRandomChoices(values: any[], n=null, replace=false): any[] {
    let choices: any[] = [];
    let ix: number = null;
    let unusedValues: any[] =  values.slice();  // Copy of original

    if (n == null) {
        n = values.length;
    }

    while (choices.length < n) {
        ix = Math.floor(Math.random() * unusedValues.length);
        if (!replace) {
            unusedValues.splice(ix, 1);  // Pop off the index we used
        }
        choices.push(values[ix]);
    }

    return choices;
}


/**
 * Given an array of words, generate a matrix of letters containing those words.
 * 
 * @param words - Array of words.
 * @param directions - Object that maps compass bearings to [dx, dy] values, e.g.: {N: [0, -1]}.
 * @param pad - Number of additional rows and columns to add (to avoid running out of space).
 * @returns - An array of array of single-character strings.
 */
function getLetterMatrix(words: string[], directions=DIRECTIONS, pad=0): string[][] {
    const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("") as string[];
    let m: number = Math.max(...words.map(word => word.length));
    let n: number = m;
    let matrix: string[][] = []
    let row: string[] = [];
    let allowedSlots: object[] = [];
    let slots: object[] = [];
    let slot: object = {};
    let slotLetters: string[] = [];
    let direction: string = null;
    let dx: number = null;
    let dy: number = null;
    let i: number = 0;
    let j: number = 0;
    let l: number = 0;
    let wordFits: boolean = false;

    // Allocate longer words first
    words = words.sort((a, b) => b.length - a.length);
    words = words.map(word => word.toUpperCase());
    // console.log("words: " + words);  // TODO: Delete me

    // Build empty matrix
    for (i = 0; i < m; ++i) {
        row = [];
        for (j = 0; j < n; ++j) {
            row.push(" ");
        }
        matrix.push(row);
    }

    // Enumerate all possible slots so we can ignore any that are too short
    for (i = 0; i < m; ++i) {
        for (j = 0; j < n; ++j) {
            for (direction in directions) {
                [dx, dy] = directions[direction]
                slotLetters = getSlotValues(matrix, i, j, dx, dy);
                slot = {i: i, j: j, dx: dx, dy: dy, length: slotLetters.length}
                slots.push(slot);
            }
        }
    }

    for (let word of words) {
        allowedSlots = slots.filter(slot => slot["length"] >= word.length);

        // Keep randomness; weight diagonal slots to correct for reduced chance of fit
        allowedSlots = getRandomChoices(allowedSlots);  // Shuffle
        allowedSlots = allowedSlots.sort((a, b) => slotCompare(a, b)); 

        for (let slot of allowedSlots) {
            i = slot["i"];  // These values used to write word to matrix
            j = slot["j"];
            dx = slot["dx"];
            dy = slot["dy"];

            slotLetters = getSlotValues(matrix, i, j, dx, dy, word.length);            
            wordFits = wordFitsSlot(word, slotLetters);

            if (wordFits) {
                for (l = 0; l < word.length; ++l) {
                    matrix[i][j] = word[l];
                    i += dy;
                    j += dx;
                }
                break;  // Move on to next word
            }
        }

        if (wordFits == false) {               
            console.log("Couldn't fit word: '" + word + "' into matrix.");
        }
    }

    // Fill in blanks with random letters
    for (i = 0; i < m; ++i) {
        row = matrix[i];
        for (j = 0; j < n; ++j) {
            if (row[j] == " ") {
                matrix[i][j] = getRandomChoices(allLetters, 1)[0]
            }
        }
    }

    return matrix;
}


/**
 * Check if slot is full of blanks (or has letters that fit into target word).
 * 
 * @param word - A string
 * @param slotLetters - An array of single-character strings.
 * @returns - True or false
 */
function wordFitsSlot(word: string, slotLetters: string[]): boolean {
    let l: number = 0;

    for (l = 0; l < word.length; ++l) {
        if ( (slotLetters[l] != " ") && (slotLetters[l] != word[l]) ) {
            return false;
        }
    }
    return true;
}


/**
 * Check if slot's slope (dy / dx) is 1 or -1.
 * 
 * @param slot - An object with dx and dy attributes
 * @returns - True or false.
 */
function isDiagonal(slot: object): boolean {
    return Math.abs(slot["dy"] / slot["dx"]) == 1;
}


/**
 * Function used to sort slots randomly, but with enough of a preference
 * for diagonal slots to offset the likelihood of them being discarded 
 * due to overlap with existing words.
 * 
 * @param a: An object with dx and dy attributes
 * @param b: An object with dx and dy attributes
 * @returns - A number between -0.5 and 1.5
 */
function slotCompare(a: object, b: object): number {
    const aIsDiagonal: boolean = isDiagonal(a);
    const bIsDiagonal: boolean = isDiagonal(b);

    if (aIsDiagonal) {
        return Math.random() - 0.5;
    } else if (bIsDiagonal) {
        return Math.random() + 0.5;
    } else {
        return Math.random();
    }
}


/**
 * Get array of matrix values that start in position `[i, j]` 
 * and continue in some direction (e.g: 'NE').
 * 
 * @param matrix - Array of arrays. 
 * @param i - Row index.
 * @param j - Column index.
 * @param dx - Step to take in x-direction.
 * @param dy - Step to take in y-direction
 * @param maxLength - How many entries to expect in the slot.
 */
function getSlotValues(
    matrix: string[][], i: number, j: number, dx: number, dy: number, maxLength=-1
): string[] {
    let values: string[] = [];

    while (isValidIndex(matrix, i, j)) {
        if (values.length == maxLength) {
            break;
        }
        values.push(matrix[i][j]);
        i += dy;
        j += dx;
    }

    return values;
}

/**
 * Return true if `i` and `j` are indexes inside `matrix`.
 * 
 * @param matrix - Array of arrays. 
 * @param i - Row index.
 * @param j - Column index.
 * @returns - True or false.
 */
function isValidIndex(matrix: any[][], i: number, j: number): boolean {
    let m: number = matrix.length;
    let n: number = matrix[0].length;

    // (row index is inside matrix) && (column index is inside matrix)
    return ((0 <= i) && (i < m) && (0 <= j) && (j < n))
}


/**
 * Render a matrix of letters as DOM elements.
 * 
 * @param matrix - Array of arrays of letters.
 * @returns - void
 */
function renderLetterMatrix(matrix: string[][]): void {
    const matrixContainer = document.getElementById("ws-matrix") as HTMLElement;
    let rowContainer: HTMLDivElement = null;
    let cellContainer: HTMLSpanElement = null;
    let i: number = 0;
    let j: number = 0;
    let row: string[] = null;

    matrixContainer.innerHTML = "";

    for (i = 0; i < matrix.length; ++i) {
        row = matrix[i];
        rowContainer = document.createElement("div");
        rowContainer.className = "ws-row"; 
        for (j = 0; j < row.length; ++j) {
            cellContainer = document.createElement("div");
            cellContainer.className = "ws-cell";
            cellContainer.setAttribute("data-i", i.toString());
            cellContainer.setAttribute("data-j", j.toString());
            cellContainer.textContent = row[j];
            rowContainer.appendChild(cellContainer);
        }
        matrixContainer.appendChild(rowContainer);
    }
}


/**
 * When a highlightable element is clicked, remove highlights from other elements
 *  and highlight the target. 
 * 
 * @param event - A click or touch event targeting an HTML element
 * @returns - void
 */
function clearHighlights(event: any): void {
    const elements = {...document.getElementsByClassName("highlight")} as object;

    for (let key in elements) {
        elements[key].classList.remove("highlight");
    }
}


/**
 * Start highlighting on mouse down.
 * 
 * @param event - A click or touch event targeting an HTML element
 * @returns - void
 */
function startDrag(event: any): void {
    let elem: HTMLElement = event.target;
    let i: number = null;
    let j: number = null;

    clearHighlights(event)

    if (elem.classList.contains("ws-cell")) {
        i = Number(elem.dataset.i);
        j = Number(elem.dataset.j)
        wsData = {
            indexes: [[i, j]],
            letters: [event.target.textContent],
            slope: null,
        }
        document.onmousemove = handleDrag;
        document.onmouseup = stopDrag;
        
        event.target.classList.add("highlight");
    }
}


/**
 * When user drags over an element, decide whether to highlight it.
 * Hint: This is not a pure function -- it gets and mutates localStorage["wsData"]
 * 
 * @param event - A click or touch event targeting an HTML element
 * @returns - void
 */
function handleDrag(event: any): void {
    let i: number = null;
    let j: number = null;
    let iPrev: number = null;
    let jPrev: number = null;
    let iStep: number = 0;
    let jStep: number = 0;
    let dy: number = null;
    let dx: number = null;
    let slope: number = null;
    let step: number = 0;
    let distance: number = 0;
    let isCell = event.target.classList.contains("ws-cell");
    let isHighlighted = event.target.classList.contains("highlight");
    let cellContainer: HTMLElement = null;
    // TODO: Update logic below to allow selection of contiguous cells in line

    // Check if target element is a cell in the word search and hasn't already been highlighted
    if (isCell && !isHighlighted) {
        i = Number(event.target.dataset.i);
        j = Number(event.target.dataset.j);
        iPrev = wsData["indexes"].slice(-1)[0][0];
        jPrev = wsData["indexes"].slice(-1)[0][1];
        dy = i - iPrev;
        dx = j - jPrev;
        slope = (dy / dx);
            
        // Note: The first cell has already been highlighted by startDrag()
        // If it's the second highlighted cell, and the slope is valid, we can set the slope                    
        // TODO: Figure out how to check for inverse slope???
        if (ALLOWED_SLOPES.indexOf(slope) >= 0) {
            if (wsData["indexes"].length == 1) {
                wsData["slope"] = slope;
            } 
            if (slope == wsData["slope"]) {
                // If highlighted cell isn't adjacent to previous cell, interpolate
                distance = Math.max(Math.abs(dx), Math.abs(dy));
                for (step = 1; step <= distance; ++step) {
                    iStep = iPrev + step * Math.max(-1, Math.min(dy, 1));
                    jStep = jPrev + step * Math.max(-1, Math.min(dx, 1));
                    cellContainer = document.querySelector('[data-i="' + iStep + '"][data-j="' + jStep + '"]');
                    cellContainer.classList.add("highlight");

                    // Make sure this cell hasn't already been added
                    if (wsData["indexes"].indexOf([iStep, jStep]) < 0) {
                        wsData["indexes"].push([iStep, jStep]);
                        wsData["letters"].push(cellContainer.textContent);
                    }
                }
            }            
        }
    }    
}


/**
 * Stop dragging on mouse up.
 * 
 * @param event - A click or touch event targeting an HTML element
 * @returns - void
 */
function stopDrag(event: any): void {
    let word: string = wsData["letters"].join("");

    checkWord(word);
    renderFoundWord();
    renderFoundWords();
    renderHiddenWords();
    renderPoints();

    document.onmousemove = null;
    document.onmouseup = null;
}


/**
 * Check if highlighted word is in puzzle or larger word list.
 * 
 * @param word 
 * @returns - void
 */
function checkWord(word: string): void {
    let complete: boolean = true;
    let hints = [];

    if (word.length <= 2) {
        hints.push("Word is too short: " + word);
    }
    else if (foundWords.indexOf(word) >= 0) {
        hints.push("You already found: " + word);
    }
    else if (hiddenWords.indexOf(word) >= 0) {
        foundWords.push(word);  // TODO: check if already there
        hints.push("Found hidden word: " + word);
    }
    else if (word in wsWordLookup) {
        foundWords.push(word);  // TODO: check if already there
        hints.push("Found extra word: " + word);
    } else {
        hints.push("Not a valid word: " + word);
    }

    for (let word of hiddenWords) {
        if (foundWords.indexOf(word) == -1) {
            complete = false;
            break;
        }
    }

    if (complete) {
        hints.push("You completed the puzzle!");
    }

    renderHints(hints);
}


/**
 * Render words hidden in puzzle to DOM container.
 */
function renderHiddenWords(words=hiddenWords, containerId="hidden-words-container"): void {
    const container = document.getElementById(containerId) as HTMLElement;
    let wordAnchor: HTMLAnchorElement = null;
    let wordContainer: HTMLSpanElement = null;

    container.innerHTML = "";

    for (let word of words) {
        wordAnchor = document.createElement("a");
        wordAnchor.href = 'https://duckduckgo.com/?q="' + word + '"+definition&norw=1';
        wordAnchor.target = "_blank";

        wordContainer = document.createElement("span");
        wordContainer.className = "word container";
        if (foundWords.indexOf(word) > -1) {
            wordContainer.classList.add("text-strikethru");
        }
        wordContainer.textContent = word;

        wordAnchor.appendChild(wordContainer);
        container.appendChild(wordAnchor);
    }
}


/**
 * Render all found words to DOM container.
 */
function renderFoundWords(words=foundWords, containerId="found-words-container"): void {
    const container = document.getElementById(containerId) as HTMLElement;
    let wordAnchor: HTMLAnchorElement = null;
    let wordContainer: HTMLSpanElement = null;

    container.innerHTML = "";

    for (let word of words) {
        wordAnchor = document.createElement("a");
        wordAnchor.href = 'https://duckduckgo.com/?q="' + word + '"+definition&norw=1';
        wordAnchor.target = "_blank";

        wordContainer = document.createElement("span");
        wordContainer.className = "word container";
        if (hiddenWords.indexOf(word) > -1) {
            wordContainer.classList.add("text-bold");
        }
        wordContainer.textContent = word;

        wordAnchor.appendChild(wordContainer);
        container.appendChild(wordAnchor);
    }

    
}


/**
 * Mark the word that was just found in the matrix
 */
function renderFoundWord() {
    let highlightedWord: string = wsData["letters"].join("");
    let cellContainer: HTMLElement = null;
    let l: number = 0;
    let i: number = 0;
    let j: number = 0; 

    if (hiddenWords.indexOf(highlightedWord) >= 0) {
        for (l; l < wsData["indexes"].length; ++l) {
            i = wsData["indexes"][l][0];
            j = wsData["indexes"][l][1];
            cellContainer = document.querySelector('[data-i="' + i + '"][data-j="' + j + '"]');
            cellContainer.classList.add("found");
        }
    }
}


/**
 * Calculate points based on words found so far.
 */
function getPoints(): number {
    let points: number = 0;

    for (let word of foundWords) {
        if (hiddenWords.indexOf(word) > -1) {
            points += 10;
        } else {
            points += 1;
        }
    }

    return points;
}


/**
 * Render point total to DOM.
 */
function renderPoints(): void {
    const container = <HTMLElement>document.getElementById("points-container");
    const points = <number>getPoints();

    container.textContent = points.toString();
}


/**
 * Render a hint to the DOM.
 * 
 * @param hints - Array of strings (text or HTML)
 * @returns - void
 */
function renderHints(hints: string[]): void {
    let hintsContainer: HTMLElement = document.getElementById("hint-container");
    let hintContainer: HTMLDivElement = null;

    hintsContainer.innerHTML = "";

    for (let hint of hints) {
        hintContainer = document.createElement("div");
        hintContainer.className = "hint-container";
        hintContainer.innerHTML = "> " + hint;
        hintsContainer.appendChild(hintContainer);
    }
}


/**
 * Stupid function to check if two stupid arrays contain the same stupid values.
 * 
 * @param a - Array, e.g.: of numbers
 * @param b - Array, e.g.: of numbers
 * @returns - `true` if arrays contain same values; otherwise `false`
 */
function equalArrays(a: any[], b: any[]): boolean {
    let i: number = 0;

    for (i = 0; i < a.length; ++i) {
        if (a[i] != b[i]) {
            return false;
        }
    }
  
    return a.length == b.length;
}


/**
 * Get a promise that resolves to an object of form {"WORD": 1}.
 * 
 * @param wordListURL - URL where we can get JSON containing allowed words
 * @return - Promise
 */
function getWordLookup(wordListURL=WORD_LIST_URL): Promise<object> {
    let key: string = "wsWordLookup";
    let promise: Promise<object> = null;
    let savedWordJSON: string = localStorage.getItem(key);

    if (savedWordJSON) {
        console.log("Loading " + key + " from localStorage...");
        promise = JSON.parse(savedWordJSON)
    } else {
        console.log("Loading " + key + " from " + wordListURL);
        promise = fetch(WORD_LIST_URL)
            .then(response => response.text())
            .then(json => {
                json = json.toUpperCase();
                console.log("Got JSON of length: " + json.length);
                try {
                    // If the JSON is too long, we can't story it in localStorage
                    localStorage.setItem(key, json);
                    console.log("Got JSON of length: " + json.length);
                } catch(error) {
                    console.log("Caught: " + error);
                }
                return JSON.parse(json);
            })
    }

    return promise;
}


/**
 * Main 
 * 
 * @returns - void
 */
function main() {
    getWordLookup()
        .then(wordLookup => {
            wsWordLookup = wordLookup;
            return getRandomChoices(Object.keys(wsWordLookup), WORDS_PER_PUZZLE);
        })
        .then(randomWords => {
            hiddenWords = randomWords;  // Set global variable
            renderHiddenWords();
            return getLetterMatrix(hiddenWords);
        })
        .then(matrix => renderLetterMatrix(matrix));

    document.addEventListener("mousedown", startDrag);
}

window.onload = main;
