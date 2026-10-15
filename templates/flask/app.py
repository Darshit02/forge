from flask import Flask, jsonify, request
from flasgger import Swagger

app = Flask(__name__)
swagger = Swagger(app)

users = [
    {"id": 1, "name": "Alice", "email": "alice@example.com"},
    {"id": 2, "name": "Bob", "email": "bob@example.com"}
]

@app.route('/health', methods=['GET'])
def health():
    """System health check
    ---
    responses:
      200:
        description: Service status
    """
    return jsonify({"status": "ok", "service": "flask-backend"})

@app.route('/users', methods=['GET'])
def get_users():
    """Retrieve all users
    ---
    responses:
      200:
        description: List of users
    """
    return jsonify(users)

@app.route('/users', methods=['POST'])
def create_user():
    """Create a user
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - name
            - email
          properties:
            name:
              type: string
            email:
              type: string
    responses:
      201:
        description: Created user
    """
    data = request.get_json() or {}
    if not data.get("name") or not data.get("email"):
        return jsonify({"error": "name and email required"}), 400
    user = {"id": len(users) + 1, "name": data["name"], "email": data["email"]}
    users.append(user)
    return jsonify(user), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
