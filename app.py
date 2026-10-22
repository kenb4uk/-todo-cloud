import os
import dropbox
from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from bson.errors import InvalidId

load_dotenv()

app = Flask(__name__)

mongo = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
db = mongo.get_database("todo")
tasks_col = db.tasks

DROPBOX_TOKEN = os.environ.get("DROPBOX_TOKEN")
dbx = dropbox.Dropbox(DROPBOX_TOKEN) if DROPBOX_TOKEN else None


def serialize(task):
    task["_id"] = str(task["_id"])
    return task


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    return jsonify([serialize(t) for t in tasks_col.find().sort("_id", 1)])


@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.get_json()
    doc = {"title": data["title"], "done": False, "attachment": None}
    res = tasks_col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return jsonify(doc), 201


@app.route("/api/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    try:
        oid = ObjectId(task_id)
    except InvalidId:
        return jsonify({"error": "invalid id"}), 400

    task = tasks_col.find_one({"_id": oid})
    if task and task.get("attachment") and dbx:
        try:
            dbx.files_delete_v2(task["attachment"]["path"])
        except Exception as e:
            app.logger.warning(f"Dropbox delete failed: {e}")

    tasks_col.delete_one({"_id": oid})
    return jsonify({"ok": True})

@app.route("/api/tasks/<task_id>", methods=["PATCH"])
def toggle_task(task_id):
    try:
        oid = ObjectId(task_id)
    except InvalidId:
        return jsonify({"error": "invalid id"}), 400

    task = tasks_col.find_one({"_id": oid})
    if not task:
        return jsonify({"error": "not found"}), 404

    tasks_col.update_one({"_id": oid}, {"$set": {"done": not task.get("done", False)}})
    return jsonify({"ok": True})


@app.route("/api/tasks/<task_id>", methods=["PUT"])
def rename_task(task_id):
    try:
        oid = ObjectId(task_id)
    except InvalidId:
        return jsonify({"error": "invalid id"}), 400

    data = request.get_json() or {}
    new_title = (data.get("title") or "").strip()
    if not new_title:
        return jsonify({"error": "title required"}), 400

    tasks_col.update_one({"_id": oid}, {"$set": {"title": new_title}})
    return jsonify({"ok": True})


@app.route("/api/tasks/<task_id>/attachment", methods=["POST"])
def upload_attachment(task_id):
    if dbx is None:
        return jsonify({"error": "Dropbox not configured"}), 500

    try:
        oid = ObjectId(task_id)
    except InvalidId:
        return jsonify({"error": "invalid id"}), 400

    f = request.files.get("file")
    if not f:
        return jsonify({"error": "no file"}), 400

    path = f"/todo_attachments/{task_id}_{f.filename}"
    try:
        dbx.files_upload(f.read(), path, mode=dropbox.files.WriteMode.overwrite)
    except dropbox.exceptions.ApiError as e:
        return jsonify({"error": str(e)}), 500

    # получаем публичную ссылку
    try:
        link = dbx.sharing_create_shared_link_with_settings(path).url
    except dropbox.exceptions.ApiError:
        # ссылка уже существует — забираем существующую
        shared = dbx.sharing_list_shared_links(path=path, direct_only=True).links
        link = shared[0].url if shared else ""

    # делаем прямую ссылку на скачивание (?dl=1)
    direct_url = link.replace("?dl=0", "?dl=1")

    tasks_col.update_one(
        {"_id": oid},
        {"$set": {"attachment": {"path": path, "url": direct_url, "name": f.filename}}},
    )
    return jsonify({"ok": True, "url": direct_url})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)