import type { DocModule } from '../catalog'

export const flaskModules: DocModule[] = [
  {
    id: 'flask-setup',
    title: 'Setup & Installation',
    sections: [
      {
        id: 'flask-install',
        title: 'Install Flask',
        body: `Flask is installed with pip, Python's package manager. Run this in your terminal:\n\n\`\`\`bash\npip install flask\n\`\`\`\n\nAfter installation, verify it worked:\n\n\`\`\`bash\npip show flask\n\`\`\`\n\nYou should see the version number and location. If pip is not found, try pip3 instead.`,
        tryIt: 'Open a terminal, run pip install flask, and confirm the version that was installed.'
      },
      {
        id: 'flask-venv',
        title: 'Virtual environments',
        body: `A virtual environment keeps your project's packages separate from other projects. Create one with:\n\n\`\`\`bash\npython -m venv venv\n\`\`\`\n\nActivate it:\n\n\`\`\`bash\n# Windows\nvenv\\Scripts\\activate\n\n# macOS / Linux\nsource venv/bin/activate\n\`\`\`\n\nThe prompt changes to show \`(venv)\` when active. Install Flask after activating so it stays inside the env.`,
        tryIt: 'Create a venv, activate it, and install Flask inside it. Notice the prompt change.'
      },
      {
        id: 'flask-hello',
        title: 'The smallest Flask app',
        body: `Three imports and four lines run a web page:\n\n\`\`\`python\nfrom flask import Flask\n\napp = Flask(__name__)\n\n@app.route("/")\ndef index():\n    return "Hello, world!"\n\`\`\`\n\nSave it as \`app.py\`. Then start the server:\n\n\`\`\`bash\nflask --app app run\n\`\`\`\n\nOpen \`http://127.0.0.1:5000\` in your browser and you will see the string.`,
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
        body: `A route is a link between a URL path and a Python function. The \`@app.route\` decorator on the line above a function tells Flask: "run this function when someone visits that path."\n\n\`\`\`python\n@app.route("/about")\ndef about():\n    return "This is the about page."\n\`\`\`\n\nThe string inside \`route()\` is the path. The function name does not matter to the browser — only the decorator path matters.`,
        tryIt: 'Add a /contact route that returns your email address as a plain string.'
      },
      {
        id: 'flask-url-variables',
        title: 'URL variables',
        body: `Angle brackets in the path capture part of the URL and pass it to the function:\n\n\`\`\`python\n@app.route("/hello/<name>")\ndef hello(name):\n    return f"Hello, {name}!"\n\`\`\`\n\nVisiting \`/hello/Alice\` returns "Hello, Alice!". The argument name in the function must exactly match the name inside the angle brackets.`,
        tryIt: 'Create a /square/<int:n> route that returns the square of the number in the URL.'
      },
      {
        id: 'flask-url-converters',
        title: 'URL converters',
        body: `Flask can convert URL segments to Python types automatically:\n\n\`\`\`python\n@app.route("/post/<int:post_id>")\ndef show_post(post_id):\n    return f"Post number {post_id}"\n\n@app.route("/price/<float:amount>")\ndef show_price(amount):\n    return f"Price: {amount:.2f}"\n\`\`\`\n\nAvailable converters:\n- \`string\` — default, any text without a slash\n- \`int\` — positive integers\n- \`float\` — positive floating point values\n- \`path\` — like string but accepts slashes\n- \`uuid\` — UUID strings`,
        tryIt: 'Write a /multiply/<int:a>/<int:b> route that returns the product of the two numbers.'
      },
      {
        id: 'flask-methods',
        title: 'HTTP methods',
        body: `By default, routes only respond to GET. Add \`methods=\` to allow more:\n\n\`\`\`python\nfrom flask import request\n\n@app.route("/login", methods=["GET", "POST"])\ndef login():\n    if request.method == "POST":\n        return "Logging in..."\n    return "Show the login form"\n\`\`\`\n\nA form submit uses POST. If the route only accepts GET, Flask returns 405 Method Not Allowed.`,
        tryIt: 'Create a /submit route that accepts POST and returns "Received!" when posted to.'
      },
      {
        id: 'flask-url-for',
        title: 'Building URLs with url_for',
        body: `Hard-coding paths into links breaks when you rename a route. Use \`url_for\` instead:\n\n\`\`\`python\nfrom flask import url_for\n\n@app.route("/user/<username>")\ndef profile(username):\n    return f"Profile of {username}"\n\n# Inside another route or template:\nurl = url_for("profile", username="alice")\n# url is "/user/alice"\n\`\`\`\n\n\`url_for\` takes the function name as a string, not the path string.`,
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
        body: `Flask provides a \`request\` object that holds everything the browser sent:\n\n\`\`\`python\nfrom flask import Flask, request\n\napp = Flask(__name__)\n\n@app.route("/info")\ndef info():\n    method = request.method\n    path = request.path\n    agent = request.headers.get("User-Agent", "unknown")\n    return f"Method: {method}, Path: {path}, Agent: {agent}"\n\`\`\`\n\nThe request object is only available inside a route function during a live request.`,
        tryIt: 'Add a route that prints request.method and request.url together in the response.'
      },
      {
        id: 'flask-query-args',
        title: 'Query string arguments',
        body: `Values after \`?\` in the URL are query arguments. Access them with \`request.args\`:\n\n\`\`\`python\n@app.route("/search")\ndef search():\n    query = request.args.get("q", "")\n    if not query:\n        return "No search term given."\n    return f"Searching for: {query}"\n\`\`\`\n\nVisiting \`/search?q=flask\` calls this function with \`query = "flask"\`. If \`q\` is missing, \`.get()\` returns the default \`""\`.`,
        tryIt: 'Create a /greet route that reads a name= query parameter and returns a greeting.'
      },
      {
        id: 'flask-form-data',
        title: 'Reading form fields',
        body: `Form data submitted with POST lives in \`request.form\`:\n\n\`\`\`python\n@app.route("/submit", methods=["GET", "POST"])\ndef submit():\n    if request.method == "POST":\n        username = request.form.get("username", "")\n        message = request.form.get("message", "")\n        return f"{username} says: {message}"\n    return """\n        <form method="POST">\n          <input name="username" placeholder="Name">\n          <input name="message" placeholder="Message">\n          <button type="submit">Send</button>\n        </form>\n    """\n\`\`\`\n\nThe input \`name\` attribute must match the key passed to \`request.form.get()\`.`,
        tryIt: 'Build a /contact form that collects a name and email, then echoes them back.'
      },
      {
        id: 'flask-json-request',
        title: 'Reading JSON from a request',
        body: `APIs often receive JSON in the request body. Use \`request.get_json()\`:\n\n\`\`\`python\n@app.route("/api/data", methods=["POST"])\ndef receive_data():\n    data = request.get_json()\n    if data is None:\n        return {"error": "No JSON received"}, 400\n    name = data.get("name", "stranger")\n    return {"message": f"Hello, {name}!"}\n\`\`\`\n\nThe caller must send \`Content-Type: application/json\` and a valid JSON body. If not, \`get_json()\` returns \`None\`.`,
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
        body: `Flask accepts several return types from a route function:\n\n\`\`\`python\n# Plain string — becomes an HTML response\nreturn "Hello!"\n\n# Dictionary — automatically becomes JSON\nreturn {"name": "Alice", "age": 30}\n\n# Tuple with status code\nreturn "Not allowed", 403\n\n# Tuple with headers\nreturn "OK", 200, {"X-Custom": "value"}\n\n# Response object for full control\nfrom flask import make_response\nresp = make_response("OK")\nresp.headers["X-Custom"] = "value"\nreturn resp\n\`\`\``,
        tryIt: 'Write a route that returns a dictionary. Open it in a browser and look at the JSON output.'
      },
      {
        id: 'flask-jsonify',
        title: 'Sending JSON',
        body: `Returning a dictionary is enough for simple cases. For more control, use \`jsonify\`:\n\n\`\`\`python\nfrom flask import jsonify\n\n@app.route("/api/user")\ndef get_user():\n    user = {\n        "id": 1,\n        "name": "Alice",\n        "email": "alice@example.com"\n    }\n    return jsonify(user)\n\`\`\`\n\n\`jsonify\` sets the Content-Type to \`application/json\` and serializes the object. Returning a dict directly does the same in Flask 2+.`,
        tryIt: 'Build a /api/status route that returns a JSON object with a status field set to "ok".'
      },
      {
        id: 'flask-redirect',
        title: 'Redirecting',
        body: `Send the browser to a different URL with \`redirect\`:\n\n\`\`\`python\nfrom flask import redirect, url_for\n\n@app.route("/old-page")\ndef old_page():\n    return redirect(url_for("new_page"))\n\n@app.route("/new-page")\ndef new_page():\n    return "This is the new page."\n\`\`\`\n\nThe default status is 302 (temporary). Use 301 for permanent redirects:\n\n\`\`\`python\nreturn redirect(url_for("new_page"), 301)\n\`\`\``,
        tryIt: 'Make /home redirect to / using redirect and url_for.'
      },
      {
        id: 'flask-status-codes',
        title: 'Status codes',
        body: `The second item in a returned tuple is the HTTP status code:\n\n\`\`\`python\n@app.route("/api/item/<int:item_id>")\ndef get_item(item_id):\n    items = {1: "Apple", 2: "Banana"}\n    if item_id not in items:\n        return {"error": "Item not found"}, 404\n    return {"item": items[item_id]}, 200\n\`\`\`\n\nCommon status codes:\n- \`200 OK\` — success\n- \`201 Created\` — resource created\n- \`400 Bad Request\` — client sent bad data\n- \`401 Unauthorized\` — not logged in\n- \`403 Forbidden\` — logged in but not allowed\n- \`404 Not Found\` — resource does not exist\n- \`500 Internal Error\` — server bug`,
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
        body: `Store HTML files in a \`templates/\` folder next to \`app.py\`. Render them with \`render_template\`:\n\n\`\`\`python\nfrom flask import render_template\n\n@app.route("/")\ndef index():\n    return render_template("index.html", title="Home")\n\`\`\`\n\nIn \`templates/index.html\`:\n\n\`\`\`html\n<!DOCTYPE html>\n<html>\n  <head><title>{{ title }}</title></head>\n  <body><h1>{{ title }}</h1></body>\n</html>\n\`\`\`\n\n\`{{ title }}\` in the template is replaced with the value you passed in.`,
        tryIt: 'Create templates/index.html with one heading, then render it from a / route.'
      },
      {
        id: 'flask-jinja-variables',
        title: 'Variables in templates',
        body: `Pass any Python value to the template as a keyword argument:\n\n\`\`\`python\n@app.route("/profile/<username>")\ndef profile(username):\n    return render_template(\n        "profile.html",\n        username=username,\n        join_year=2024\n    )\n\`\`\`\n\nIn \`profile.html\`:\n\n\`\`\`html\n<h1>{{ username }}</h1>\n<p>Member since {{ join_year }}</p>\n\`\`\`\n\nFlask uses Jinja2 as its template engine. \`{{ expr }}\` outputs a value. \`{% stmt %}\` is for control flow.`,
        tryIt: 'Pass a list of items to a template and display the length of the list in the page.'
      },
      {
        id: 'flask-jinja-loops',
        title: 'Loops and conditionals',
        body: `Use Jinja2 tags for logic inside your templates:\n\n\`\`\`html\n<!-- Loop over a list -->\n<ul>\n{% for item in items %}\n  <li>{{ item }}</li>\n{% endfor %}\n</ul>\n\n<!-- Conditional display -->\n{% if user %}\n  <p>Welcome back, {{ user.name }}!</p>\n{% else %}\n  <a href="/login">Please log in</a>\n{% endif %}\n\`\`\`\n\nAll Jinja statements must be closed with an \`{% end... %}\` tag.`,
        tryIt: 'Pass a list of 3 favorite foods from your Python route to a template and render them with a Jinja for loop.'
      }
    ]
  },
  {
    id: 'flask-errors',
    title: 'Error Handling',
    sections: [
      {
        id: 'flask-abort',
        title: 'Aborting a request',
        body: `Use \`abort()\` to immediately stop a request with an HTTP error code:\n\n\`\`\`python\nfrom flask import abort\n\n@app.route("/secret")\ndef secret():\n    token = request.args.get("token")\n    if token != "correct-horse":\n        abort(403)  # raises HTTPException immediately\n    return "Access granted!"\n\`\`\`\n\nCode after \`abort()\` will not execute. Flask returns a default error page.`,
        tryIt: 'Add a /admin route that calls abort(401) unless a ?key= query argument matches a secret password.'
      },
      {
        id: 'flask-custom-error-pages',
        title: 'Custom error pages',
        body: `Use the \`@app.errorhandler\` decorator to render custom pages for errors:\n\n\`\`\`python\nfrom flask import render_template\n\n@app.errorhandler(404)\ndef page_not_found(error):\n    return render_template("404.html"), 404\n\n@app.errorhandler(500)\ndef internal_error(error):\n    return render_template("500.html"), 500\n\`\`\`\n\nAlways return the error status code as the second item in the tuple so browsers and crawlers know it failed.`,
        tryIt: 'Register an errorhandler for 404 that returns a friendly HTML message explaining the page moved.'
      }
    ]
  },
  {
    id: 'flask-data',
    title: 'Working with Data',
    sections: [
      {
        id: 'flask-in-memory-db',
        title: 'Simple in-memory storage',
        body: `Store data in a Python list or dictionary during development:\n\n\`\`\`python\n# In-memory storage (resets when server restarts)\ntodos = []\n\n@app.route("/todos", methods=["GET", "POST"])\ndef handle_todos():\n    if request.method == "POST":\n        task = request.form.get("task")\n        if task:\n            todos.append({"id": len(todos) + 1, "task": task})\n    return render_template("todos.html", todos=todos)\n\`\`\`\n\nIn-memory storage is great for learning without setting up a real database.`,
        tryIt: 'Build an in-memory guestbook route where visitors submit their name and it appears in a list below the form.'
      }
    ]
  },
  {
    id: 'flask-cli',
    title: 'Flask CLI Commands',
    sections: [
      {
        id: 'flask-cli-run',
        title: 'The flask run command',
        body: `Run your application from the terminal:\n\n\`\`\`bash\n# Run with auto-detection (looks for app.py or wsgi.py)\nflask run\n\n# Run a specific file\nflask --app my_server run\n\n# Run with hot reload (restarts on file save)\nflask --app app run --debug\n\n# Run on a different port\nflask run --port 8080\n\n# Run accessible on the local network\nflask run --host 0.0.0.0\n\`\`\`\n\n\`--debug\` enables the interactive debugger in the browser if your code crashes. Never use \`--debug\` in production.`,
        tryIt: 'Start your Flask server with --debug flag, then intentionally trigger an error to see the interactive debugger.'
      },
      {
        id: 'flask-cli-routes',
        title: 'Listing all routes',
        body: `View all registered routes and their methods:\n\n\`\`\`bash\nflask --app app routes\n\`\`\`\n\nThis prints a table showing every URL pattern, the allowed HTTP methods, and which function answers it. It is the best way to debug "404 Not Found" errors.`,
        tryIt: 'Run flask --app app routes in your terminal and find your / route in the output list.'
      }
    ]
  }
]
