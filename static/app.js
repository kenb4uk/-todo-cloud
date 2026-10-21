const API = "/api/tasks";
const listEl = document.getElementById("task-list");
const emptyEl = document.getElementById("empty");
const formEl = document.getElementById("add-form");
const titleEl = document.getElementById("title");

async function loadTasks() {
    const res = await fetch(API);
    const tasks = await res.json();
    render(tasks);
}

function render(tasks) {
    listEl.innerHTML = "";
    emptyEl.classList.toggle("hidden", tasks.length > 0);

    tasks.forEach(t => {
        const li = document.createElement("li");
        li.className = "task";

        const title = document.createElement("span");
        title.textContent = t.title;

        const attachBox = document.createElement("span");
        if (t.attachment) {
            const a = document.createElement("a");
            a.href = t.attachment.url;
            a.target = "_blank";
            a.textContent = "📎 " + t.attachment.name;
            attachBox.appendChild(a);
        } else {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.onchange = () => uploadAttachment(t._id, fileInput.files[0]);
            attachBox.appendChild(fileInput);
        }

        const del = document.createElement("button");
        del.textContent = "✕";
        del.className = "delete";
        del.onclick = () => deleteTask(t._id);

        li.appendChild(title);
        li.appendChild(attachBox);
        li.appendChild(del);
        listEl.appendChild(li);
    });
}

async function deleteTask(id) {
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

loadTasks();