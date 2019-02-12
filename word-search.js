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
var WORD_LIST_URL = "https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json";
var WORDS_PER_PUZZLE = 5;
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
var hiddenWords = [];
var foundWords = [];
var wsData = {};
var wordLookup = {};
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
    var slotLetters = [];
    var direction = null;
    var dx = null;
    var dy = null;
    var i = 0;
    var j = 0;
    var l = 0;
    var wordFits = false;
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
        allowedSlots = slots.filter(function (slot) { return slot["length"] >= word.length; });
        // Keep randomness; weight diagonal slots to correct for reduced chance of fit
        allowedSlots = getRandomChoices(allowedSlots); // Shuffle
        allowedSlots = allowedSlots.sort(function (a, b) { return slotCompare(a, b); });
        for (var _i = 0, allowedSlots_1 = allowedSlots; _i < allowedSlots_1.length; _i++) {
            var slot_1 = allowedSlots_1[_i];
            i = slot_1["i"]; // These values used to write word to matrix
            j = slot_1["j"];
            dx = slot_1["dx"];
            dy = slot_1["dy"];
            slotLetters = getSlotValues(matrix, i, j, dx, dy, word.length);
            if (Math.abs(dy / dx) == 1) {
                console.log("word: " + word + ", diagonal slot: " + slotLetters);
            }
            wordFits = wordFitsSlot(word, slotLetters);
            if (wordFits) {
                for (l = 0; l < word.length; ++l) {
                    matrix[i][j] = word[l];
                    i += dy;
                    j += dx;
                }
                break; // Move on to next word
            }
        }
        if (wordFits == false) {
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
// Check if slot is full of blanks (or has letters that fit into target word)
function wordFitsSlot(word, slotLetters) {
    var l = 0;
    for (l = 0; l < word.length; ++l) {
        if ((slotLetters[l] != " ") && (slotLetters[l] != word[l])) {
            return false;
        }
    }
    return true;
}
function isDiagonal(slot) {
    return Math.abs(slot["dy"] / slot["dx"]) == 1;
}
function slotCompare(a, b) {
    var aIsDiagonal = isDiagonal(a);
    var bIsDiagonal = isDiagonal(b);
    if (aIsDiagonal) {
        return Math.random() - 0.5;
    }
    else if (bIsDiagonal) {
        return Math.random() + 0.5;
    }
    else {
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
 * Render a matrix of letters as DOM elements.
 *
 * @param matrix - Array of arrays of letters.
 * @returns - void
 */
function renderLetterMatrix(matrix) {
    var matrixContainer = document.getElementById("ws-matrix");
    var rowContainer = null;
    var cellContainer = null;
    var i = 0;
    var j = 0;
    var row = null;
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
function startDrag(event) {
    var elem = event.target;
    var i = null;
    var j = null;
    clearHighlights(event);
    if (elem.classList.contains("ws-cell")) {
        i = Number(elem.dataset.i);
        j = Number(elem.dataset.j);
        wsData = {
            indexes: [[i, j]],
            letters: [event.target.textContent],
            dx: null,
            dy: null
        };
        document.onmousemove = handleDrag;
        document.onmouseup = stopDrag;
        highlightCell(event);
    }
}
/**
 * When user drags over an element, decide whether to highlight it.
 * Hint: This is not a pure function -- it gets and mutates localStorage["wsData"]
 *
 * @param event - A click or touch event targeting an HTML element
 * @returns - void
 */
function handleDrag(event) {
    var allowedDeltas = Object.keys(DIRECTIONS).map(function (key) { return DIRECTIONS[key]; });
    var isAllowedDelta = false;
    var i = null;
    var j = null;
    var dy = null;
    var dx = null;
    // Check if target element is a cell in the word search
    if (event.target.classList.contains("ws-cell")) {
        i = Number(event.target.dataset.i);
        j = Number(event.target.dataset.j);
        dy = i - wsData["indexes"].slice(-1)[0][0]; // Current minus previous
        dx = j - wsData["indexes"].slice(-1)[0][1];
        // Check if the target cell is a neighbor of the last target cell
        isAllowedDelta = (allowedDeltas.filter(function (x) { return equalArrays(x, [dx, dy]); }).length > 0);
        if (isAllowedDelta) {
            // If it's the second highlighted cell, we can now set the deltas
            if ((wsData["dx"] == null) && (wsData["dy"] == null)) {
                wsData["dx"] = dx;
                wsData["dy"] = dy;
            }
            // If target cell follows slope of prior cells, highlight it
            if ((dy / dx == wsData["dy"] / wsData["dx"])) {
                wsData["indexes"].push([i, j]);
                wsData["letters"].push(event.target.textContent);
                highlightCell(event);
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
function stopDrag(event) {
    var word = wsData["letters"].join("");
    // let reversedWord: string = wsData["letters"].reverse().join("");
    checkWord(word);
    // checkWord(reversedWord);
    renderFoundWords();
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
function checkWord(word) {
    var complete = true;
    if (word.length <= 2) {
        renderHint("Word is too short: " + word);
    }
    else if (foundWords.indexOf(word) >= 0) {
        renderHint("You already found: " + word);
    }
    else if (hiddenWords.indexOf(word) >= 0) {
        foundWords.push(word); // TODO: check if already there
        renderHint("Found hidden word: " + word);
        renderHiddenWords();
    }
    else if (word in wordLookup) {
        foundWords.push(word); // TODO: check if already there
        renderHint("Found extra word: " + word);
    }
    else {
        renderHint("Not a valid word: " + word);
    }
    for (var _i = 0, hiddenWords_1 = hiddenWords; _i < hiddenWords_1.length; _i++) {
        var word_1 = hiddenWords_1[_i];
        if (foundWords.indexOf(word_1) == -1) {
            complete = false;
            break;
        }
    }
    if (complete) {
        renderHint("You completed the puzzle!");
    }
}
/**
 * Render words hidden in puzzle to DOM container.
 */
function renderHiddenWords(words, containerId) {
    if (words === void 0) { words = hiddenWords; }
    if (containerId === void 0) { containerId = "hidden-words-container"; }
    var container = document.getElementById(containerId);
    var wordAnchor = null;
    var wordContainer = null;
    container.innerHTML = "";
    for (var _i = 0, words_2 = words; _i < words_2.length; _i++) {
        var word = words_2[_i];
        wordAnchor = document.createElement("a");
        wordAnchor.href = "https://duckduckgo.com/?q=" + word + "+definition";
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
function renderFoundWords(words, containerId) {
    if (words === void 0) { words = foundWords; }
    if (containerId === void 0) { containerId = "found-words-container"; }
    var container = document.getElementById(containerId);
    var wordAnchor = null;
    var wordContainer = null;
    container.innerHTML = "";
    for (var _i = 0, words_3 = words; _i < words_3.length; _i++) {
        var word = words_3[_i];
        wordAnchor = document.createElement("a");
        wordAnchor.href = "https://duckduckgo.com/?q=" + word + "+definition";
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
 * Calculate points based on words found so far.
 */
function getPoints() {
    var points = 0;
    for (var _i = 0, foundWords_1 = foundWords; _i < foundWords_1.length; _i++) {
        var word = foundWords_1[_i];
        if (hiddenWords.indexOf(word) > -1) {
            points += 10;
        }
        else {
            points += 1;
        }
    }
    return points;
}
/**
 * Render point total to DOM.
 */
function renderPoints() {
    var container = document.getElementById("points-container");
    var points = getPoints();
    container.textContent = points.toString();
}
/**
 * Render a hint to the DOM.
 *
 * @param hint - Text or HTML
 */
function renderHint(hint) {
    document.getElementById("hint-container").innerHTML = "> " + hint;
}
/**
 * Stupid function to check if two arrays contain the same values.
 *
 * @param a - Array, e.g.: of numbers
 * @param b - Array, e.g.: of numbers
 * @returns - `true` if arrays contain same values; otherwise `false`
 */
function equalArrays(a, b) {
    var i = 0;
    for (i = 0; i < a.length; ++i) {
        if (a[i] != b[i]) {
            return false;
        }
    }
    return a.length == b.length;
}
/**
 * Main
 */
function main() {
    fetch(WORD_LIST_URL)
        .then(function (response) { return response.text(); })
        .then(function (text) { return text.toUpperCase(); })
        .then(function (text) { return JSON.parse(text); })
        .then(function (tmpwordLookup) {
        // Set global variables
        wordLookup = tmpwordLookup;
        return getRandomChoices(Object.keys(wordLookup), WORDS_PER_PUZZLE);
    })
        .then(function (randomWords) {
        hiddenWords = randomWords; // Set global variable
        renderHiddenWords();
        return getLetterMatrix(hiddenWords);
    })
        .then(function (matrix) { return renderLetterMatrix(matrix); });
    document.addEventListener("mousedown", startDrag);
}
window.onload = main;
