import os
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# временное in-memory хранилище (потом заменим на MongoDB)
TASKS = []
_next_id = 1


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    return jsonify(TASKS)


@app.route("/api/tasks", methods=["POST"])
def create_task():
    global _next_id
    data = request.get_json()
    task = {"_id": str(_next_id), "title": data["title"], "done": False, "attachment": None}
    _next_id += 1
    TASKS.append(task)
    return jsonify(task), 201


@app.route("/api/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    global TASKS
    TASKS = [t for t in TASKS if t["_id"] != task_id]
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)