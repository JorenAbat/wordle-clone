const maxAttempts = 6;
let currentAttempt = 0;
let targetWord = ""; // The word to guess will be fetched from the API
let targetWordDefinition = ""; // Store the word definition

const gameBoard = document.getElementById("game-board");
const guessInput = document.getElementById("guess-input");
const guessButton = document.getElementById("guess-button");
const resultMessage = document.getElementById("result-message"); // Div to display messages

// Create a letter grid for all 26 letters
const letterGrid = document.getElementById("letter-grid");
const letterStatus = {}; // Track the status of each letter

// Modal elements
const modal = document.getElementById("game-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalCloseButton = document.getElementById("modal-close-button");

// Add the restart button to the modal
const restartButton = document.getElementById("restart-button");

for (let i = 0; i < 26; i++) {
  const letter = String.fromCharCode(97 + i); // a-z
  const letterBox = document.createElement("div");
  letterBox.id = `letter-${letter}`;
  letterBox.textContent = letter;
  letterGrid.appendChild(letterBox);
  letterStatus[letter] = "unguessed"; // Initialize all letters as unguessed
}
// Create the grid
for (let i = 0; i < maxAttempts * 5; i++) {
  const box = document.createElement("div");
  const letterSpan = document.createElement("span"); // Create span for the letter
  box.classList.add("game-box"); // Add a default class for styling
  box.appendChild(letterSpan); // Append the letter span inside the box
  gameBoard.appendChild(box);
}

// Function to show the modal with definition
function showModal(title, message, definition) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  const definitionElement = document.createElement("p");
  definitionElement.textContent = `Definition: ${definition}`;
  modalMessage.appendChild(definitionElement); // Add the definition to the modal message
  modal.style.display = "flex"; // Show the modal as a flex container
}

// Close the modal when the close button is clicked
modalCloseButton.addEventListener("click", () => {
  modal.style.display = "none"; // Hide the modal
});

// Helper function to fetch a random 5-letter word
async function fetchRandomWord() {
  try {
    const response = await fetch(
      "https://random-word-api.herokuapp.com/word?length=5"
    );
    const words = await response.json();

    if (words && words.length > 0) {
      const word = words[0].toLowerCase(); // Get the first word in lowercase

      // Check if the word exists in the dictionary using the Dictionary API
      const isValid = await isValidWord(word);
      if (isValid) {
        return word; // Return the word if valid
      } else {
        // If the word isn't valid, fetch another word
        return fetchRandomWord();
      }
    } else {
      throw new Error("No words received from the API");
    }
  } catch (error) {
    console.error("Error fetching random word:", error);
    return "apple"; // Fallback word if API fails
  }
}
// Function to fetch word definition from Dictionary API
async function fetchWordDefinition(word) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    if (response.ok) {
      const data = await response.json();
      // Extract the first definition
      const definition = data[0]?.meanings[0]?.definitions[0]?.definition;
      return definition || "Definition not available.";
    } else {
      return "Definition not available.";
    }
  } catch (error) {
    console.error("Error fetching word definition:", error);
    return "Definition not available.";
  }
}
// Helper function to validate input using Dictionary API
async function isValidWord(word) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );

    // Check if the response is successful
    if (!response.ok) {
      throw new Error("Word is not valid");
    }

    const data = await response.json();

    // If the word has definitions, it is valid
    if (data && data[0] && data[0].meanings && data[0].meanings.length > 0) {
      return true; // Word is valid
    } else {
      return false; // Word is not valid
    }
  } catch (error) {
    console.error("Error checking word:", error);
    return false; // If there's an error, consider the word invalid
  }
}

function restartGame() {
  currentAttempt = 0;
  targetWord = "";
  resultMessage.textContent = "";
  restartButton.style.display = "none"; // Hide the restart button initially
  fetchRandomWord().then((newWord) => {
    targetWord = newWord;
    console.log("New word picked:", targetWord); // Debug log to ensure it's a new word
  });
  resetGameBoard(); // Reset the game board
  resetLetterGrid(); // Reset the letter grid
  guessButton.disabled = false; // Disable button after winning
  guessInput.disabled = false; // Disable input after winning
  guessInput.value = "";
}
function resetGameBoard() {
  gameBoard.innerHTML = ""; // Clear the game board

  for (let i = 0; i < maxAttempts * 5; i++) {
    const box = document.createElement("div");
    const letterSpan = document.createElement("span");
    box.classList.add("game-box");
    box.appendChild(letterSpan);
    gameBoard.appendChild(box);
  }
}
function resetLetterGrid() {
  const letterBoxes = letterGrid.querySelectorAll("div");
  letterBoxes.forEach((letterBox) => {
    letterBox.classList.remove("correct", "present", "absent"); // Remove any styles
  });
  for (let letter in letterStatus) {
    letterStatus[letter] = "unguessed"; // Reset letter status
  }
}

// Handle guess submission
async function submitGuess() {
  const guess = guessInput.value.toLowerCase();

  const validWord = await isValidWord(guess);

  if (!validWord) {
    resultMessage.textContent = "Guess is not a valid word!";
    resultMessage.style.color = "red";
    return;
  }

  if (guess.length !== 5) {
    resultMessage.textContent = "Guess must be a 5-letter word!";
    resultMessage.style.color = "red";
    return;
  }

  if (currentAttempt >= maxAttempts) {
    resultMessage.textContent = `Game over! You've used all attempts. The word was "${targetWord}".`;
    resultMessage.style.color = "red";
    return;
  }

  const rowStart = currentAttempt * 5;
  const targetWordArray = targetWord.split(""); // Create a copy of the target word
  const guessedCorrectly = [];

  // First pass: Check for correct letters in the correct position
  for (let i = 0; i < 5; i++) {
    const box = gameBoard.children[rowStart + i];
    const letterSpan = box.querySelector("span"); // Get the span element for the letter
    letterSpan.textContent = guess[i]; // Set the letter inside the box

    if (guess[i] === targetWord[i]) {
      guessedCorrectly.push(i); // Mark position as correctly guessed
      targetWordArray[i] = null; // Remove from target word to avoid reuse
    }
  }

  // Apply initial gray (absent) color to all boxes
  for (let i = 0; i < 5; i++) {
    const box = gameBoard.children[rowStart + i];
    box.classList.add("absent"); // Set boxes to gray initially
  }

  // Second pass: Check for correct letters in the wrong position
  for (let i = 0; i < 5; i++) {
    const box = gameBoard.children[rowStart + i];
    const letterSpan = box.querySelector("span"); // Get the span element for the letter

    // Apply animation class to letter span with delay
    setTimeout(() => {
      box.classList.add("reveal"); // Add reveal animation to the box
      letterSpan.classList.add("reveal"); // Reveal the letter inside the box
    }, i * 300); // Delay for animation effect
  }

  // Apply colors after all letters are revealed
  setTimeout(() => {
    for (let i = 0; i < 5; i++) {
      const box = gameBoard.children[rowStart + i];
      box.classList.remove("absent");

      if (guess[i] === targetWord[i]) {
        box.classList.add("correct"); // Correct guess
      } else if (targetWord.includes(guess[i])) {
        box.classList.add("present"); // Present letter but wrong position
      } else {
        box.classList.add("absent"); // Letter not in word (still gray)
      }
    }
  }, 1500);

  if (guess === targetWord) {
    const definition = await fetchWordDefinition(targetWord);
    showModal(
      "You Win!",
      `Congratulations! The word was "${targetWord}".`,
      definition
    );
    resultMessage.textContent = "Congratulations! You've guessed the word!";
    resultMessage.style.color = "green";
    restartButton.style.display = "inline-block"; // Show restart button
    guessButton.disabled = true; // Disable button after winning
    guessInput.disabled = true; // Disable input after winning
    return;
  } else if (currentAttempt === maxAttempts - 1) {
    const definition = await fetchWordDefinition(targetWord);
    showModal(
      "Game Over",
      `You lose! The word was "${targetWord}".`,
      definition
    );
    resultMessage.textContent = `Game over! The word was "${targetWord}".`;
    resultMessage.style.color = "red";
    restartButton.style.display = "inline-block"; // Show restart button
    guessButton.disabled = true; // Disable button after game ends
    guessInput.disabled = true; // Disable input after game ends
    return;
  } else {
    resultMessage.textContent = `Attempt ${
      currentAttempt + 1
    } of ${maxAttempts}`;
    resultMessage.style.color = "black";
  }
  updateLetterGrid(guess, targetWord);
  // Proceed with the guess validation and feedback logic...
  currentAttempt++;
  guessInput.value = "";
}

// Add event listener for pressing the Enter key
guessInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    submitGuess(); // Submit guess when Enter is pressed
  }
});

// Add event listener for clicking the submit button
guessButton.addEventListener("click", submitGuess);

// Fetch and set the target word when the page loads
fetchRandomWord().then((word) => {
  targetWord = word;
  console.log("Target word:", targetWord); // For debugging purposes
});

// Update the letter grid based on the current guess
function updateLetterGrid(guess, targetWord) {
  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i];
    const letterBox = document.getElementById(`letter-${letter}`);

    if (!letterBox) continue;

    if (targetWord.includes(letter)) {
      // If the letter is correct and in the right position
      if (targetWord[i] === letter) {
        letterStatus[letter] = "correct";
      }
      // If the letter is correct but in the wrong position
      else if (letterStatus[letter] !== "correct") {
        letterStatus[letter] = "present";
      }
    } else {
      // If the letter is not in the word
      letterStatus[letter] = "absent";
    }

    // Update the letter box class
    letterBox.className = letterStatus[letter];
  }
}
restartButton.addEventListener("click", restartGame);
