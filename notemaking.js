const API_URL = "/api/notes"; // Placeholder; use your real endpoint

function getSessionToken() {
  // Example: Replace with your own session logic if needed
  return localStorage.getItem("sessionToken");
}

function showToast(msg, ok = true) {
  alert(msg);
}

function renderNotes(notes) {
  const list = document.getElementById('notes-list');
  list.innerHTML = '';
  if (!notes.length) {
    list.innerHTML = "<div class='note-card'>No notes found!</div>";
    return;
  }
  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = "note-card";
    card.innerHTML = `
      <div class="note-header">
        <div class="note-title">${note.title}</div>
        <span class="note-meta">${note.created_at ? new Date(note.created_at).toLocaleString() : ""}</span>
      </div>
      ${note.tags ? `<div class="note-tags"><i class="fas fa-tag"></i> ${note.tags.join(', ')}</div>` : ""}
      <div class="note-content">${note.content}</div>
      <span class="note-priority priority-${note.priority || 'normal'}">${note.priority || 'normal'}</span>
      <div class="note-actions">
        <button class="edit-note-btn" data-id="${note.id}"><i class="fas fa-edit"></i> Edit</button>
        <button class="delete-note-btn" data-id="${note.id}"><i class="fas fa-trash"></i> Delete</button>
      </div>
    `;
    list.appendChild(card);
  });
}

function loadNotes() {
  fetch(API_URL, { credentials: "include" })
    .then(r => r.json())
    .then(data => {
      renderNotes(data.notes || []);
    })
    .catch(() => renderNotes([]));
}

function handleFormSubmit(event) {
  event.preventDefault();
  const id = document.getElementById("note-id").value;
  const title = document.getElementById("note-title").value.trim();
  const tags = document.getElementById("note-tags").value.split(",").map(t => t.trim()).filter(t => t);
  const priority = document.getElementById("note-priority").value;
  const content = document.getElementById("note-content").value.trim();
  if (!title || !content) return showToast("Title and content required.", false);
  const method = id ? "PATCH" : "POST";
  const url = id ? `${API_URL}/${id}` : API_URL;
  fetch(url, {
    method,
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, tags, priority, content })
  })
    .then(r => r.json())
    .then(data => {
      showToast("Note saved!");
      document.getElementById("note-form").reset();
      document.getElementById("note-id").value = "";
      loadNotes();
    })
    .catch(() => showToast("Error saving note.", false));
}

function handleEditDelete(e) {
  const id = e.target.closest("button")?.dataset?.id;
  if (!id) return;
  if (e.target.closest(".edit-note-btn")) {
    fetch(`${API_URL}/${id}`, { credentials: "include" })
      .then(r => r.json())
      .then(note => {
        document.getElementById("note-id").value = note.id;
        document.getElementById("note-title").value = note.title;
        document.getElementById("note-tags").value = note.tags ? note.tags.join(", ") : "";
        document.getElementById("note-priority").value = note.priority || "normal";
        document.getElementById("note-content").value = note.content;
      });
  } else if (e.target.closest(".delete-note-btn")) {
    if (!confirm("Delete this note?")) return;
    fetch(`${API_URL}/${id}`, { method: "DELETE", credentials: "include" })
      .then(() => { showToast("Note deleted."); loadNotes(); })
      .catch(() => showToast("Error deleting.", false));
  }
}

document.getElementById("note-form").addEventListener("submit", handleFormSubmit);
document.getElementById("notes-list").addEventListener("click", handleEditDelete);
document.getElementById("note-form").addEventListener("reset", () => {
  document.getElementById("note-id").value = "";
});

document.querySelectorAll('.logout-link').forEach(el => el.addEventListener('click', () => {
  fetch("/logout", {method: "POST", credentials: "include"}).then(()=>{
    localStorage.removeItem("loggedInUser");
    window.location.href="login.html";
  });
}));

loadNotes();
