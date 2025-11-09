// --- Configuration and Data ---
const POPULATION_SIZE = 50;
const GENERATIONS = 500;
const MUTATION_RATE = 0.05; // 5% chance per gene
const ELITISM_COUNT = 2; // Keep the top 2 individuals unchanged

// Hardcoded entities for simplification
let COURSES, PROFESSORS, ROOMS, TIMESLOTS, LECTURES;

// --- Utility Functions ---
const getRandomElement = (array) =>
  array[Math.floor(Math.random() * array.length)];
const getCourseDetails = (id) => COURSES.find((c) => c.id === id);
const getRoomCapacity = (id) => ROOMS.find((r) => r.id === id).capacity;

// --- GA CORE LOGIC: Individual and Population ---

/**
 * 1. Initializes a single random timetable (Chromosome).
 * @returns {Array} A schedule (chromosome) with random room and time slot assignments.
 */
function initializeIndividual() {
  return LECTURES.map((lecture) => ({
    ...lecture,
    room: getRandomElement(ROOMS).id,
    timeSlot: getRandomElement(TIMESLOTS),
  }));
}

/**
 * Creates the initial population of random individuals.
 * @returns {Array<Array>} The initial population.
 */
function initializePopulation() {
  return Array.from({ length: POPULATION_SIZE }, initializeIndividual);
}

/**
 * 2. Calculates the fitness score for a single timetable (Chromosome).
 * Fitness = 1 / (1 + Penalty)
 * @param {Array} schedule - The timetable to evaluate.
 * @returns {Object} {fitness, penalty}
 */
function calculateFitness(schedule) {
  let penalty = 0;
  const hardPenalty = 100;

  // Map to track resource usage: {timeSlot-room: count, timeSlot-prof: count}
  const resourceClashMap = {};

  schedule.forEach((lecture) => {
    const roomCapacity = getRoomCapacity(lecture.room);
    const courseEnrollment = getCourseDetails(lecture.course).enrollment;

    // --- HARD CONSTRAINT 1: Capacity Overflow ---
    if (courseEnrollment > roomCapacity) {
      penalty += hardPenalty;
    }

    // --- HARD CONSTRAINT 2 & 3: Resource Clashes (Room/Time and Prof/Time) ---
    const roomKey = `${lecture.timeSlot}-${lecture.room}`;
    const profKey = `${lecture.timeSlot}-${lecture.professor}`;

    resourceClashMap[roomKey] = (resourceClashMap[roomKey] || 0) + 1;
    resourceClashMap[profKey] = (resourceClashMap[profKey] || 0) + 1;
  });

  // Calculate penalties for resource clashes (where count > 1)
  for (const key in resourceClashMap) {
    if (resourceClashMap[key] > 1) {
      // Penalty is proportional to the degree of the clash (count - 1)
      penalty += hardPenalty * (resourceClashMap[key] - 1);
    }
  }

  // The fitness function aims to maximize the score, so we use an inverse relationship.
  const fitness = 1 / (1 + penalty);
  return { fitness, penalty };
}

/**
 * 3. Selects individuals for the next generation using Elitism and Roulette Wheel.
 * @param {Array} population - Array of {schedule, fitness, penalty} objects.
 * @returns {Array} The selected and ordered next generation.
 */
function selection(population) {
  // Sort by fitness (descending)
  population.sort((a, b) => b.fitness - a.fitness);

  // 1. Elitism: Keep the best individuals
  const nextGeneration = population
    .slice(0, ELITISM_COUNT)
    .map((p) => p.schedule);

  // 2. Roulette Wheel Selection for the rest of the population
  const totalFitness = population.reduce((sum, p) => sum + p.fitness, 0);

  // Create a temporary list of individuals to select from (excluding the elite)
  const selectionPool = population.slice(ELITISM_COUNT);

  while (nextGeneration.length < POPULATION_SIZE) {
    let randomPoint = Math.random() * totalFitness;
    let currentSum = 0;

    // Spin the wheel
    for (const individual of selectionPool) {
      currentSum += individual.fitness;
      if (currentSum >= randomPoint) {
        nextGeneration.push(individual.schedule);
        break;
      }
    }
  }
  return nextGeneration;
}

/**
 * 4. Combines two parent schedules (Crossover).
 * Uses a simple one-point crossover on the array of lectures.
 * @param {Array} parentA
 * @param {Array} parentB
 * @returns {Array} The new offspring schedule.
 */
function crossover(parentA, parentB) {
  const offspring = [];
  const crossoverPoint = Math.floor(Math.random() * parentA.length);

  // Take the first part from Parent A
  for (let i = 0; i < crossoverPoint; i++) {
    offspring.push(parentA[i]);
  }

  // Take the second part from Parent B
  for (let i = crossoverPoint; i < parentB.length; i++) {
    offspring.push(parentB[i]);
  }
  return offspring;
}

/**
 * 5. Mutates an individual schedule (Mutation).
 * Randomly changes the room, timeSlot, or professor of a lecture.
 * @param {Array} schedule
 * @returns {Array} The mutated schedule.
 */
function mutation(schedule) {
  return schedule.map((lecture) => {
    if (Math.random() < MUTATION_RATE) {
      // Decide what to mutate: room or timeSlot (professor is fixed by LECTURES array for simplicity)
      const mutationType = Math.random();

      if (mutationType < 0.5) {
        // Mutate Time Slot
        return { ...lecture, timeSlot: getRandomElement(TIMESLOTS) };
      } else {
        // Mutate Room
        return { ...lecture, room: getRandomElement(ROOMS).id };
      }
    }
    return lecture;
  });
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  document
    .getElementById("generate-button")
    .addEventListener("click", generateRoutine);
  document.getElementById("pop-size").textContent = POPULATION_SIZE;
});

function generateRoutine() {
  const dataInput = document.getElementById("data-input").value;
  try {
    const data = JSON.parse(dataInput);
    COURSES = data.COURSES;
    PROFESSORS = data.PROFESSORS;
    ROOMS = data.ROOMS;
    TIMESLOTS = data.TIMESLOTS;
    LECTURES = data.LECTURES;
    document.getElementById("schedule-output").innerHTML = '<p class="text-green-500">Data loaded successfully. Starting evolution...</p>';
    startEvolution();
  } catch (error) {
    alert("Invalid JSON format. Please check your input.");
    console.error("JSON parsing error:", error);
  }
}

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