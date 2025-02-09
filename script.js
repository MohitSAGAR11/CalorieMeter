
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .screen {
    display: none;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  .screen.active {
    display: block;
    opacity: 1;
  }

  .animate__fadeIn {
    animation-duration: 0.5s;
  }
`;
document.head.appendChild(styleSheet);

// Sidebar toggle
function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("active");
}

// Screen management
function showScreen(event, screenId) {
  event.preventDefault();
  
  // Update active nav link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });
  event.currentTarget.classList.add("active");

  // Hide all screens
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
    screen.style.display = "none";
  });

  // Show selected screen with animation
  const selectedScreen = document.getElementById(`${screenId}-screen`);
  selectedScreen.style.display = "block";
  selectedScreen.offsetHeight; // Force reflow
  selectedScreen.classList.add("active", "animate__animated", "animate__fadeIn");

  setTimeout(() => {
    selectedScreen.classList.remove("animate__animated", "animate__fadeIn");
  }, 1000);

  // Close mobile menu
  if (window.innerWidth <= 768) {
    document.querySelector(".sidebar").classList.remove("active");
  }

  // Initialize specific screens
  switch(screenId) {
    case 'dashboard':
      updateActivityLog();
      updateTodayMeals();
      break;
    case 'meals':
      document.getElementById("mealResults").innerHTML = "";
      document.getElementById("ingredients").value = "";
      document.getElementById("allergies").value = "";
      break;
    case 'planner':
      document.getElementById("age").value = "";
      document.getElementById("weight").value = "";
      document.getElementById("height").value = "";
      document.getElementById("gender").value = "male";
      document.getElementById("activity").value = "1.2";
      break;
  }
}

// Stats management
function openStatsInput() {
  document.querySelector(".input-overlay").style.display = "flex";
  
  const currentStats = getStats();
  document.getElementById("caloriesInput").value = currentStats.calories;
  document.getElementById("stepsInput").value = currentStats.steps;
  document.getElementById("waterInput").value = currentStats.water;
  document.getElementById("sleepInput").value = currentStats.sleep;
}

function closeStatsInput() {
  document.querySelector(".input-overlay").style.display = "none";
}

function saveStats() {
  const stats = {
    calories: parseInt(document.getElementById("caloriesInput").value) || 0,
    steps: parseInt(document.getElementById("stepsInput").value) || 0,
    water: parseInt(document.getElementById("waterInput").value) || 0,
    sleep: parseFloat(document.getElementById("sleepInput").value) || 0
  };

  localStorage.setItem("healthStats", JSON.stringify(stats));

  updateStatCard(0, `${stats.calories} / 2000 kcal`, (stats.calories / 2000) * 100);
  updateStatCard(1, `${stats.steps} / 10000 steps`, (stats.steps / 10000) * 100);
  updateStatCard(2, `${stats.water} / 8 glasses`, (stats.water / 8) * 100);
  updateStatCard(3, `${stats.sleep} / 8 hours`, (stats.sleep / 8) * 100);

  closeStatsInput();
  showNotification("Progress updated successfully", "success");
}

function getStats() {
  const defaultStats = {
    calories: 0,
    steps: 0,
    water: 0,
    sleep: 0
  };

  const savedStats = localStorage.getItem("healthStats");
  return savedStats ? JSON.parse(savedStats) : defaultStats;
}

function updateStatCard(index, value, percentage) {
  const cards = document.querySelectorAll(".stat-card");
  const card = cards[index];
  if (card) {
    card.querySelector(".stat-value").textContent = value;
    card.querySelector(".progress-fill").style.width = `${Math.min(100, percentage)}%`;
  }
}

// Calorie Calculator
function calculateCalories() {
  const age = parseInt(document.getElementById("age").value);
  const gender = document.getElementById("gender").value;
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  const activity = parseFloat(document.getElementById("activity").value);

  if (!age || !weight || !height) {
    showNotification("Please fill in all fields", "error");
    return;
  }

  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const calories = Math.round(bmr * activity);
  showNotification(`Your daily calorie needs: ${calories} calories`, "success");
}

// Meal Planning
async function generateMealPlan() {
  const ingredients = document.getElementById("ingredients").value;
  const allergies = document.getElementById("allergies").value;
  const apiKey = "8e4d2cc8c3954aaea6af88a48cd07cdf"; // Replace with your Spoonacular API key

  if (!ingredients) {
    showNotification("Please enter ingredients", "error");
    return;
  }

  const apiUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(
    ingredients
  )}&number=3&apiKey=${apiKey}`;
console.log(encodeURIComponent(ingredients))
  try {
    const response = await fetch(apiUrl);
    const meals = await response.json();
    console.log(meals)
    if (!meals.length) {
      showNotification("No meals found. Try different ingredients.", "error");
      return;
    }

    const formattedMeals = meals.map((meal) => ({
      name: meal.title,
      calories: "N/A",
      protein: "N/A",
      carbs: "N/A",
      fat: "N/A",
      fiber: "N/A",
      sodium: "N/A",
      vitamins: [],
      image: meal.image,
      ingredients: meal.usedIngredients.map((ing) => ing.name),
    }));

    displayMealResults(formattedMeals);
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    showNotification("Failed to fetch meals. Try again later.", "error");
  }
}

function displayMealResults(meals) {
  const container = document.getElementById("mealResults");
  container.innerHTML = "";

  meals.forEach((meal) => {
    const mealCard = document.createElement("div");
    mealCard.className = "meal-card animate__animated animate__fadeIn";
    console.log(meal)
    console.log(meal.calories)
    mealCard.innerHTML = `
      <img src="${meal.image}" alt="${meal.name}" class="meal-image">
      <div class="meal-content">
        <h3>${meal.name}</h3>
        <div class="meal-details">
          <div class="nutritional-info">
            <h4>Nutritional Information</h4>
            <div class="nutrition-grid">
              <p><strong>Calories:</strong> ${meal.calories}</p>
              <p><strong>Protein:</strong> ${meal.protein}g</p>
              <p><strong>Carbs:</strong> ${meal.carbs}g</p>
              <p><strong>Fat:</strong> ${meal.fat}g</p>
              <p><strong>Fiber:</strong> ${meal.fiber}g</p>
              <p><strong>Sodium:</strong> ${meal.sodium}mg</p>
            </div>
          </div>
          <div class="ingredients-section">
            <h4>Ingredients</h4>
            <p>${meal.ingredients.join(", ")}</p>
          </div>
          <div class="meal-actions">
            <select class="meal-time-select">
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="snack">Snack</option>
              <option value="dinner">Dinner</option>
            </select>
            <button onclick="addMealToDashboard(this)" data-meal='${JSON.stringify(meal)}'>
              Add to Dashboard
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(mealCard);
  });
}

// Activity Log
function updateActivityLog() {
  const activities = [
    "Morning Run - 30 mins",
    "Yoga Session - 20 mins",
    "Weight Training - 45 mins",
    "Evening Walk - 25 mins"
  ];

  const logContainer = document.getElementById("activityLog");
  logContainer.innerHTML = activities
    .map(activity => `
      <div class="activity-item">
        <i class="fas fa-check-circle"></i>
        ${activity}
      </div>
    `)
    .join("");
}

// Meal Management
function initMealStorage() {
  if (!localStorage.getItem('todaysMeals')) {
    localStorage.setItem('todaysMeals', JSON.stringify({
      breakfast: { name: 'Breakfast', description: '', calories: 0, image: '' },
      lunch: { name: 'Lunch', description: '', calories: 0, image: '' },
      snack: { name: 'Snack', description: '', calories: 0, image: '' },
      dinner: { name: 'Dinner', description: '', calories: 0, image: '' }
    }));
  }
}

function getTodaysMeals() {
  return JSON.parse(localStorage.getItem('todaysMeals'));
}

function saveTodaysMeals(meals) {
  localStorage.setItem('todaysMeals', JSON.stringify(meals));
  updateTodayMeals();
  updateTotalCalories();
}

function updateTodayMeals() {
  const meals = getTodaysMeals();
  const mealsContainer = document.getElementById("todayMeals");
  
  mealsContainer.innerHTML = Object.entries(meals)
    .map(([type, meal]) => `
      <div class="meal-item">
        ${meal.image ? `<img src="${meal.image}" alt="${meal.name}" class="meal-thumbnail">` : ''}
        <h4>${meal.name}</h4>
        <p>${meal.description || 'No meal added yet'}</p>
        <p class="calories">${meal.calories} calories</p>
      </div>
    `)
    .join("");
}

function addMealToDashboard(button) {
  const mealData = JSON.parse(button.getAttribute('data-meal'));
  const mealTime = button.parentElement.querySelector('.meal-time-select').value;
  
  const todaysMeals = getTodaysMeals();
  todaysMeals[mealTime] = {
    name: todaysMeals[mealTime].name,
    description: mealData.name,
    calories: mealData.calories,
    image: mealData.image
  };
  
  saveTodaysMeals(todaysMeals);
  showNotification(`Added ${mealData.name} to ${mealTime}`, 'success');
}

function updateTotalCalories() {
  const meals = getTodaysMeals();
  const totalCalories = Object.values(meals).reduce((sum, meal) => sum + (meal.calories || 0), 0);
  
  updateStatCard(0, `${totalCalories} / 2000 kcal`, (totalCalories / 2000) * 100);
  
  const stats = getStats();
  stats.calories = totalCalories;
  localStorage.setItem("healthStats", JSON.stringify(stats));
}

// Notification System
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type} animate__animated animate__fadeIn`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.remove("animate__fadeIn");
    notification.classList.add("animate__fadeOut");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initMealStorage();
  const stats = getStats();
  updateStatCard(0, `${stats.calories} / 2000 kcal`, (stats.calories / 2000) * 100);
  updateStatCard(1, `${stats.steps} / 10000 steps`, (stats.steps / 10000) * 100);
  updateStatCard(2, `${stats.water} / 8 glasses`, (stats.water / 8) * 100);
  updateStatCard(3, `${stats.sleep} / 8 hours`, (stats.sleep / 8) * 100);
  updateActivityLog();
  updateTodayMeals();
});