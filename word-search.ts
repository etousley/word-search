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

let hiddenWords: string[] = [];
let foundWords: string[] = [];
let wsData: object = {};
let wordLookup: object = {};


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
    let wordFits: boolean = false;
    let slotLetters: string[] = [];
    let direction: string = null;
    let dx: number = null;
    let dy: number = null;
    let i: number = 0;
    let j: number = 0;
    let l: number = 0;

    // Allocate longer words first
    words = words.sort((a, b) => b.length - a.length);
    words = words.map(word => word.toUpperCase());
    console.log("words: " + words);  // TODO: Delete me

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
        wordFits = false;
        allowedSlots = slots.filter(slot => slot["length"] >= word.length);
        allowedSlots = getRandomChoices(allowedSlots);  // Shuffle

        for (let slot of allowedSlots) {
            i = slot["i"];  // These values are used to write word to matrix
            j = slot["j"];
            dx = slot["dx"];
            dy = slot["dy"]  
            slotLetters = getSlotValues(matrix, i, j, dx, dy, word.length);
            
            if (slotLetters.every(letter => letter == " ")) {
                wordFits = true;
                break;
            }
        }

        // Write word to letter matrix in the chosen slot
        if (wordFits) {
            for (l = 0; l < word.length; ++l) {
                matrix[i][j] = word[l];
                i += dy;
                j += dx;
            }
        } else {
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
 * When dragging on letter containers, if it's a valid direction, 
 * 
 * @param event - A click or touch event targeting an HTML element
 * @returns - void
 */
function highlightCell(event: any): void {
    if (event.target.classList.contains("ws-cell")) {
        event.target.classList.add("highlight");
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
            dx: null,
            dy: null,
        }
        document.onmousemove = handleDrag;
        document.onmouseup = stopDrag;
        highlightCell(event);
    }
}


/**
 * When user drags over an element, decide whether to highlight it.
 * NOTE: This is not a pure function -- it gets and mutates localStorage["wsData"]
 * 
 * @param event - A click or touch event targeting an HTML element
 * @returns - void
 */
function handleDrag(event: any): void {
    const allowedDeltas = Object.keys(DIRECTIONS).map(key => DIRECTIONS[key]) as number[][];
    let isAllowedDelta: boolean = false;
    let i: number = null;
    let j: number = null;
    let dy: number = null;
    let dx: number = null;

    // Check if target element is a cell in the word search
    if (event.target.classList.contains("ws-cell")) {
        i = Number(event.target.dataset.i);
        j = Number(event.target.dataset.j);
        dy = i - wsData["indexes"].slice(-1)[0][0];  // Current minus previous
        dx = j - wsData["indexes"].slice(-1)[0][1];

        // Check if the target cell is a neighbor of the last target cell
        isAllowedDelta = (allowedDeltas.filter(x => equalArrays(x, [dx, dy])).length > 0);
        if (isAllowedDelta) {
            // If it's the second highlighted cell, we can now set the deltas
            if ( (wsData["dx"] == null) && (wsData["dy"] == null) ) {
                wsData["dx"] = dx;
                wsData["dy"] = dy;
            }

            // If target cell follows slope of prior cells, highlight it
            if ( (dy / dx == wsData["dy"] / wsData["dx"]) ) {
                wsData["indexes"].push([i, j])
                wsData["letters"].push(event.target.textContent);
                highlightCell(event);
            }
        }
    }    
}


/**
 * Stupid function to check if two arrays contain the same values.
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
 * Stop dragging on mouse up.
 * 
 * @param event - A click or touch event targeting an HTML element
 * @returns - void
 */
function stopDrag(event: any): void {
    let word = wsData["letters"].join("");

    checkWord(word);
    renderWords(foundWords, "found-words-container");

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

    for (let word of hiddenWords) {
        if (foundWords.indexOf(word) == -1) {
            complete = false;
            break;
        }
    }

    if (complete) {
        console.log("You completed the puzzle!");
    }
    else if (foundWords.indexOf(word) >= 0) {
        console.log("you already found: " + word);
    }
    else if (hiddenWords.indexOf(word) >= 0) {
        foundWords.push(word);  // TODO: check if already there
        console.log("found word: " + word);
    }
    else if (word in wordLookup) {
        foundWords.push(word);  // TODO: check if already there
        console.log("found extra word: " + word);
    } else {
        console.log("not a real word: " + word);
    }
}


/**
 * Render words hidden in puzzle to DOM container.
 */
function renderHiddenWords(words=hiddenWords, containerId="hidden-words-container"): void {
    const container = document.getElementById(containerId) as HTMLElement;
    let wordContainer: HTMLSpanElement = null;

    container.innerHTML = "";

    for (let word of words) {
        wordContainer = document.createElement("span");
        wordContainer.className = "word container";
        if (foundWords.indexOf(word) > -1) {
            wordContainer.classList.add("text-strikethru");
        }
        wordContainer.textContent = word;
        container.appendChild(wordContainer);
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
        wordAnchor.href = "https://duckduckgo.com/?q=" + word + "+definition";

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
 * Main 
 */
function main() {
    fetch(WORD_LIST_URL)
        .then(response => response.text())
        .then(text => text.toUpperCase())
        .then(text => JSON.parse(text))
        .then(tmpwordLookup => {
            // Set global variables
            wordLookup = tmpwordLookup;
            return getRandomChoices(Object.keys(wordLookup), WORDS_PER_PUZZLE);
        })
        .then(randomWords => {
            hiddenWords = randomWords;  // Set global variable
            renderWords(hiddenWords, "hidden-words-container");
            return getLetterMatrix(hiddenWords);
        })
        .then(matrix => renderLetterMatrix(matrix));

    document.addEventListener("mousedown", startDrag);
}

window.onload = main;
