from flask import Flask
from models import db, UniversityMetadata, Classroom
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)


@app.route("/")
def hello():
    return {"message": "UNSA Schedule API running 🚀"}


if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # creates tables if not exist (for dev)
    app.run(host="0.0.0.0", port=8000)
