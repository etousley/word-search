/**
 * Build a word search puzzle from a newline-separated wordlist.
 */


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
 * 
 * 
 * @param matrix - Array of arrays of letters.
 * @returns - void
 */
function renderLetterMatrix(matrix: string[][]): void {
    const matrixDiv = document.getElementById("ws-matrix") as HTMLDivElement;
    let rowContainer: HTMLDivElement = null;
    let cellContainer: HTMLSpanElement = null;

    for (let row of matrix) {
        rowContainer = document.createElement("div");
        rowContainer.className = "ws-row"; 
        for (let cell of row) {
            cellContainer = document.createElement("div");
            cellContainer.className = "ws-cell";
            cellContainer.textContent = cell;
            rowContainer.appendChild(cellContainer);
        }
        matrixDiv.appendChild(rowContainer);
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
    let elem: HTMLElement = event.target;

    if (elem.classList && elem.classList.contains("ws-cell")) {
        event.target.classList.add("highlight");
    }
    document.onmouseup = stopDrag;
    document.onmousemove = highlightCell;

}


function stopDrag(event: any): void {
    document.onmouseup = null;
    document.onmousemove = null;

}


/**
 * Main 
 */
function main() {
    const wordListLocation = "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears-long.txt" as string;
    const wordsPerPuzzle = 5 as number;
    const clearHighlightsButton = document.getElementById("clear-highlights-button") as HTMLButtonElement;
    const checkHighlightsButton = document.getElementById("check-highlights-button") as HTMLButtonElement;

    console.log("loading words from: " + wordListLocation)
    fetch(wordListLocation)
        .then(response => response.text())
        .then(text => text.split("\n"))
        .then(wordList => getRandomChoices(wordList, wordsPerPuzzle))
        .then(puzzleWords => getLetterMatrix(puzzleWords))
        .then(matrix => renderLetterMatrix(matrix));

    clearHighlightsButton.addEventListener("click", clearHighlights);

    document.addEventListener("click", highlightCell);
}

window.onload = main;
