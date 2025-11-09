import random

# ----- Data Setup -----
courses = ['C1', 'C2', 'C3']
teachers = ['T1', 'T2', 'T3']
rooms = ['R1', 'R2']
times = ['Morning', 'Afternoon']

# ----- Helper Functions -----
def create_schedule():
    """Create a random schedule"""
    schedule = []
    for c in courses:
        entry = {
            'course': c,
            'teacher': random.choice(teachers),
            'room': random.choice(rooms),
            'time': random.choice(times)
        }
        schedule.append(entry)
    return schedule

def fitness(schedule):
    """Evaluate schedule quality"""
    score = 0
    conflicts = 0

    for i in range(len(schedule)):
        for j in range(i + 1, len(schedule)):
            # Conflict: same time + same room
            if schedule[i]['time'] == schedule[j]['time'] and schedule[i]['room'] == schedule[j]['room']:
                conflicts += 1
            # Conflict: same time + same teacher
            if schedule[i]['time'] == schedule[j]['time'] and schedule[i]['teacher'] == schedule[j]['teacher']:
                conflicts += 1

    score = 1 / (1 + conflicts)  # higher score = fewer conflicts
    return score

def crossover(parent1, parent2):
    """Combine parts of two schedules"""
    child = []
    for i in range(len(courses)):
        if random.random() > 0.5:
            child.append(parent1[i])
        else:
            child.append(parent2[i])
    return child

def mutate(schedule):
    """Randomly change a teacher, room, or time"""
    index = random.randint(0, len(schedule) - 1)
    schedule[index]['teacher'] = random.choice(teachers)
    schedule[index]['room'] = random.choice(rooms)
    schedule[index]['time'] = random.choice(times)
    return schedule

# ----- Genetic Algorithm -----
def genetic_algorithm(generations=100, population_size=10):
    population = [create_schedule() for _ in range(population_size)]

    for generation in range(generations):
        # Evaluate fitness
        population = sorted(population, key=lambda s: fitness(s), reverse=True)
        best = population[0]

        print(f"Generation {generation+1} | Best fitness: {fitness(best):.3f}")

        # Stop if perfect
        if fitness(best) == 1.0:
            print("✅ Perfect schedule found!")
            break

        # Selection (top 50%)
        parents = population[:population_size // 2]

        # Crossover + Mutation
        next_generation = []
        while len(next_generation) < population_size:
            p1, p2 = random.sample(parents, 2)
            child = crossover(p1, p2)
            if random.random() < 0.3:  # 30% chance to mutate
                child = mutate(child)
            next_generation.append(child)

        population = next_generation

    return best

# ----- Run -----
best_schedule = genetic_algorithm()

# ----- Show Result -----
print("\nBest Schedule Found:")
for entry in best_schedule:
    print(f"Course: {entry['course']} | Teacher: {entry['teacher']} | Room: {entry['room']} | Time: {entry['time']}")
