/*
 * Student Record Manager - C / Data Structures Project
 * Features: linked-list CRUD, search, sorting, and CSV persistence.
 * Build: gcc -std=c11 -Wall -Wextra -Wpedantic -O2 src/main.c -o student_manager
 * Run:   ./student_manager
 */
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define DATA_FILE "students.csv"
#define NAME_LEN 80
#define LINE_LEN 256

typedef struct Student {
    int id;
    char name[NAME_LEN];
    float marks;
    struct Student *next;
} Student;

static Student *head = NULL;

static void trim_newline(char *s) {
    s[strcspn(s, "\r\n")] = '\0';
}

static int read_line(const char *prompt, char *buffer, size_t size) {
    printf("%s", prompt);
    if (!fgets(buffer, (int)size, stdin)) return 0;
    trim_newline(buffer);
    return 1;
}

static int read_int(const char *prompt, int *out) {
    char buffer[64], *end;
    long value;
    if (!read_line(prompt, buffer, sizeof buffer)) return 0;
    value = strtol(buffer, &end, 10);
    while (isspace((unsigned char)*end)) end++;
    if (buffer[0] == '\0' || *end != '\0' || value < -2147483647L || value > 2147483647L) {
        puts("Please enter a valid integer.");
        return -1;
    }
    *out = (int)value;
    return 1;
}

static int read_float(const char *prompt, float *out) {
    char buffer[64], *end;
    float value;
    if (!read_line(prompt, buffer, sizeof buffer)) return 0;
    value = strtof(buffer, &end);
    while (isspace((unsigned char)*end)) end++;
    if (buffer[0] == '\0' || *end != '\0' || value < 0.0f || value > 100.0f) {
        puts("Enter marks between 0 and 100.");
        return -1;
    }
    *out = value;
    return 1;
}

static Student *find_student(int id) {
    for (Student *cur = head; cur; cur = cur->next)
        if (cur->id == id) return cur;
    return NULL;
}

static void save_records(void) {
    FILE *fp = fopen(DATA_FILE, "w");
    if (!fp) {
        perror("Could not save records");
        return;
    }
    for (Student *cur = head; cur; cur = cur->next)
        fprintf(fp, "%d|%s|%.2f\n", cur->id, cur->name, cur->marks);
    fclose(fp);
}

static void load_records(void) {
    FILE *fp = fopen(DATA_FILE, "r");
    char line[LINE_LEN];
    if (!fp) return; /* First run: no data file yet. */

    while (fgets(line, sizeof line, fp)) {
        char *id_text = strtok(line, "|");
        char *name = strtok(NULL, "|");
        char *marks_text = strtok(NULL, "|\r\n");
        if (!id_text || !name || !marks_text) continue;

        char *end_id, *end_marks;
        long id = strtol(id_text, &end_id, 10);
        float marks = strtof(marks_text, &end_marks);
        if (*end_id || *end_marks || id <= 0 || id > 2147483647L ||
            marks < 0.0f || marks > 100.0f || find_student((int)id)) continue;

        Student *node = calloc(1, sizeof *node);
        if (!node) {
            puts("Memory allocation failed while loading records.");
            break;
        }
        node->id = (int)id;
        snprintf(node->name, sizeof node->name, "%s", name);
        node->marks = marks;
        node->next = head;
        head = node;
    }
    fclose(fp);
}

static void add_student(void) {
    int id, status;
    float marks;
    char name[NAME_LEN];

    status = read_int("Student ID: ", &id);
    if (status <= 0) return;
    if (id <= 0) { puts("ID must be positive."); return; }
    if (find_student(id)) { puts("That ID already exists."); return; }

    if (!read_line("Student name (do not use |): ", name, sizeof name)) return;
    if (name[0] == '\0' || strchr(name, '|')) {
        puts("Name cannot be empty or contain '|'.");
        return;
    }
    status = read_float("Marks (0-100): ", &marks);
    if (status <= 0) return;

    Student *node = malloc(sizeof *node);
    if (!node) { puts("Memory allocation failed."); return; }
    node->id = id;
    snprintf(node->name, sizeof node->name, "%s", name);
    node->marks = marks;
    node->next = head;
    head = node;
    save_records();
    puts("Record added and saved.");
}

static void list_students(void) {
    if (!head) { puts("No records found."); return; }
    puts("\nID      NAME                                                     MARKS");
    puts("--------------------------------------------------------------------------");
    for (Student *cur = head; cur; cur = cur->next)
        printf("%-7d %-56s %6.2f\n", cur->id, cur->name, cur->marks);
}

static void search_student(void) {
    int id, status = read_int("Enter ID to search: ", &id);
    if (status <= 0) return;
    Student *s = find_student(id);
    if (!s) { puts("Record not found."); return; }
    printf("ID: %d | Name: %s | Marks: %.2f\n", s->id, s->name, s->marks);
}

static void update_student(void) {
    int id, status = read_int("Enter ID to update: ", &id);
    if (status <= 0) return;
    Student *s = find_student(id);
    if (!s) { puts("Record not found."); return; }

    char name[NAME_LEN];
    float marks;
    if (!read_line("New name (leave blank to keep current): ", name, sizeof name)) return;
    if (strchr(name, '|')) { puts("Name cannot contain '|'."); return; }
    if (name[0] != '\0') snprintf(s->name, sizeof s->name, "%s", name);
    status = read_float("New marks (0-100): ", &marks);
    if (status <= 0) return;
    s->marks = marks;
    save_records();
    puts("Record updated and saved.");
}

static void delete_student(void) {
    int id, status = read_int("Enter ID to delete: ", &id);
    if (status <= 0) return;

    Student **link = &head;
    while (*link && (*link)->id != id) link = &(*link)->next;
    if (!*link) { puts("Record not found."); return; }

    Student *removed = *link;
    *link = removed->next;
    free(removed);
    save_records();
    puts("Record deleted and saved.");
}

static void sort_by_marks(void) {
    /* Insertion sort on the linked list; descending marks, then ascending ID. */
    Student *sorted = NULL;
    while (head) {
        Student *node = head;
        head = head->next;
        Student **pos = &sorted;
        while (*pos && ((*pos)->marks > node->marks ||
               ((*pos)->marks == node->marks && (*pos)->id < node->id)))
            pos = &(*pos)->next;
        node->next = *pos;
        *pos = node;
    }
    head = sorted;
    puts("Records sorted by marks (highest first).");
    list_students();
}

static void free_records(void) {
    while (head) {
        Student *next = head->next;
        free(head);
        head = next;
    }
}

int main(void) {
    int choice, status;
    load_records();
    puts("==================================");
    puts("       STUDENT RECORD MANAGER");
    puts("==================================");

    for (;;) {
        puts("\n1. Add record\n2. List records\n3. Search by ID\n4. Update record");
        puts("5. Delete record\n6. Sort by marks\n0. Exit");
        status = read_int("Choose an option: ", &choice);
        if (status == 0) break;
        if (status < 0) continue;

        switch (choice) {
            case 1: add_student(); break;
            case 2: list_students(); break;
            case 3: search_student(); break;
            case 4: update_student(); break;
            case 5: delete_student(); break;
            case 6: sort_by_marks(); break;
            case 0: save_records(); free_records(); puts("Goodbye."); return 0;
            default: puts("Unknown option. Choose 0-6.");
        }
    }
    save_records();
    free_records();
    return 0;
}
