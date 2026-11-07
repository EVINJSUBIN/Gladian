import type { DocModule } from '../catalog'

export const flaskModules: DocModule[] = [
  {
    id: 'flask-setup',
    title: 'Setup & Installation',
    sections: [
      {
        id: 'flask-install',
        title: 'Install Flask',
        body: 'Flask is installed with pip, Python\'s package manager. Run this in your terminal:\n\npip install flask\n\nAfter installation, verify it worked:\n\npip show flask\n\nYou should see the version number and location. If pip is not found, try pip3 instead.',
        tryIt: 'Open a terminal, run pip install flask, and confirm the version that was installed.'
      },
      {
        id: 'flask-venv',
        title: 'Virtual environments',
        body: 'A virtual environment keeps your project\'s packages separate from other projects. Create one with:\n\npython -m venv venv\n\nActivate it:\n\n# Windows\nvenv\\Scripts\\activate\n\n# macOS / Linux\nsource venv/bin/activate\n\nThe prompt changes to show (venv) when active. Install Flask after activating so it stays inside the env.',
        tryIt: 'Create a venv, activate it, and install Flask inside it. Notice the prompt change.'
      },
      {
        id: 'flask-hello',
        title: 'The smallest Flask app',
        body: 'Three imports and four lines run a web page:\n\nfrom flask import Flask\n\napp = Flask(__name__)\n\n@app.route("/")\ndef index():\n    return "Hello, world!"\n\nSave it as app.py. Then start the server:\n\nflask --app app run\n\nOpen http://127.0.0.1:5000 in your browser and you will see the string.',
        tryIt: 'Type this out yourself — do not paste it. Reading and typing are different practices.'
      }
    ]
  },
  {
    id: 'flask-routing',
    title: 'Routing',
    sections: [
      {
        id: 'flask-route-basics',
        title: 'What a route does',
        body: 'A route is a link between a URL path and a Python function. The @app.route decorator on the line above a function tells Flask: "run this function when someone visits that path."\n\n@app.route("/about")\ndef about():\n    return "This is the about page."\n\nThe string inside route() is the path. The function name does not matter to the browser — only the decorator path matters.',
        tryIt: 'Add a /contact route that returns your email address as a plain string.'
      },
      {
        id: 'flask-url-variables',
        title: 'URL variables',
        body: 'Angle brackets in the path capture part of the URL and pass it to the function:\n\n@app.route("/hello/<name>")\ndef hello(name):\n    return f"Hello, {name}!"\n\nVisiting /hello/Alice returns "Hello, Alice!". The argument name in the function must exactly match the name inside the angle brackets.',
        tryIt: 'Create a /square/<int:n> route that returns the square of the number in the URL.'
      },
      {
        id: 'flask-url-converters',
        title: 'URL converters',
        body: 'Flask can convert URL segments to Python types automatically:\n\n@app.route("/post/<int:post_id>")\ndef show_post(post_id):\n    return f"Post number {post_id}"\n\n@app.route("/price/<float:amount>")\ndef show_price(amount):\n    return f"Price: {amount:.2f}"\n\nAvailable converters:\n  string  - default, any text without a slash\n  int     - positive integers\n  float   - positive floating point values\n  path    - like string but accepts slashes\n  uuid    - UUID strings',
        tryIt: 'Write a /multiply/<int:a>/<int:b> route that returns the product of the two numbers.'
      },
      {
        id: 'flask-methods',
        title: 'HTTP methods',
        body: 'By default, routes only respond to GET. Add methods= to allow more:\n\n@app.route("/login", methods=["GET", "POST"])\ndef login():\n    if request.method == "POST":\n        return "Logging in..."\n    return "Show the login form"\n\nA form submit uses POST. If the route only accepts GET, Flask returns 405 Method Not Allowed.',
        tryIt: 'Create a /submit route that accepts POST and returns "Received!" when posted to.'
      },
      {
        id: 'flask-url-for',
        title: 'Building URLs with url_for',
        body: 'Hard-coding paths into links breaks when you rename a route. Use url_for instead:\n\nfrom flask import url_for\n\n@app.route("/user/<username>")\ndef profile(username):\n    return f"Profile of {username}"\n\n# Inside another route or template:\nurl = url_for("profile", username="alice")\n# url is "/user/alice"\n\nurl_for takes the function name as a string, not the path string.',
        tryIt: 'Use url_for to generate the URL for your /hello/<name> route with a name you choose.'
      }
    ]
  },
  {
    id: 'flask-request',
    title: 'Request & Forms',
    sections: [
      {
        id: 'flask-request-object',
        title: 'The request object',
        body: 'Flask provides a request object that holds everything the browser sent:\n\nfrom flask import Flask, request\n\napp = Flask(__name__)\n\n@app.route("/info")\ndef info():\n    method = request.method\n    path = request.path\n    agent = request.headers.get("User-Agent", "unknown")\n    return f"Method: {method}, Path: {path}, Agent: {agent}"\n\nThe request object is only available inside a route function during a live request.',
        tryIt: 'Add a route that prints request.method and request.url together in the response.'
      },
      {
        id: 'flask-query-args',
        title: 'Query string arguments',
        body: 'Values after ? in the URL are query arguments. Access them with request.args:\n\n@app.route("/search")\ndef search():\n    query = request.args.get("q", "")\n    if not query:\n        return "No search term given."\n    return f"Searching for: {query}"\n\nVisiting /search?q=flask calls this function with query = "flask". If q is missing, .get() returns the default "".',
        tryIt: 'Create a /greet route that reads a name= query parameter and returns a greeting.'
      },
      {
        id: 'flask-form-data',
        title: 'Reading form fields',
        body: 'Form data submitted with POST lives in request.form:\n\n@app.route("/submit", methods=["GET", "POST"])\ndef submit():\n    if request.method == "POST":\n        username = request.form.get("username", "")\n        message = request.form.get("message", "")\n        return f"{username} says: {message}"\n    return """\n        <form method="POST">\n          <input name="username" placeholder="Name">\n          <input name="message" placeholder="Message">\n          <button type="submit">Send</button>\n        </form>\n    """\n\nThe input name attribute must match the key passed to request.form.get().',
        tryIt: 'Build a /contact form that collects a name and email, then echoes them back.'
      },
      {
        id: 'flask-json-request',
        title: 'Reading JSON from a request',
        body: 'APIs often receive JSON in the request body. Use request.get_json():\n\n@app.route("/api/data", methods=["POST"])\ndef receive_data():\n    data = request.get_json()\n    if data is None:\n        return {"error": "No JSON received"}, 400\n    name = data.get("name", "stranger")\n    return {"message": f"Hello, {name}!"}\n\nThe caller must send Content-Type: application/json and a valid JSON body. If not, get_json() returns None.',
        tryIt: 'Create a /api/echo route that returns whatever JSON object it receives, unchanged.'
      }
    ]
  },
  {
    id: 'flask-response',
    title: 'Responses',
    sections: [
      {
        id: 'flask-return-types',
        title: 'What you can return',
        body: 'Flask accepts several return types from a route function:\n\n# Plain string — becomes an HTML response\nreturn "Hello!"\n\n# Dictionary — automatically becomes JSON\nreturn {"name": "Alice", "age": 30}\n\n# Tuple with status code\nreturn "Not allowed", 403\n\n# Tuple with headers\nreturn "OK", 200, {"X-Custom": "value"}\n\n# Response object for full control\nfrom flask import make_response\nresp = make_response("OK")\nresp.headers["X-Custom"] = "value"\nreturn resp',
        tryIt: 'Write a route that returns a dictionary. Open it in a browser and look at the JSON output.'
      },
      {
        id: 'flask-jsonify',
        title: 'Sending JSON',
        body: 'Returning a dictionary is enough for simple cases. For more control, use jsonify:\n\nfrom flask import jsonify\n\n@app.route("/api/user")\ndef get_user():\n    user = {\n        "id": 1,\n        "name": "Alice",\n        "email": "alice@example.com"\n    }\n    return jsonify(user)\n\njsonify sets the Content-Type to application/json and serializes the object. Returning a dict directly does the same in Flask 2+.',
        tryIt: 'Build a /api/status route that returns a JSON object with a status field set to "ok".'
      },
      {
        id: 'flask-redirect',
        title: 'Redirecting',
        body: 'Send the browser to a different URL with redirect:\n\nfrom flask import redirect, url_for\n\n@app.route("/old-page")\ndef old_page():\n    return redirect(url_for("new_page"))\n\n@app.route("/new-page")\ndef new_page():\n    return "This is the new page."\n\nThe default status is 302 (temporary). Use 301 for permanent redirects:\nreturn redirect(url_for("new_page"), 301)',
        tryIt: 'Make /home redirect to / using redirect and url_for.'
      },
      {
        id: 'flask-status-codes',
        title: 'Status codes',
        body: 'The second item in a returned tuple is the HTTP status code:\n\n@app.route("/api/item/<int:item_id>")\ndef get_item(item_id):\n    items = {1: "Apple", 2: "Banana"}\n    if item_id not in items:\n        return {"error": "Item not found"}, 404\n    return {"item": items[item_id]}, 200\n\nCommon codes:\n  200 OK            - success\n  201 Created       - resource created\n  400 Bad Request   - client sent bad data\n  401 Unauthorized  - not logged in\n  403 Forbidden     - logged in but not allowed\n  404 Not Found     - resource does not exist\n  500 Internal Error - server bug',
        tryIt: 'Add a /api/create route that always returns 201 with a JSON confirmation message.'
      }
    ]
  },
  {
    id: 'flask-templates',
    title: 'Templates (Jinja2)',
    sections: [
      {
        id: 'flask-render-template',
        title: 'Rendering HTML templates',
        body: 'Store HTML files in a templates/ folder next to app.py. Render them with render_template:\n\nfrom flask import render_template\n\n@app.route("/")\ndef index():\n    return render_template("index.html", title="Home")\n\n# templates/index.html:\n# <!DOCTYPE html>\n# <html>\n#   <head><title>{{ title }}</title></head>\n#   <body><h1>{{ title }}</h1></body>\n# </html>\n\n{{ title }} in the template is replaced with the value you passed in.',
        tryIt: 'Create templates/index.html with one heading, then render it from a / route.'
      },
      {
        id: 'flask-jinja-variables',
        title: 'Variables in templates',
        body: 'Pass any Python value to the template as a keyword argument:\n\n@app.route("/profile/<username>")\ndef profile(username):\n    return render_template(\n        "profile.html",\n        username=username,\n        join_year=2024\n    )\n\n# In profile.html:\n# <h1>{{ username }}</h1>\n# <p>Member since {{ join_year }}</p>\n\nFlask uses Jinja2 as its template engine. {{ expr }} outputs a value. {% stmt %} is for control flow.',
        tryIt: 'Pass a list of items to a template and display the length of the list in the page.'
      },
      {
        id: 'flask-jinja-loops',
        title: 'Loops and conditionals',
        body: 'Jinja2 supports for loops and if statements inside {% %} blocks:\n\n# In the route:\n@app.route("/tasks")\ndef tasks():\n    items = ["Buy groceries", "Walk the dog", "Read a book"]\n    return render_template("tasks.html", items=items)\n\n# In tasks.html:\n# <ul>\n# {% for item in items %}\n#   <li>{{ item }}</li>\n# {% endfor %}\n# </ul>\n#\n# {% if items %}\n#   <p>You have {{ items|length }} tasks.</p>\n# {% else %}\n#   <p>No tasks yet!</p>\n# {% endif %}',
        tryIt: 'Create a template that shows a message when the list is empty and loops through it when it has items.'
      },
      {
        id: 'flask-jinja-inheritance',
        title: 'Template inheritance',
        body: 'Share a common layout across pages using extends and block:\n\n# templates/base.html:\n# <!DOCTYPE html>\n# <html>\n# <head><title>{% block title %}My Site{% endblock %}</title></head>\n# <body>\n#   <nav>My Nav</nav>\n#   {% block content %}{% endblock %}\n# </body>\n# </html>\n\n# templates/page.html:\n# {% extends "base.html" %}\n# {% block title %}About{% endblock %}\n# {% block content %}\n#   <h1>About page</h1>\n# {% endblock %}\n\nEvery page that extends base.html automatically gets the nav bar.',
        tryIt: 'Create a base template with a header, then make two pages that extend it with different content.'
      }
    ]
  },
  {
    id: 'flask-errors',
    title: 'Error Handling',
    sections: [
      {
        id: 'flask-errorhandler',
        title: 'Custom error pages',
        body: 'Register a function to run when a specific HTTP error occurs:\n\nfrom flask import render_template\n\n@app.errorhandler(404)\ndef not_found(error):\n    return render_template("404.html"), 404\n\n@app.errorhandler(500)\ndef server_error(error):\n    return "Something went wrong on our end.", 500\n\nThe function receives the error object. Return the page and the status code as a tuple.',
        tryIt: 'Register a 404 handler that returns a friendly message and links back to /.'
      },
      {
        id: 'flask-abort',
        title: 'Aborting a request',
        body: 'Call abort() inside a route to stop it immediately with a status code:\n\nfrom flask import abort\n\n@app.route("/admin")\ndef admin():\n    logged_in = False  # check your session here\n    if not logged_in:\n        abort(401)\n    return "Welcome, admin!"\n\nabort(404) triggers your 404 handler. abort(401) triggers your 401 handler. The route function stops executing at that point.',
        tryIt: 'Create a /secret route that aborts with 403 if a password= query arg is missing.'
      },
      {
        id: 'flask-debug-mode',
        title: 'Debug mode',
        body: 'Debug mode shows a detailed traceback in the browser when an error occurs and reloads the server on file changes:\n\n# Start with debug mode on:\nflask --app app run --debug\n\n# Or set it in code (never in production):\nif __name__ == "__main__":\n    app.run(debug=True)\n\nDebug mode gives anyone who sees the error page the ability to run Python in your server. Only use it on your local machine.',
        tryIt: 'Start your server with --debug and intentionally crash a route to see the error page.'
      }
    ]
  },
  {
    id: 'flask-database',
    title: 'Working with Data',
    sections: [
      {
        id: 'flask-in-memory',
        title: 'In-memory data (no database)',
        body: 'For learning, store data in a Python list at the top of the file:\n\napp = Flask(__name__)\ntasks = []  # lives in memory, resets on restart\n\n@app.route("/tasks")\ndef list_tasks():\n    return {"tasks": tasks}\n\n@app.route("/tasks", methods=["POST"])\ndef add_task():\n    data = request.get_json()\n    task = data.get("task", "")\n    if task:\n        tasks.append(task)\n    return {"tasks": tasks}, 201\n\nData in a plain list disappears when the server restarts. This is fine for learning.',
        tryIt: 'Build a /notes endpoint that stores and returns a list of note strings sent as JSON.'
      },
      {
        id: 'flask-sqlite',
        title: 'SQLite with sqlite3',
        body: 'Python ships with sqlite3. Connect to a local file database:\n\nimport sqlite3\nfrom flask import g\n\ndef get_db():\n    if "db" not in g:\n        g.db = sqlite3.connect("data.db")\n        g.db.row_factory = sqlite3.Row\n    return g.db\n\n@app.teardown_appcontext\ndef close_db(error):\n    db = g.pop("db", None)\n    if db is not None:\n        db.close()\n\n@app.route("/users")\ndef users():\n    db = get_db()\n    rows = db.execute("SELECT id, name FROM user").fetchall()\n    return {"users": [dict(row) for row in rows]}',
        tryIt: 'Create a table named note with id and text columns. Write a route that inserts and reads rows.'
      }
    ]
  },
  {
    id: 'flask-cli',
    title: 'Flask CLI Commands',
    sections: [
      {
        id: 'flask-run-command',
        title: 'Running the development server',
        body: 'The main commands you will use every day:\n\n# Start the server\nflask --app app run\n\n# Start with live reload and error pages\nflask --app app run --debug\n\n# Listen on a custom host and port\nflask --app app run --host 0.0.0.0 --port 8080\n\n# If your file is named app.py, Flask finds it automatically:\nflask run\n\n# If your file is named server.py:\nflask --app server run',
        tryIt: 'Start your server on port 8080 and open it in your browser.'
      },
      {
        id: 'flask-shell-command',
        title: 'The Flask shell',
        body: 'The Flask shell opens a Python interpreter with your app already loaded:\n\nflask --app app shell\n\n# Inside the shell:\n>>> from app import tasks\n>>> tasks.append("test task")\n>>> tasks\n["test task"]\n\nUse the shell to test functions, inspect data, and run database queries without writing a route first.',
        tryIt: 'Open the Flask shell and call one of your route functions to see what it returns.'
      },
      {
        id: 'flask-custom-commands',
        title: 'Custom CLI commands',
        body: 'Add commands to the flask CLI with the @app.cli.command decorator:\n\n@app.cli.command("seed-db")\ndef seed_db():\n    """Populate the database with sample data."""\n    db = get_db()\n    db.execute("INSERT INTO task (title) VALUES (?)", ("First task",))\n    db.commit()\n    print("Database seeded.")\n\n# Run it:\nflask --app app seed-db\n\nCustom commands are useful for setup, migrations, and maintenance scripts that need the app context.',
        tryIt: 'Create a flask hello command that prints a greeting from your app.'
      }
    ]
  }
]
