const targetWord = "apple"; // The word to guess
const maxAttempts = 6;
let currentAttempt = 0;

const gameBoard = document.getElementById("game-board");
const guessInput = document.getElementById("guess-input");
const guessButton = document.getElementById("guess-button");
const resultMessage = document.getElementById("result-message"); // Div to display messages

// Your WordsAPI key (you should replace this with your own API key)
const apiKey = "c53b81a7d9msh7b48334e19b7d7fp1dc26cjsn6ac679184930";

// Create the grid
for (let i = 0; i < maxAttempts * 5; i++) {
  const box = document.createElement("div");
  const letterSpan = document.createElement("span"); // Create span for the letter
  box.classList.add("game-box"); // Add a default class for styling
  box.appendChild(letterSpan); // Append the letter span inside the box
  gameBoard.appendChild(box);
}

// Helper function to validate input using WordsAPI
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
    // Now that the letters are revealed, apply the correct/present color changes
    for (let i = 0; i < 5; i++) {
      const box = gameBoard.children[rowStart + i];

      // Remove the "absent" class and apply the correct/present class as needed
      box.classList.remove("absent");

      if (guess[i] === targetWord[i]) {
        box.classList.add("correct"); // Correct guess
      } else if (targetWord.includes(guess[i])) {
        box.classList.add("present"); // Present letter but wrong position
      } else {
        box.classList.add("absent"); // Letter not in word (still gray)
      }
    }
  }, 1500); // Delay color application until after all letters have been revealed (1500ms)

  if (guess === targetWord) {
    resultMessage.textContent = "Congratulations! You've guessed the word!";
    resultMessage.style.color = "green";
    guessButton.disabled = true; // Disable button after winning
    guessInput.disabled = true; // Disable input after winning
  } else if (currentAttempt === maxAttempts - 1) {
    resultMessage.textContent = `Game over! The word was "${targetWord}".`;
    resultMessage.style.color = "red";
    guessButton.disabled = true; // Disable button after game ends
    guessInput.disabled = true; // Disable input after game ends
  } else {
    resultMessage.textContent = `Attempt ${
      currentAttempt + 1
    } of ${maxAttempts}`;
    resultMessage.style.color = "black";
  }

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
