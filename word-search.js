/**
 * Build a word search puzzle from a newline-separated wordlist.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var DIRECTIONS = {
    N: [0, -1],
    NE: [1, -1],
    E: [1, 0],
    SE: [1, 1],
    S: [0, 1],
    SW: [-1, 1],
    W: [-1, 0],
    NW: [-1, -1]
};
/**
 * Return `n` random choices from an array of `values`.
 *
 * @param values - An array.
 * @param n - Number of random choices to return.
 * @param replace - If false, each value can only be chosen once.
 * @returns - Array of values (subset of original).
 */
function getRandomChoices(values, n, replace) {
    if (n === void 0) { n = null; }
    if (replace === void 0) { replace = false; }
    var choices = [];
    var ix = null;
    var unusedValues = values.slice(); // Copy of original
    if (n == null) {
        n = values.length;
    }
    while (choices.length < n) {
        ix = Math.floor(Math.random() * unusedValues.length);
        if (!replace) {
            unusedValues.splice(ix, 1); // Pop off the index we used
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
function getLetterMatrix(words, directions, pad) {
    if (directions === void 0) { directions = DIRECTIONS; }
    if (pad === void 0) { pad = 0; }
    var _a;
    var allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    var m = Math.max.apply(Math, words.map(function (word) { return word.length; }));
    var n = m;
    var matrix = [];
    var row = [];
    var allowedSlots = [];
    var slots = [];
    var slot = {};
    var wordFits = false;
    var slotLetters = [];
    var direction = null;
    var dx = null;
    var dy = null;
    var i = 0;
    var j = 0;
    var l = 0;
    // Allocate longer words first
    words = words.sort(function (a, b) { return b.length - a.length; });
    words = words.map(function (word) { return word.toUpperCase(); });
    console.log("words: " + words); // TODO: Delete me
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
                _a = directions[direction], dx = _a[0], dy = _a[1];
                slotLetters = getSlotValues(matrix, i, j, dx, dy);
                slot = { i: i, j: j, dx: dx, dy: dy, length: slotLetters.length };
                slots.push(slot);
            }
        }
    }
    var _loop_1 = function (word) {
        wordFits = false;
        allowedSlots = slots.filter(function (slot) { return slot["length"] >= word.length; });
        allowedSlots = getRandomChoices(allowedSlots); // Shuffle
        for (var _i = 0, allowedSlots_1 = allowedSlots; _i < allowedSlots_1.length; _i++) {
            var slot_1 = allowedSlots_1[_i];
            i = slot_1["i"]; // These values are used to write word to matrix
            j = slot_1["j"];
            dx = slot_1["dx"];
            dy = slot_1["dy"];
            slotLetters = getSlotValues(matrix, i, j, dx, dy, word.length);
            if (slotLetters.every(function (letter) { return letter == " "; })) {
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
        }
        else {
            console.log("Couldn't fit word: '" + word + "' into matrix.");
        }
    };
    for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
        var word = words_1[_i];
        _loop_1(word);
    }
    // Fill in blanks with random letters
    for (i = 0; i < m; ++i) {
        row = matrix[i];
        for (j = 0; j < n; ++j) {
            if (row[j] == " ") {
                matrix[i][j] = getRandomChoices(allLetters, 1)[0];
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
function getSlotValues(matrix, i, j, dx, dy, maxLength) {
    if (maxLength === void 0) { maxLength = -1; }
    var values = [];
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
function isValidIndex(matrix, i, j) {
    var m = matrix.length;
    var n = matrix[0].length;
    // (row index is inside matrix) && (column index is inside matrix)
    return ((0 <= i) && (i < m) && (0 <= j) && (j < n));
}
/**
 *
 *
 * @param matrix - Array of arrays of letters.
 * @returns - void
 */
function renderLetterMatrix(matrix) {
    var matrixDiv = document.getElementById("ws-matrix");
    var rowContainer = null;
    var cellContainer = null;
    for (var _i = 0, matrix_1 = matrix; _i < matrix_1.length; _i++) {
        var row = matrix_1[_i];
        rowContainer = document.createElement("div");
        rowContainer.className = "ws-row";
        for (var _a = 0, row_1 = row; _a < row_1.length; _a++) {
            var cell = row_1[_a];
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
function clearHighlights(event) {
    var elements = __assign({}, document.getElementsByClassName("highlight"));
    for (var key in elements) {
        elements[key].classList.remove("highlight");
    }
}
/**
 * When dragging on letter containers, if it's a valid direction,
 *
 * @param event - A click or touch event targeting an HTML element
 * @returns - void
 */
function highlightCell(event) {
    var elem = event.target;
    if (elem.classList && elem.classList.contains("ws-cell")) {
        event.target.classList.add("highlight");
    }
    document.onmouseup = stopDrag;
    document.onmousemove = highlightCell;
}
function stopDrag(event) {
    document.onmouseup = null;
    document.onmousemove = null;
}
/**
 * Main
 */
function main() {
    var wordListLocation = "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears-long.txt";
    var wordsPerPuzzle = 5;
    var clearHighlightsButton = document.getElementById("clear-highlights-button");
    var checkHighlightsButton = document.getElementById("check-highlights-button");
    console.log("loading words from: " + wordListLocation);
    fetch(wordListLocation)
        .then(function (response) { return response.text(); })
        .then(function (text) { return text.split("\n"); })
        .then(function (wordList) { return getRandomChoices(wordList, wordsPerPuzzle); })
        .then(function (puzzleWords) { return getLetterMatrix(puzzleWords); })
        .then(function (matrix) { return renderLetterMatrix(matrix); });
    clearHighlightsButton.addEventListener("click", clearHighlights);
    document.addEventListener("click", highlightCell);
}
window.onload = main;
