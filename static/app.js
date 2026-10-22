const API = "/api/tasks";
const listEl = document.getElementById("task-list");
const emptyEl = document.getElementById("empty");
const formEl = document.getElementById("add-form");
const titleEl = document.getElementById("title");
const searchEl = document.getElementById("search");

let allTasks = [];
let filter = "all";
let query = "";

async function loadTasks() {
    const res = await fetch(API);
    allTasks = await res.json();
    applyFilters();
}

function applyFilters() {
    let shown = allTasks;
    if (filter === "active") shown = shown.filter(t => !t.done);
    if (filter === "done") shown = shown.filter(t => t.done);
    if (query) {
        const q = query.toLowerCase();
        shown = shown.filter(t => (t.title || "").toLowerCase().includes(q));
    }
    render(shown);
    updateStats();
}

function updateStats() {
    const total = allTasks.length;
    const done = allTasks.filter(t => t.done).length;
    document.getElementById("count-total").textContent = total;
    document.getElementById("count-done").textContent = done;
    document.getElementById("count-active").textContent = total - done;
}

function render(tasks) {
    listEl.innerHTML = "";
    emptyEl.classList.toggle("hidden", tasks.length > 0);

    tasks.forEach(t => {
        const li = document.createElement("li");
        li.className = "task" + (t.done ? " task-done" : "");

        // 1. Checkbox "выполнено"
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!t.done;
        checkbox.className = "task-checkbox";
        checkbox.onchange = () => toggleDone(t._id);

        // 2. Название + редактирование по двойному клику
        const title = document.createElement("span");
        title.className = "task-title";
        title.textContent = t.title;
        title.title = "Двойной клик — редактировать";
        title.ondblclick = () => renameTask(t._id, t.title);

        // 3. Вложение / превью
        const attachBox = document.createElement("span");
        attachBox.className = "attach-box";

        if (t.attachment) {
            const url = t.attachment.url;
            const cleanUrl = url.split("?")[0];
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(cleanUrl);

            if (isImage) {
                const img = document.createElement("img");
                img.src = url.replace("?dl=1", "?raw=1");
                img.className = "thumb";
                img.title = "Открыть: " + t.attachment.name;
                img.onclick = () => window.open(url, "_blank");
                img.onerror = () => {
                    // fallback: если raw не сработал — показываем ссылку
                    img.replaceWith(makeLink(url, t.attachment.name));
                };
                attachBox.appendChild(img);
            } else {
                attachBox.appendChild(makeLink(url, t.attachment.name));
            }
        } else {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.className = "file-input";
            fileInput.onchange = () => uploadAttachment(t._id, fileInput.files[0]);
            attachBox.appendChild(fileInput);
        }

        // 4. Удалить
        const del = document.createElement("button");
        del.textContent = "✕";
        del.className = "delete";
        del.title = "Удалить задачу";
        del.onclick = () => deleteTask(t._id);

        li.appendChild(checkbox);
        li.appendChild(title);
        li.appendChild(attachBox);
        li.appendChild(del);
        listEl.appendChild(li);
    });
}

function makeLink(url, name) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.textContent = "📎 " + name;
    return a;
}

async function toggleDone(id) {
    await fetch(`${API}/${id}`, { method: "PATCH" });
    loadTasks();
}

async function renameTask(id, currentTitle) {
    const newTitle = prompt("Новое название задачи:", currentTitle);
    if (newTitle === null) return;              // отмена
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === currentTitle) return;
    await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
    });
    loadTasks();
}

async function deleteTask(id) {
    if (!confirm("Удалить задачу?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadTasks();
}

async function uploadAttachment(taskId, file) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    await fetch(`${API}/${taskId}/attachment`, { method: "POST", body: form });
    loadTasks();
}

formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleEl.value.trim();
    if (!title) return;
    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
    });
    titleEl.value = "";
    loadTasks();
});

searchEl.addEventListener("input", (e) => {
    query = e.target.value.trim();
    applyFilters();
});

document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        filter = btn.dataset.filter;
        applyFilters();
    });
});

loadTasks();