import type { DocModule } from '../catalog'

export const requestsModules: DocModule[] = [
  {
    id: 'requests-setup',
    title: 'Setup & Install',
    sections: [
      {
        id: 'requests-install',
        title: 'Installing Requests',
        body: `Requests is a Python library that makes HTTP calls simple. Install it with pip.\n\n\`\`\`bash\npip install requests\n\`\`\`\n\nThen import it at the top of your file:\n\n\`\`\`python\nimport requests\n\`\`\`\n\nRequests wraps Python's built-in urllib into a clean, readable API. One line is usually enough for a basic call.`,
        tryIt: 'Install requests in your terminal, then write a file that imports it and confirm it does not error.'
      }
    ]
  },
  {
    id: 'requests-basics',
    title: 'GET & POST Basics',
    sections: [
      {
        id: 'requests-get',
        title: 'Making a GET Request',
        body: `requests.get() sends an HTTP GET request and returns a Response object.\n\n\`\`\`python\nimport requests\n\nresponse = requests.get("https://httpbin.org/get")\n\nprint(response.status_code)  # 200 means success\nprint(response.text)          # the raw body as a string\n\`\`\`\n\nhttpbin.org is a free public testing service — perfect for experimenting. The status code is the server's short answer: 200 OK, 404 Not Found, 401 Unauthorized.`,
        tryIt: 'Call requests.get("https://httpbin.org/get") and print both the status code and the first 200 characters of the text.'
      },
      {
        id: 'requests-json',
        title: 'Parsing JSON Responses',
        body: `When a server returns JSON, use response.json() instead of response.text.\n\n\`\`\`python\nimport requests\n\nresponse = requests.get("https://httpbin.org/json")\n\nif response.status_code == 200:\n    data = response.json()      # returns a dict or list\n    print(type(data))           # <class 'dict'>\n    print(data.get("slideshow"))  # access nested values\nelse:\n    print("Request failed:", response.status_code)\n\`\`\`\n\nAlways check the status code before calling .json(). If the server sent an error page instead of JSON, response.json() raises an exception.`,
        tryIt: 'Fetch https://httpbin.org/json, parse the JSON, and print one specific key from the returned dictionary.'
      },
      {
        id: 'requests-post',
        title: 'Making a POST Request',
        body: `requests.post() sends data to a server.\n\n\`\`\`python\nimport requests\n\n# Send JSON body\npayload = {"username": "alice", "action": "login"}\nresponse = requests.post("https://httpbin.org/post", json=payload)\n\nprint(response.status_code)\ndata = response.json()\nprint(data["json"])  # httpbin echoes back the JSON you sent\n\`\`\`\n\nUse json= to send JSON (sets Content-Type: application/json automatically). Use data= to send form data instead.`,
        tryIt: 'POST a dictionary with two fields of your choice to httpbin.org/post and print what the server echoes back.'
      }
    ]
  },
  {
    id: 'requests-params',
    title: 'Query Parameters & Headers',
    sections: [
      {
        id: 'requests-query-params',
        title: 'Query Parameters',
        body: `Pass a dictionary to params= and Requests builds the query string for you.\n\n\`\`\`python\nimport requests\n\nparams = {\n    "q": "python requests",\n    "page": 1,\n    "per_page": 10\n}\n\nresponse = requests.get("https://httpbin.org/get", params=params)\ndata = response.json()\nprint(data["url"])  # shows the full URL with query string\n# https://httpbin.org/get?q=python+requests&page=1&per_page=10\n\`\`\`\n\nUsing params= is safer than manually building a URL — Requests handles URL encoding for you.`,
        tryIt: 'Make a GET request to httpbin.org/get with at least two query parameters and print the resulting URL from the response.'
      },
      {
        id: 'requests-headers',
        title: 'Custom Headers',
        body: `Pass a dictionary to headers= to send custom HTTP headers.\n\n\`\`\`python\nimport requests\n\nheaders = {\n    "Accept": "application/json",\n    "User-Agent": "MyApp/1.0"\n}\n\nresponse = requests.get("https://httpbin.org/headers", headers=headers)\ndata = response.json()\nprint(data["headers"])  # see what headers arrived at the server\n\`\`\`\n\nCommon headers: Accept (what format you want), Content-Type (what format you're sending), User-Agent (who you are). Never hardcode secrets in headers inside source files.`,
        tryIt: 'Send a request to httpbin.org/headers with a custom User-Agent header and print the headers the server received.'
      }
    ]
  },
  {
    id: 'requests-auth',
    title: 'Authentication',
    sections: [
      {
        id: 'requests-bearer',
        title: 'Bearer Token Auth',
        body: `Many APIs use a Bearer token in the Authorization header.\n\n\`\`\`python\nimport requests\nimport os\n\n# Load the token from an environment variable — never hardcode it\ntoken = os.environ.get("API_TOKEN", "")\n\nheaders = {"Authorization": f"Bearer {token}"}\nresponse = requests.get("https://httpbin.org/bearer", headers=headers)\n\nprint(response.status_code)\nif response.status_code == 200:\n    print(response.json())\n\`\`\`\n\nStore secrets in environment variables or a .env file, never in the source code. Use python-dotenv to load .env files automatically.`,
        tryIt: 'Read an API token from os.environ and pass it in the Authorization header. Use httpbin.org/bearer to test it.'
      },
      {
        id: 'requests-basic-auth',
        title: 'Basic Auth',
        body: `For username/password authentication, use the auth= parameter.\n\n\`\`\`python\nimport requests\n\nresponse = requests.get(\n    "https://httpbin.org/basic-auth/user/pass",\n    auth=("user", "pass")\n)\n\nprint(response.status_code)  # 200 if credentials are correct\nprint(response.json())\n\`\`\`\n\nRequests encodes the credentials in base64 and sends them as the Authorization header automatically.`,
        tryIt: 'Make a request to httpbin.org/basic-auth/alice/secret with auth=("alice", "secret") and confirm you get a 200.'
      }
    ]
  },
  {
    id: 'requests-errors',
    title: 'Error Handling',
    sections: [
      {
        id: 'requests-status-check',
        title: 'Checking Status Codes',
        body: `Always check the response status before using the data.\n\n\`\`\`python\nimport requests\n\nresponse = requests.get("https://httpbin.org/status/404")\n\nif response.ok:  # True for 2xx status codes\n    data = response.json()\nelse:\n    print(f"Error {response.status_code}: {response.reason}")\n\n# Or raise immediately\ntry:\n    response.raise_for_status()  # raises HTTPError for 4xx/5xx\n    data = response.json()\nexcept requests.HTTPError as error:\n    print("HTTP error:", error)\n\`\`\`\n\nresponse.ok is True when status_code is between 200 and 299. raise_for_status() is a convenient shortcut.`,
        tryIt: 'Request httpbin.org/status/500 and handle the error without crashing by using raise_for_status() inside a try/except.'
      },
      {
        id: 'requests-timeout',
        title: 'Timeouts & Network Errors',
        body: `Always set a timeout — otherwise your program can hang forever if the server is slow.\n\n\`\`\`python\nimport requests\n\ntry:\n    response = requests.get(\n        "https://httpbin.org/delay/5",\n        timeout=3  # seconds to wait for connection AND data\n    )\n    print(response.status_code)\nexcept requests.Timeout:\n    print("The server took too long to respond.")\nexcept requests.ConnectionError:\n    print("Could not reach the server. Check your internet connection.")\nexcept requests.RequestException as error:\n    print("Something went wrong:", error)\n\`\`\`\n\nRequestException is the base class for all Requests exceptions — catch it last as a fallback.`,
        tryIt: 'Request httpbin.org/delay/5 with a timeout of 2 seconds. Catch the Timeout and print a friendly message.'
      }
    ]
  },
  {
    id: 'requests-sessions',
    title: 'Sessions',
    sections: [
      {
        id: 'requests-session',
        title: 'Using a Session',
        body: `A Session object reuses the same TCP connection and shares headers/auth across requests.\n\n\`\`\`python\nimport requests\n\nwith requests.Session() as session:\n    # Set headers once — applies to every request in this session\n    session.headers.update({\n        "User-Agent": "MyApp/1.0",\n        "Accept": "application/json"\n    })\n\n    r1 = session.get("https://httpbin.org/get")\n    r2 = session.get("https://httpbin.org/headers")\n\n    print(r1.status_code)\n    print(r2.json()["headers"]["User-Agent"])  # shows MyApp/1.0\n\`\`\`\n\nUse Sessions when you are making multiple requests to the same host — faster and cleaner.`,
        tryIt: 'Create a Session with a custom User-Agent header and make two separate GET requests. Confirm both requests carry the same header.'
      }
    ]
  }
]
