import type { DocModule } from '../catalog'

export const fastapiModules: DocModule[] = [
  {
    id: 'fastapi-setup',
    title: 'Setup & Installation',
    sections: [
      {
        id: 'fastapi-install',
        title: 'Install FastAPI',
        body: 'FastAPI needs the fastapi package and an ASGI server. Install both:\n\npip install fastapi uvicorn\n\nuvicorn is the server that runs your FastAPI app. Optionally add httpx for testing:\n\npip install fastapi uvicorn httpx\n\nCheck versions:\n\npython -c "import fastapi; print(fastapi.__version__)"',
        tryIt: 'Install FastAPI and uvicorn, then check that both import without errors.'
      },
      {
        id: 'fastapi-hello',
        title: 'The smallest FastAPI app',
        body: 'Save this as main.py:\n\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\ndef root():\n    return {"message": "Hello, World!"}\n\nStart the server:\n\nuvicorn main:app --reload\n\n--reload watches for file changes and restarts automatically.\n\nVisit http://127.0.0.1:8000 for your JSON response.\nVisit http://127.0.0.1:8000/docs for the interactive Swagger UI.',
        tryIt: 'Type this out, start the server, and open /docs to explore the auto-generated API documentation.'
      },
      {
        id: 'fastapi-auto-docs',
        title: 'Automatic API documentation',
        body: 'FastAPI generates interactive docs automatically:\n\n# Swagger UI (try requests in the browser):\nhttp://127.0.0.1:8000/docs\n\n# ReDoc (cleaner reading view):\nhttp://127.0.0.1:8000/redoc\n\n# Raw OpenAPI JSON:\nhttp://127.0.0.1:8000/openapi.json\n\nThe docs update live when you change your code and the server reloads. No extra setup needed.',
        tryIt: 'Open /docs, expand your GET / endpoint, click "Try it out", and execute the request.'
      }
    ]
  },
  {
    id: 'fastapi-routing',
    title: 'Path Operations',
    sections: [
      {
        id: 'fastapi-methods',
        title: 'HTTP methods',
        body: 'FastAPI has decorators for each HTTP method:\n\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/items")        # read a list\ndef list_items(): ...\n\n@app.post("/items")       # create\ndef create_item(): ...\n\n@app.put("/items/{id}")   # replace\ndef replace_item(id: int): ...\n\n@app.patch("/items/{id}") # partial update\ndef update_item(id: int): ...\n\n@app.delete("/items/{id}")\ndef delete_item(id: int): ...',
        tryIt: 'Create GET and POST endpoints for a /notes path and visit both in /docs.'
      },
      {
        id: 'fastapi-path-params',
        title: 'Path parameters',
        body: 'Variables in the path are declared as function parameters with type hints:\n\n@app.get("/users/{user_id}")\ndef get_user(user_id: int):\n    return {"user_id": user_id, "name": "Alice"}\n\n@app.get("/files/{file_path:path}")\ndef get_file(file_path: str):\n    return {"file_path": file_path}\n\nFastAPI validates the type automatically. Visiting /users/abc returns a 422 error because "abc" is not an int.',
        tryIt: 'Create a /products/{product_id} endpoint and test it with both a valid integer and a string.'
      },
      {
        id: 'fastapi-query-params',
        title: 'Query parameters',
        body: 'Function parameters not in the path become query parameters:\n\n@app.get("/search")\ndef search(\n    query: str,\n    limit: int = 10,\n    skip: int = 0\n):\n    return {\n        "query": query,\n        "limit": limit,\n        "skip": skip\n    }\n\n# Call: /search?query=python&limit=5&skip=10\n\nParameters with default values are optional. Parameters without defaults are required.',
        tryIt: 'Create an endpoint with two optional query parameters and one required one.'
      }
    ]
  },
  {
    id: 'fastapi-models',
    title: 'Data Validation with Pydantic',
    sections: [
      {
        id: 'fastapi-pydantic-model',
        title: 'Request body models',
        body: 'Use Pydantic models to validate request bodies:\n\nfrom pydantic import BaseModel\nfrom typing import Optional\n\nclass Item(BaseModel):\n    name: str\n    price: float\n    description: Optional[str] = None\n    in_stock: bool = True\n\n@app.post("/items/")\ndef create_item(item: Item):\n    return {\n        "name": item.name,\n        "price": item.price,\n        "total_with_tax": item.price * 1.1\n    }\n\nFastAPI reads the JSON body, validates it against Item, and passes the typed object to your function.',
        tryIt: 'Create a User model with name, email, and an optional age field. Post to it from /docs.'
      },
      {
        id: 'fastapi-response-model',
        title: 'Response models',
        body: 'Declare the response shape with response_model:\n\nclass UserPublic(BaseModel):\n    id: int\n    name: str\n    # no password field here\n\nclass UserInternal(BaseModel):\n    id: int\n    name: str\n    password: str  # never sent to client\n\n@app.get("/users/{user_id}", response_model=UserPublic)\ndef get_user(user_id: int):\n    # Return UserInternal — FastAPI filters to UserPublic\n    return UserInternal(id=user_id, name="Alice", password="secret")\n\nresponse_model filters out fields not in the declared model. The password never leaves.',
        tryIt: 'Create a response model that excludes a sensitive field from your endpoint\'s output.'
      },
      {
        id: 'fastapi-validation',
        title: 'Field validation',
        body: 'Add constraints to Pydantic fields with Field:\n\nfrom pydantic import BaseModel, Field\n\nclass Product(BaseModel):\n    name: str = Field(min_length=1, max_length=100)\n    price: float = Field(gt=0, description="Price in USD")\n    quantity: int = Field(ge=0, le=1000)\n    sku: str = Field(pattern=r"^[A-Z]{3}-\\d{4}$")\n\nFastAPI returns a 422 with detailed error messages if any field fails validation. The error tells the client exactly which field and why.',
        tryIt: 'Add min_length to a CharField and test posting a string that is too short.'
      }
    ]
  },
  {
    id: 'fastapi-errors',
    title: 'Error Handling',
    sections: [
      {
        id: 'fastapi-http-exception',
        title: 'Raising HTTP exceptions',
        body: 'Use HTTPException to return error responses:\n\nfrom fastapi import HTTPException\n\ndb = {1: "Alice", 2: "Bob"}\n\n@app.get("/users/{user_id}")\ndef get_user(user_id: int):\n    if user_id not in db:\n        raise HTTPException(\n            status_code=404,\n            detail=f"User {user_id} not found"\n        )\n    return {"name": db[user_id]}\n\nFastAPI converts the exception into a JSON response:\n{"detail": "User 42 not found"}',
        tryIt: 'Raise a 400 HTTPException when a query parameter is an empty string.'
      },
      {
        id: 'fastapi-custom-exception',
        title: 'Custom exception handlers',
        body: 'Handle your own exception types with @app.exception_handler:\n\nfrom fastapi import Request\nfrom fastapi.responses import JSONResponse\n\nclass PermissionDenied(Exception):\n    def __init__(self, action: str):\n        self.action = action\n\n@app.exception_handler(PermissionDenied)\nasync def permission_handler(request: Request, exc: PermissionDenied):\n    return JSONResponse(\n        status_code=403,\n        content={"error": f"You cannot {exc.action}"}\n    )\n\n@app.get("/admin")\ndef admin_route():\n    raise PermissionDenied("access admin")',
        tryIt: 'Create a custom NotFound exception and an exception handler that returns a 404 JSON response.'
      }
    ]
  },
  {
    id: 'fastapi-cli',
    title: 'uvicorn CLI Commands',
    sections: [
      {
        id: 'fastapi-run',
        title: 'Running with uvicorn',
        body: 'All the uvicorn commands you will use:\n\n# Basic run (file main.py, variable app)\nuvicorn main:app\n\n# With auto-reload on file changes\nuvicorn main:app --reload\n\n# Custom host and port\nuvicorn main:app --host 0.0.0.0 --port 8080\n\n# Multiple worker processes (production)\nuvicorn main:app --workers 4\n\n# Log level control\nuvicorn main:app --reload --log-level debug\n\n# If your app file is server.py and variable is api:\nuvicorn server:api --reload',
        tryIt: 'Run uvicorn with --log-level debug and watch the request logs as you visit /docs.'
      },
      {
        id: 'fastapi-testing',
        title: 'Testing with TestClient',
        body: 'FastAPI comes with a test client based on httpx:\n\n# test_main.py\nfrom fastapi.testclient import TestClient\nfrom main import app\n\nclient = TestClient(app)\n\ndef test_root():\n    response = client.get("/")\n    assert response.status_code == 200\n    assert response.json() == {"message": "Hello, World!"}\n\ndef test_not_found():\n    response = client.get("/users/999")\n    assert response.status_code == 404\n\n# Run with:\npython -m pytest test_main.py -v',
        tryIt: 'Write a test that posts a valid item and checks that the response includes the item name.'
      }
    ]
  }
]
