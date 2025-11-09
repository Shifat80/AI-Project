// --- Configuration and Data ---
const POPULATION_SIZE = 50;
const GENERATIONS = 500;
const MUTATION_RATE = 0.05; // 5% chance per gene
const ELITISM_COUNT = 2; // Keep the top 2 individuals unchanged

// Hardcoded entities for simplification
let COURSES, PROFESSORS, ROOMS, TIMESLOTS, LECTURES;

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    COURSES = data.COURSES;
    PROFESSORS = data.PROFESSORS;
    ROOMS = data.ROOMS;
    TIMESLOTS = data.TIMESLOTS;
    LECTURES = data.LECTURES;

    // Initialize event listener
    document
      .getElementById("start-button")
      .addEventListener("click", startEvolution);
    document.getElementById("pop-size").textContent = POPULATION_SIZE;
  });

// --- Main GA Loop and UI Integration ---

let isRunning = false;
let bestSchedule = null;
let population = [];
let generationCount = 0;

function runGeneration(currentPopulation) {
  // 1. Evaluate Population
  let evaluatedPopulation = currentPopulation.map((schedule) => {
    const { fitness, penalty } = calculateFitness(schedule);
    return { schedule, fitness, penalty };
  });

  // Sort and update the global best schedule
  evaluatedPopulation.sort((a, b) => b.fitness - a.fitness);
  const currentBest = evaluatedPopulation[0];

  if (!bestSchedule || currentBest.fitness > bestSchedule.fitness) {
    bestSchedule = currentBest;
  }

  // Update UI with the best result found so far
  generationCount++;
  document.getElementById("generation").textContent = generationCount;
  document.getElementById("best-fitness").textContent =
    bestSchedule.fitness.toFixed(5);
  document.getElementById("penalty-points").textContent =
    bestSchedule.penalty;
  renderSchedule(bestSchedule.schedule, generationCount);

  // Stop condition
  if (generationCount >= GENERATIONS || bestSchedule.fitness === 1) {
    isRunning = false;
    document.getElementById("start-button").textContent =
      "Evolution Complete";
    document.getElementById("start-button").disabled = true;
    return;
  }

  // 2. Selection and Next Generation Preparation
  const nextGeneration = selection(evaluatedPopulation);
  const newPopulation = nextGeneration.slice(0, ELITISM_COUNT); // Preserve elite members

  // 3. Crossover and Mutation for the rest
  while (newPopulation.length < POPULATION_SIZE) {
    const parentA = getRandomElement(nextGeneration);
    const parentB = getRandomElement(nextGeneration);
    let offspring = crossover(parentA, parentB);
    offspring = mutation(offspring);
    newPopulation.push(offspring);
  }

  // Continue evolution
  if (isRunning) {
    setTimeout(() => runGeneration(newPopulation), 0); // Use setTimeout to prevent blocking the UI
  }
}

function startEvolution() {
  if (isRunning) return;
  isRunning = true;
  generationCount = 0;
  bestSchedule = null;
  document.getElementById("start-button").textContent = "Evolving...";
  document.getElementById("start-button").disabled = false;
  population = initializePopulation();
  runGeneration(population);
}

// --- Rendering Functions ---

/**
 * Renders the best timetable in a table format, grouping by Time Slot.
 * @param {Array} schedule - The best schedule found.
 * @param {number} gen - The generation count.
 */
function renderSchedule(schedule, gen) {
  const outputDiv = document.getElementById("schedule-output");
  const scheduleGenSpan = document.getElementById("best-schedule-gen");
  scheduleGenSpan.textContent = gen;

  // Group by Time Slot for better visualization
  const timeSlots = {};
  schedule.forEach((lecture) => {
    const profName = PROFESSORS.find(
      (p) => p.id === lecture.professor
    ).name;
    const roomCap = getRoomCapacity(lecture.room);
    const courseName = getCourseDetails(lecture.course).name;

    if (!timeSlots[lecture.timeSlot]) {
      timeSlots[lecture.timeSlot] = [];
    }
    timeSlots[lecture.timeSlot].push({
      course: courseName,
      room: `${lecture.room} (Cap: ${roomCap})`,
      prof: profName,
    });
  });

  let tableHTML = `
          <table class="min-w-full divide-y divide-gray-200 mt-4 rounded-xl overflow-hidden">
              <thead class="bg-indigo-50">
                  <tr>
                      <th class="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slot</th>
                      <th class="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th class="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Professor</th>
                      <th class="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
      `;

  // Sort time slots for consistent display
  const sortedTimeSlots = Object.keys(timeSlots).sort();

  sortedTimeSlots.forEach((timeSlot) => {
    timeSlots[timeSlot].forEach((lecture, index) => {
      tableHTML += `
                  <tr class="${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }">
                      <td class="whitespace-nowrap font-semibold text-gray-800">${timeSlot}</td>
                      <td class="whitespace-nowrap">${lecture.course}</td>
                      <td class="whitespace-nowrap">${lecture.prof}</td>
                      <td class="whitespace-nowrap">${lecture.room}</td>
                  </tr>
              `;
    });
  });

  tableHTML += `</tbody></table>`;
  outputDiv.innerHTML = tableHTML;
}