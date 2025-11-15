# University Timetable Scheduler using Genetic Algorithm (GA)

## **Full Workflow Explained in Bangla**

Genetic Algorithm (GA) ব্যবহার করে University Timetable Scheduler তৈরি করা একটি শক্তিশালী ও বাস্তবমুখী সমস্যা সমাধান। নিচে সহজ বাংলায় পুরো workflow ব্যাখ্যা করা হলো।

---

# 🧠 Genetic Algorithm Workflow (Bangla Explanation)

GA হলো nature-এর evolution process (selection, reproduction, mutation) থেকে অনুপ্রাণিত একটি optimization algorithm। এটি ধীরে ধীরে best possible solution খুঁজে বের করে।

---

# 🧩 Step 1: Problem Modeling (Chromosome তৈরি)

একটি **chromosome** হলো একটি complete সম্ভাব্য "Timetable"।

### Gene → একটি class

### Chromosome → সব class মিলিয়ে তৈরি করা full schedule

| Gene Field | Example        | অর্থ       |
| ---------- | -------------- | ---------- |
| Course     | CS301 (AI)     | কোন course |
| Professor  | Dr. Smith      | কে পড়াচ্ছে |
| Room       | B-205          | কোন রুমে   |
| Time Slot  | Mon 9:00-10:00 | কখন ক্লাস  |

একটি Gene পুরো একটি ক্লাসের তথ্য ধরে রাখে। অনেকগুলো Gene মিলেই একটি Chromosome তৈরি হয়।

---

# 🚫 Step 2: Constraints (Rule/শর্ত)

Constraints নির্ধারণ করে কোন schedule ভালো এবং কোনটি খারাপ।

### **Hard Constraints (অবশ্যই মানতে হবে)**

Penalty: +100 প্রতি violation

* একই রুমে একই সময়ে দুইটা ক্লাস
* একই সময়ে একজন প্রফেসরের দুইটা ক্লাস
* রুম capacity < ছাত্র সংখ্যা

### **Soft Constraints (পছন্দনীয়)**

Penalty: +10 প্রতি violation

* প্রফেসরের unavailable slot-এ ক্লাস
* একজন প্রফেসরের একদিনে ৫ ঘণ্টার বেশি পড়ানো

---

# 🧮 Step 3: Fitness Function

Fitness বলে দেয় schedule কতটা ভালো।

[
Fitness = \frac{1}{1 + TotalPenaltyPoints}
]

| Penalty | Fitness     |
| ------- | ----------- |
| 0       | 1 (Perfect) |
| 50      | 0.02        |
| 500     | 0.002       |

Penalty যত কম, fitness তত বেশি।

---

# 🔁 Step 4: Genetic Operators

GA population নিয়ে কাজ করে। উদাহরণ: 50টা random timetable।

## **1. Selection (Parents নির্বাচন)**

* Best fitness schedules বেছে নেয়া
* "Elitism" = best solution রেখে দেয়া
* "Roulette Wheel Selection" = ভালো fitness হলে বেশি chance

## **2. Crossover (দুই Parent → Child)**

* Parent A + Parent B মিশিয়ে নতুন child তৈরি
* Two-point crossover ব্যবহার করা হয়

## **3. Mutation (Random Change)**

* Randomভাবে room/time/professor বদলে দেয়া
* GA কে local minimum থেকে বের হতে সাহায্য করে

---

# ⚙️ Step 5: Workflow Summary

1. Random initial population তৈরি
2. প্রতিটির fitness calculate
3. Best parents নির্বাচন
4. Crossover → new children
5. Mutation → random পরিবর্তন
6. নতুন population তৈরি
7. 500+ generations চলতে থাকে
8. Fitness ধীরে ধীরে বাড়ে → perfect schedule

---

# 💻 Step 6: HTML/JS Implementation Flow

"Start Evolution" চাপলেই:

1. 50 random timetable তৈরি হয়
2. প্রতিটির penalty → fitness বের হয়
3. 500 generation চলতে থাকে
4. Best fitness increase হয়
5. শেষে best schedule table এ দেখানো হয়

---

# 🚀 Step 7: Next Project Improvements

* Soft constraints যোগ করা
* User input থেকে courses, rooms, professor upload
* Chart.js দিয়ে fitness graph দেখানো
* PDF/Excel export

---

# 🧭 সারসংক্ষেপ

| Step          | কাজ                              |
| ------------- | -------------------------------- |
| Problem Model | Gene + Chromosome ডিজাইন         |
| Constraints   | Rule ভাঙলে penalty               |
| Fitness       | penalty কম → fitness বেশি        |
| GA Operators  | Selection + Crossover + Mutation |
| Evolution     | ধীরে ধীরে better schedule তৈরি   |

---
