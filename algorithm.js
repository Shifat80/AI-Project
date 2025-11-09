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