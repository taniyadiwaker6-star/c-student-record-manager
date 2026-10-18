# Student Record Manager (C)

A menu-driven command-line project demonstrating C fundamentals, pointers,
dynamic memory allocation, linked lists, file I/O, searching, sorting, and
input validation.

## Features
- Add, list, search, update, and delete student records
- Store records in `students.csv` between runs
- Search records by unique student ID
- Sort by marks (descending) with ID as a tie-breaker
- Validate IDs and marks; handle missing files and allocation failures

## Requirements
- GCC or another C11-compatible compiler
- Linux, macOS, or Windows with a C compiler installed

## Build and run
From this project directory:

```bash
gcc -std=c11 -Wall -Wextra -Wpedantic -O2 src/main.c -o student_manager
./student_manager
```

On Windows, run `student_manager.exe` after compiling with an appropriate compiler.

## Concepts demonstrated
- `struct`, pointers, and dynamic memory (`malloc`, `calloc`, `free`)
- Singly linked-list operations
- Linear search and insertion sort
- File persistence and basic input validation
- Modular functions and compiler warnings

## Data format
The application creates `students.csv` in the current working directory.
Each line uses `ID|Name|Marks`. Names must not contain the `|` character.

## Suggested manual tests
1. Add two records and list them.
2. Try adding a duplicate ID.
3. Search for an existing and a missing ID.
4. Update and delete a record.
5. Sort records with different marks.
6. Exit and restart to verify persistence.

## Resume bullet (use after you build and test it)
**Student Record Manager | C, Data Structures, File I/O**
- Built a menu-driven C application using linked lists and dynamic memory
  to add, search, update, delete, and sort student records.
- Implemented file persistence, input validation, and insertion sort to
  retain records across runs and order them by marks.

Only list features you have personally compiled, tested, and can explain.
