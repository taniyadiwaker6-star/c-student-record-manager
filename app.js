/**
 * Student Record Manager - Web & Linked List Simulator
 * Replicates the exact behavior of src/main.c in JavaScript:
 * - Singly Linked List (head -> node -> next)
 * - CRUD operations: Add, List, Search by ID, Update, Delete
 * - Insertion sort by marks (descending) with ID as tie-breaker
 * - CSV persistence (ID|Name|Marks) compatible with students.csv
 * - Interactive C CLI terminal simulator
 */

class StudentNode {
  constructor(id, name, marks) {
    this.id = parseInt(id, 10);
    this.name = String(name).trim();
    this.marks = parseFloat(marks);
    this.next = null;
  }
}

class StudentLinkedList {
  constructor() {
    this.head = null;
  }

  // Find student by ID (returns node or null)
  find(id) {
    let cur = this.head;
    while (cur) {
      if (cur.id === id) return cur;
      cur = cur.next;
    }
    return null;
  }

  // Prepend to head (matches C: node->next = head; head = node;)
  add(id, name, marks) {
    if (this.find(id)) return false;
    const node = new StudentNode(id, name, marks);
    node.next = this.head;
    this.head = node;
    return true;
  }

  // Update existing record
  update(id, newName, newMarks) {
    const node = this.find(id);
    if (!node) return false;
    if (newName && newName.trim() !== '') node.name = newName.trim();
    if (newMarks !== undefined && !isNaN(newMarks)) node.marks = parseFloat(newMarks);
    return true;
  }

  // Delete record by ID
  delete(id) {
    let link = null;
    let cur = this.head;
    while (cur && cur.id !== id) {
      link = cur;
      cur = cur.next;
    }
    if (!cur) return false;
    if (link === null) {
      this.head = cur.next;
    } else {
      link.next = cur.next;
    }
    return true;
  }

  // Insertion sort: descending marks, tie-breaker ascending ID (matches C sort_by_marks)
  sortByMarks() {
    let sorted = null;
    let cur = this.head;
    while (cur) {
      const nextNode = cur.next;
      if (!sorted || sorted.marks < cur.marks || (sorted.marks === cur.marks && sorted.id > cur.id)) {
        cur.next = sorted;
        sorted = cur;
      } else {
        let pos = sorted;
        while (
          pos.next &&
          (pos.next.marks > cur.marks || (pos.next.marks === cur.marks && pos.next.id < cur.id))
        ) {
          pos = pos.next;
        }
        cur.next = pos.next;
        pos.next = cur;
      }
      cur = nextNode;
    }
    this.head = sorted;
  }

  // Convert linked list to Array for rendering
  toArray() {
    const list = [];
    let cur = this.head;
    while (cur) {
      list.push({ id: cur.id, name: cur.name, marks: cur.marks });
      cur = cur.next;
    }
    return list;
  }

  // Clear all nodes
  clear() {
    this.head = null;
  }

  // Export to CSV format (ID|Name|Marks)
  toCSV() {
    let cur = this.head;
    let out = '';
    while (cur) {
      out += `${cur.id}|${cur.name}|${cur.marks.toFixed(2)}\n`;
      cur = cur.next;
    }
    return out;
  }

  // Load from CSV string
  fromCSV(csvText) {
    this.clear();
    const lines = csvText.split(/\r?\n/);
    // Reverse lines to maintain order when prepending to head
    const validRows = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split('|');
      if (parts.length >= 3) {
        const id = parseInt(parts[0], 10);
        const name = parts[1].trim();
        const marks = parseFloat(parts[2]);
        if (!isNaN(id) && id > 0 && name && !isNaN(marks) && marks >= 0 && marks <= 100) {
          validRows.push({ id, name, marks });
        }
      }
    }
    // Insert so first in file appears first in list
    for (let i = validRows.length - 1; i >= 0; i--) {
      this.add(validRows[i].id, validRows[i].name, validRows[i].marks);
    }
  }
}

// Global Application State
const studentList = new StudentLinkedList();
const STORAGE_KEY = 'c_student_records_csv';

const sampleStudents = [
  { id: 101, name: 'Alice Johnson', marks: 94.5 },
  { id: 102, name: 'Bob Smith', marks: 82.0 },
  { id: 103, name: 'Charlie Brown', marks: 76.25 },
  { id: 104, name: 'Diana Prince', marks: 98.0 },
  { id: 105, name: 'Ethan Hunt', marks: 63.5 },
  { id: 106, name: 'Fiona Gallagher', marks: 38.0 }
];

// Helper: Determine Grade
function getGrade(marks) {
  if (marks >= 90) return { letter: 'A+', class: 'badge-success' };
  if (marks >= 80) return { letter: 'A', class: 'badge-success' };
  if (marks >= 70) return { letter: 'B', class: 'badge-info' };
  if (marks >= 60) return { letter: 'C', class: 'badge-warning' };
  if (marks >= 40) return { letter: 'D', class: 'badge-warning' };
  return { letter: 'F', class: 'badge-danger' };
}

// UI Elements
const form = document.getElementById('student-form');
const editIdInput = document.getElementById('edit-id');
const studentIdInput = document.getElementById('student-id');
const studentNameInput = document.getElementById('student-name');
const studentMarksInput = document.getElementById('student-marks');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

const tbody = document.getElementById('student-tbody');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const btnClearSearch = document.getElementById('btn-clear-search');
const btnSort = document.getElementById('btn-sort');
const btnToggleVis = document.getElementById('btn-toggle-visualizer');
const visContainer = document.getElementById('visualizer-container');
const visCanvas = document.getElementById('linked-list-canvas');

const statTotal = document.getElementById('stat-total');
const statAvg = document.getElementById('stat-avg');
const statTop = document.getElementById('stat-top');
const statPass = document.getElementById('stat-pass');

const btnExportCsv = document.getElementById('btn-export-csv');
const fileImportCsv = document.getElementById('file-import-csv');
const btnLoadSample = document.getElementById('btn-load-sample');
const btnLoadSampleEmpty = document.getElementById('btn-load-sample-empty');
const btnClearAll = document.getElementById('btn-clear-all');

const termOutput = document.getElementById('term-output');
const termInput = document.getElementById('term-input');
const btnTermSend = document.getElementById('btn-term-send');
const btnClearTerm = document.getElementById('btn-clear-term');

// Initialize from LocalStorage or Load Default Samples
function initData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && saved.trim() !== '') {
    studentList.fromCSV(saved);
  } else {
    loadSampleData();
  }
  render();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, studentList.toCSV());
}

function loadSampleData() {
  studentList.clear();
  // Reverse to maintain natural order
  for (let i = sampleStudents.length - 1; i >= 0; i--) {
    studentList.add(sampleStudents[i].id, sampleStudents[i].name, sampleStudents[i].marks);
  }
  saveData();
  showToast('Sample records loaded successfully.', 'success');
}

// Render Table, Metrics, and Linked List Visualizer
function render(filterQuery = '') {
  const records = studentList.toArray();
  const q = filterQuery.toLowerCase().trim();
  const filtered = q
    ? records.filter(r => r.id.toString().includes(q) || r.name.toLowerCase().includes(q))
    : records;

  // Render Table
  tbody.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach(r => {
      const grade = getGrade(r.marks);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="id-badge">#${r.id}</span></td>
        <td><strong>${escapeHtml(r.name)}</strong></td>
        <td><span class="marks-val">${r.marks.toFixed(2)}</span></td>
        <td><span class="badge ${grade.class}">${grade.letter}</span></td>
        <td style="text-align: right;">
          <div class="action-btns">
            <button class="btn-icon" onclick="startEdit(${r.id})" title="Edit Record">✏️</button>
            <button class="btn-icon delete" onclick="confirmDelete(${r.id})" title="Delete Record">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Update Stats
  const total = records.length;
  statTotal.textContent = total;
  if (total > 0) {
    const sum = records.reduce((acc, cur) => acc + cur.marks, 0);
    const avg = sum / total;
    statAvg.textContent = avg.toFixed(2);

    const top = records.reduce((max, cur) => (cur.marks > max.marks ? cur : max), records[0]);
    statTop.textContent = `${top.name.split(' ')[0]} (${top.marks.toFixed(1)})`;

    const passing = records.filter(r => r.marks >= 40).length;
    statPass.textContent = `${Math.round((passing / total) * 100)}%`;
  } else {
    statAvg.textContent = '0.00';
    statTop.textContent = '-';
    statPass.textContent = '0%';
  }

  // Render Linked List Canvas
  renderVisualizer(records);
}

function renderVisualizer(records) {
  visCanvas.innerHTML = '';
  const headLabel = document.createElement('div');
  headLabel.className = 'll-head-label';
  headLabel.innerHTML = '<strong>head</strong> &bull; ptr';
  visCanvas.appendChild(headLabel);

  if (records.length === 0) {
    const arrow = document.createElement('div');
    arrow.className = 'll-arrow';
    arrow.textContent = '→';
    visCanvas.appendChild(arrow);

    const nullBox = document.createElement('div');
    nullBox.className = 'll-null';
    nullBox.textContent = 'NULL';
    visCanvas.appendChild(nullBox);
    return;
  }

  records.forEach(r => {
    const arrow = document.createElement('div');
    arrow.className = 'll-arrow';
    arrow.textContent = '→';
    visCanvas.appendChild(arrow);

    const node = document.createElement('div');
    node.className = 'll-node';
    node.innerHTML = `
      <div class="ll-data">
        <div class="ll-data-id">ID: ${r.id}</div>
        <div class="ll-data-name">${escapeHtml(r.name)}</div>
        <div class="ll-data-marks">Marks: ${r.marks.toFixed(1)}</div>
      </div>
      <div class="ll-ptr" title="Pointer to next node in heap memory">*next</div>
    `;
    visCanvas.appendChild(node);
  });

  const arrow = document.createElement('div');
  arrow.className = 'll-arrow';
  arrow.textContent = '→';
  visCanvas.appendChild(arrow);

  const nullBox = document.createElement('div');
  nullBox.className = 'll-null';
  nullBox.textContent = 'NULL';
  visCanvas.appendChild(nullBox);
}

// Form Submission (Add or Update)
form.addEventListener('submit', e => {
  e.preventDefault();
  const editId = editIdInput.value;
  const id = parseInt(studentIdInput.value, 10);
  const name = studentNameInput.value.trim();
  const marks = parseFloat(studentMarksInput.value);

  if (name.includes('|')) {
    showToast("Name cannot contain '|' character.", 'danger');
    return;
  }

  if (editId) {
    // Update existing
    studentList.update(parseInt(editId, 10), name, marks);
    showToast(`Student #${editId} updated successfully.`, 'success');
    cancelEdit();
  } else {
    // Add new
    const success = studentList.add(id, name, marks);
    if (!success) {
      showToast(`Student ID ${id} already exists. Please choose a unique ID.`, 'danger');
      return;
    }
    showToast(`Student #${id} added to linked list.`, 'success');
    form.reset();
  }

  saveData();
  render(searchInput.value);
});

// Edit Handling
window.startEdit = function(id) {
  const student = studentList.find(id);
  if (!student) return;

  editIdInput.value = student.id;
  studentIdInput.value = student.id;
  studentIdInput.disabled = true; // ID cannot be modified in C struct
  studentNameInput.value = student.name;
  studentMarksInput.value = student.marks;

  formTitle.textContent = `✏️ Edit Student #${student.id}`;
  submitBtn.textContent = 'Save Changes';
  cancelBtn.style.display = 'inline-flex';
  studentNameInput.focus();
};

window.cancelEdit = function() {
  editIdInput.value = '';
  studentIdInput.disabled = false;
  form.reset();
  formTitle.textContent = '➕ Add Student Record';
  submitBtn.textContent = 'Save to Linked List';
  cancelBtn.style.display = 'none';
};

cancelBtn.addEventListener('click', cancelEdit);

// Delete Handling
window.confirmDelete = function(id) {
  const student = studentList.find(id);
  if (!student) return;
  if (confirm(`Are you sure you want to delete student #${id} (${student.name})?`)) {
    studentList.delete(id);
    saveData();
    render(searchInput.value);
    showToast(`Student #${id} deleted from records.`, 'warning');
  }
};

// Search handling
searchInput.addEventListener('input', e => {
  const val = e.target.value;
  btnClearSearch.style.display = val ? 'block' : 'none';
  render(val);
});

btnClearSearch.addEventListener('click', () => {
  searchInput.value = '';
  btnClearSearch.style.display = 'none';
  render();
});

// Sorting (C insertion sort)
btnSort.addEventListener('click', () => {
  studentList.sortByMarks();
  saveData();
  render(searchInput.value);
  showToast('Records sorted by marks (highest first).', 'success');
  appendTerminalOutput('Records sorted by marks (highest first).\n');
});

// Visualizer Toggle
btnToggleVis.addEventListener('click', () => {
  const isHidden = visContainer.style.display === 'none';
  visContainer.style.display = isHidden ? 'block' : 'none';
  btnToggleVis.classList.toggle('active', isHidden);
});

// Export CSV
btnExportCsv.addEventListener('click', () => {
  const csvContent = studentList.toCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'students.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('students.csv downloaded.', 'success');
});

// Import CSV
fileImportCsv.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    studentList.fromCSV(ev.target.result);
    saveData();
    render();
    showToast(`Imported records from ${file.name}.`, 'success');
  };
  reader.readAsText(file);
});

// Load Samples / Clear
btnLoadSample.addEventListener('click', () => {
  loadSampleData();
  render();
});
btnLoadSampleEmpty.addEventListener('click', () => {
  loadSampleData();
  render();
});

btnClearAll.addEventListener('click', () => {
  if (confirm('Clear all student records from memory?')) {
    studentList.clear();
    saveData();
    render();
    showToast('All records cleared.', 'danger');
  }
});

// Terminal Console Simulator
let termState = 'MENU';
let pendingId = null;
let pendingName = null;

function appendTerminalOutput(text) {
  const pre = termOutput.querySelector('pre');
  pre.textContent += text;
  termOutput.scrollTop = termOutput.scrollHeight;
}

function processTerminalCommand(cmd) {
  const input = cmd.trim();
  appendTerminalOutput(`\n> ${input}\n`);

  if (termState === 'MENU') {
    switch (input) {
      case '1':
        termState = 'ADD_ID';
        appendTerminalOutput('Student ID: ');
        break;
      case '2':
        listTerminalStudents();
        printTerminalMenu();
        break;
      case '3':
        termState = 'SEARCH_ID';
        appendTerminalOutput('Enter ID to search: ');
        break;
      case '4':
        termState = 'UPDATE_ID';
        appendTerminalOutput('Enter ID to update: ');
        break;
      case '5':
        termState = 'DELETE_ID';
        appendTerminalOutput('Enter ID to delete: ');
        break;
      case '6':
        studentList.sortByMarks();
        saveData();
        render();
        appendTerminalOutput('Records sorted by marks (highest first).\n');
        listTerminalStudents();
        printTerminalMenu();
        break;
      case '0':
        appendTerminalOutput('Goodbye.\n');
        break;
      default:
        appendTerminalOutput('Unknown option. Choose 0-6.\n');
        printTerminalMenu();
        break;
    }
  } else if (termState === 'ADD_ID') {
    const id = parseInt(input, 10);
    if (isNaN(id) || id <= 0) {
      appendTerminalOutput('ID must be positive.\n');
      termState = 'MENU';
      printTerminalMenu();
      return;
    }
    if (studentList.find(id)) {
      appendTerminalOutput('That ID already exists.\n');
      termState = 'MENU';
      printTerminalMenu();
      return;
    }
    pendingId = id;
    termState = 'ADD_NAME';
    appendTerminalOutput('Student name (do not use |): ');
  } else if (termState === 'ADD_NAME') {
    if (!input || input.includes('|')) {
      appendTerminalOutput("Name cannot be empty or contain '|'.\n");
      termState = 'MENU';
      printTerminalMenu();
      return;
    }
    pendingName = input;
    termState = 'ADD_MARKS';
    appendTerminalOutput('Marks (0-100): ');
  } else if (termState === 'ADD_MARKS') {
    const marks = parseFloat(input);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      appendTerminalOutput('Enter marks between 0 and 100.\n');
      termState = 'MENU';
      printTerminalMenu();
      return;
    }
    studentList.add(pendingId, pendingName, marks);
    saveData();
    render();
    appendTerminalOutput('Record added and saved.\n');
    termState = 'MENU';
    printTerminalMenu();
  } else if (termState === 'SEARCH_ID') {
    const id = parseInt(input, 10);
    const node = studentList.find(id);
    if (node) {
      appendTerminalOutput(`ID: ${node.id} | Name: ${node.name} | Marks: ${node.marks.toFixed(2)}\n`);
    } else {
      appendTerminalOutput('Record not found.\n');
    }
    termState = 'MENU';
    printTerminalMenu();
  } else if (termState === 'DELETE_ID') {
    const id = parseInt(input, 10);
    if (studentList.delete(id)) {
      saveData();
      render();
      appendTerminalOutput('Record deleted and saved.\n');
    } else {
      appendTerminalOutput('Record not found.\n');
    }
    termState = 'MENU';
    printTerminalMenu();
  } else if (termState === 'UPDATE_ID') {
    const id = parseInt(input, 10);
    const node = studentList.find(id);
    if (!node) {
      appendTerminalOutput('Record not found.\n');
      termState = 'MENU';
      printTerminalMenu();
      return;
    }
    pendingId = id;
    termState = 'UPDATE_NAME';
    appendTerminalOutput(`New name (leave blank to keep '${node.name}'): `);
  } else if (termState === 'UPDATE_NAME') {
    if (input.includes('|')) {
      appendTerminalOutput("Name cannot contain '|'.\n");
      termState = 'MENU';
      printTerminalMenu();
      return;
    }
    pendingName = input; // Empty string means keep current
    termState = 'UPDATE_MARKS';
    appendTerminalOutput('New marks (0-100): ');
  } else if (termState === 'UPDATE_MARKS') {
    const marks = parseFloat(input);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      appendTerminalOutput('Enter marks between 0 and 100.\n');
      termState = 'MENU';
      printTerminalMenu();
      return;
    }
    studentList.update(pendingId, pendingName, marks);
    saveData();
    render();
    appendTerminalOutput('Record updated and saved.\n');
    termState = 'MENU';
    printTerminalMenu();
  }
}

function listTerminalStudents() {
  const records = studentList.toArray();
  if (records.length === 0) {
    appendTerminalOutput('No records found.\n');
    return;
  }
  appendTerminalOutput('\nID      NAME                                                     MARKS\n');
  appendTerminalOutput('--------------------------------------------------------------------------\n');
  records.forEach(r => {
    const idStr = String(r.id).padEnd(7, ' ');
    const nameStr = r.name.length > 56 ? r.name.substring(0, 53) + '...' : r.name.padEnd(56, ' ');
    const marksStr = r.marks.toFixed(2).padStart(6, ' ');
    appendTerminalOutput(`${idStr} ${nameStr} ${marksStr}\n`);
  });
}

function printTerminalMenu() {
  appendTerminalOutput(`
1. Add record
2. List records
3. Search by ID
4. Update record
5. Delete record
6. Sort by marks
0. Exit

Choose an option (0-6): `);
}

// Terminal Event Listeners
btnTermSend.addEventListener('click', () => {
  const val = termInput.value;
  termInput.value = '';
  processTerminalCommand(val);
});

termInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const val = termInput.value;
    termInput.value = '';
    processTerminalCommand(val);
  }
});

btnClearTerm.addEventListener('click', () => {
  const pre = termOutput.querySelector('pre');
  pre.textContent = '';
  printTerminalMenu();
});

// Toast Helper
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 2800);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Run on page load
initData();
